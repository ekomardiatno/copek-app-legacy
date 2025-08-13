import { HOST_REST_API } from '../components/Define'

export const getNearDrivers = (location) => {
  let uri = encodeURI(`${HOST_REST_API}driver/nearest/${location.lng}/${location.lat}`)
  return new Promise((resolve, reject) => {
    fetch(uri)
      .then(res => res.json())
      .then(resolve)
      .catch(reject)
  })
}