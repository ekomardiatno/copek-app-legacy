import { GOOGLE_MAPS_API_KEY } from "../components/Define"

export const getGeocoding = (position) => {
  return new Promise((resolve, reject) => {
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.latitude},${position.longitude}&key=${GOOGLE_MAPS_API_KEY}`)
      .then(result => result.json())
      .then(resolve)
      .catch(reject)
  })
}

export const getAddressComponents = (geocode) => {
  const route = geocode.results.find(r => r.types.includes('route'))
  let address_components = route?.address_components || geocode.results[0].address_components

  let title = ''
  const routeTrimmed = address_components?.find(r => r.types.includes('route'))
  if (routeTrimmed) {
    title = routeTrimmed.short_name
  } else {
    title = address_components[0].short_name
  }
  return [title, route?.formatted_address || geocode.results[0].formatted_address]
}