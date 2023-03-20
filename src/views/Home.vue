<template>
  <div>
    <div id="map"></div>
    <div style="position: absolute; right: 30px; bottom: 30px" >
      <button @click="startAnimation">开始动画</button>
      <button @click="stopAnimation">停止动画</button>
    </div>
  </div>
</template>

<script>
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import { XYZ , Vector as VectorSource} from 'ol/source.js'
import { Style, Fill, Stroke, Circle as sCircle, Icon } from "ol/style"
import { formatLength, getCenterPont, getRotation } from '../utils/openlayers/route'
import { LineString, Point } from 'ol/geom'
import Feature from 'ol/Feature'
import { getVectorContext } from 'ol/render'

export default {
  data() {
    return {
      map: null,
      view: null,
      tileLayer: null,
      routeLayer: null,
      routeSource: null,
      routes: [],
      routesAll: [],
      routeGeometry: null,
      carGeometry: null,
      carFeature: null,
      lastRouteIndex: 0,
      animating: false, // 动画是否进行中
      animationText: '开始',
      speed: 60,
      style: Object.freeze({
        route: new Style({
          stroke: new Stroke({
            lineDash: [2, 6, 10],
            width: 4,
            color: [0, 255, 0, 1],
          }),
        }),
        marker: new Style({
          image: new sCircle({
            radius: 10,
            stroke: new Stroke({
              color: "#fff",
            }),
            fill: new Fill({
              color: "#3399CC",
            }),
          }),
        }),
        carMarker: new Style({
          image: new Icon({
            rotation: 0,
            src: "/img/car.png",
            imgSize: [20, 36],
          }),
        }),
      })
    }
  },
  mounted() {
    this.initMap()
  },
  methods: {
    initMap() {
      this.tileLayer = new TileLayer({
        source: new XYZ({
          url: "https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}"
        })
      })
      this.routeSource = new VectorSource({ wrapX: false })
      this.routeLayer = new VectorLayer({
        source: this.routeSource,
        style: (feature) => {
          return this.style[feature.get('type')]
        }
      })
      this.map = new Map({
        target: 'map',
        layers: [this.tileLayer, this.routeLayer],
        view: new View({
          projection: 'EPSG:4326',
          center: [118.56412262012488, 25.079029496292097],
          zoom: 10
        })
      })
      this.getList()
      this.mapAddListner()
    },
    getList() {
      let data = [
        [118, 25],
        [118.5, 25],
        [118.5, 25.5],
        [119, 25]
      ]
      this.routes = data.map((item) => {
        return item
      })
      this.getRoutesAll()
      this.drawRoute()
    },
    drawRoute() { // 绘制路径
      if (this.routeGeometry) {
        this.routeGeometry.clear()
      }
      this.routeGeometry = new LineString(this.routes)
      let route = new Feature({
        type: 'route',
        geometry: this.routeGeometry
      })
      // 绘制点
      let points = this.drawPoint()
      // 添加小车
      let car = this.drawCar()
      this.routeSource.addFeatures([route, ...points, car])
      // 按轨迹边界缩放
      // this.mapFit()
    },
    drawPoint() { // 画点
      let iconFeatures = []
      this.routes.forEach(item => {
        let _feature = new Feature({
          type: 'marker',
          geometry: new Point(item)
        })
        iconFeatures.push(_feature)
      })
      return iconFeatures
    },
    drawCar() { // 小车
      this.carGeometry = new Point(this.routeGeometry.getFirstCoordinate())
      const carMarker = new Feature({
        type: 'carMarker',
        geometry: this.carGeometry
      })
      this.carFeature = carMarker
      return carMarker
    },
    mapFit() {
      let view = this.map.getView()
      view.fit(this.routeGeometry)
    },
    startAnimation() { // 开始动画
      this.animating = true
      this.lastTime = Date.now()
      this.animationText = '停止'
      this.routeLayer.on('postrender', this.moveFeature)
      this.carFeature.setGeometry(null)
    },
    stopAnimation() { // 停止动画
      this.animating = false
      this.animationText = '开始'
      this.carFeature.setGeometry(this.carGeometry)
      this.routeLayer.un('postrender', this.moveFeature)
    },
    moveFeature(event) { // 移动动画
      const len = this.routesAll.length
      if (this.lastRouteIndex < len - 1) {
        this.lastRouteIndex++
      } else {
        this.lastRouteIndex = 0
      }
      const current = this.routesAll[this.lastRouteIndex]
      this.carGeometry.setCoordinates(current.coordinate)
      // console.log(current.coordinate);
      this.carFeature.changed()
      const vectorContext = getVectorContext(event)
      let _style = new Style({
        image: new Icon({
          anchor: [0.5, 0.5],
          rotation: current.rotation,
          src: '/img/car.png',
          imgSize: [20, 36]
        })
      })
      vectorContext.setStyle(_style)
      vectorContext.drawGeometry(this.carGeometry)
      this.map.render()
    },
    getRoutesAll() { // 分割路径点
      this.lastRouteIndex = 0
      let _routesAll = [
        {
          coordinate: this.routes[0]
        }
      ]
      for (let i = 0; i < this.routes.length - 1; i++) {
        const item = this.routes[i]
        const itemNext = this.routes[i + 1]
        const rotation = getRotation(...item, ...itemNext)
        let points = getCenterPont(this.map, [item, itemNext], this.speed)
        points = points.map(item => {
          return {
            rotation,
            coordinate: item
          }
        })
        _routesAll = [..._routesAll, ...points]
      }
      this.routesAll = _routesAll
    },
    mapAddListner() {
      // const that = this
      this.map.on('singleclick', (e) => {
        console.log('coordinate: ', e.coordinate)
        console.log('pixel: ', e.pixel)
      })
    }
  }
}
</script>

<style scoped>
  #map {
    width: 100vw;
    height: 100vh;
  }
</style>