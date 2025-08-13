import AsyncStorage from '@react-native-async-storage/async-storage'

export const getFare = async (distance, category = 'ride') => {
  let fareSettings = await getSettings()
  let minimalDistance = 2000
  let minimalPaid = 5000
  let paidByDistance = 2000
  if(fareSettings !== null) {
    if(category === 'ride') {
      fareSettings = fareSettings.ride
    } else if(category === 'food') {
      fareSettings = fareSettings.food
    } else {
      fareSettings = null
    }
    if(fareSettings !== null) {
      minimalDistance = parseInt(fareSettings.fareMinimalDistance)
      minimalPaid = parseInt(fareSettings.fareMinimalPaid)
      paidByDistance = parseInt(fareSettings.farePaidByDistance)
    }
  }

  distance = (distance / 1000).toFixed(1)
  distance = distance.toString().split('.')
  if(parseInt(distance[1]) <= 5) {
    distance = parseInt(distance[0]) + .5 
  } else {
    distance = parseInt(distance[0]) + 1
  }
  if(minimalDistance > 0) {
    return distance > (minimalDistance / 1000).toFixed(1) ? ((distance - 2) * paidByDistance) + minimalPaid : minimalPaid
  } else {
    return distance * paidByDistance
  }
}

async function getSettings() {
  try {
    let fare = await AsyncStorage.getItem('fare')
    if(fare !== null) {
      fare = JSON.parse(fare)
    }
    return fare
  } catch {
    return null
  }
}