import { getDistance } from "ol/sphere"
import { transform } from "ol/proj"

/**
 * 根据坐标获取弧度
 */
export function getRotation (lng1, lat1, lng2, lat2) {
  let rotation = Math.atan2(lng2 - lng1, lat2 - lat1)
  return rotation
}

/**
 * 计算两点坐标之间的距离
 */
export function formatLength(map, pointArray) {
  let length = 0
  if (map.getView().getProjection().code_ === 'EPSG:4326') {
    for (let i = 0; i < pointArray.length - 1; i++) {
      let coordinate1 = pointArray[i]
      let coordinate2 = pointArray[i + 1]
      length += getDistance(coordinate1, coordinate2)
    }
  } else if (map.getView().getProjection().code_ === 'EPSG:3857') {
    for (let i = 0; i < pointArray.length - 1; i++) {
      let coordinate1 = pointArray[i]
      let coordinate2 = pointArray[i + 1]
      coordinate1 = transform(coordinate1, 'EPSG:3857', 'EPSG:4326')
      coordinate2 = transform(coordinate2, 'EPSG:3857', 'EPSG:4326')
      length += getDistance(coordinate1, coordinate2)
    }
  }
  return length
}


export function getCenterPont(map, pointDoubleArray, speed) {
  speed = speed === undefined ? 10 : speed
  let twolength = formatLength(map, pointDoubleArray)
  let rate = twolength / speed; // 比例 ，默认 10m/点
  let step = Math.ceil(rate) // 步数（向上取整）
  let arr = new Array() // 定义存储中间点数组
  let coordinate1 = pointDoubleArray[0] // 头部点
  let coordinate2 = pointDoubleArray[1] // 尾部点
  let x1 = coordinate1[0]
  let y1 = coordinate1[1]
  let x2 = coordinate2[0]
  let y2 = coordinate2[1]
  for (let i = 0; i < step; i++) {
    let coor = new Array(2)
    coor[0] = ((x2 - x1) * i) / rate + x1
    coor[1] = ((y2 - y1) * i) / rate + y1
    arr.push(coor) // 此时 arr 为中间点的坐标
  }
  arr.push(coordinate2)
  return arr
}