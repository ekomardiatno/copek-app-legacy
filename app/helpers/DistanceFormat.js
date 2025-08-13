export default function DistanceFormat(val) {
  let satuan = 'm'
  if(val >= 500) {
    val = val / 1000
    val = val.toFixed(2)
    satuan = 'km'
  }

  return val + ' ' + satuan
}