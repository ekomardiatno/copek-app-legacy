import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_MAPS_API_KEY } from '../components/Define';
export const DATA_PLACES = 'DATA_PLACES';

export const setCurrentPosition = position => {
  let promise = new Promise((resolve, reject) => {
    AsyncStorage.setItem('currentLocation', JSON.stringify(position), error => {
      if (!error) {
        resolve(position);
      } else {
        reject(error);
      }
    });
  });

  return promise;
};

export const getCurrentPosition = () => {
  let promise = new Promise((resolve, reject) => {
    AsyncStorage.getItem('currentLocation', (error, result) => {
      if (!error) {
        if (result !== null) {
          result = JSON.parse(result);
          resolve(result);
        } else {
          reject(error);
        }
      } else {
        reject(error);
      }
    });
  });

  return promise;
};

export const getDataPlaces = (latLng, keyword, nextPageToken) => {
  const search = new URLSearchParams();
  if (nextPageToken) {
    search.append('pagetoken', nextPageToken);
  } else {
    if (latLng) {
      search.append('location', latLng);
    }
    if (keyword) {
      search.append('keyword', keyword);
    }
  }
  search.append('key', GOOGLE_MAPS_API_KEY);
  search.append('rankby', 'distance');
  search.append('language', 'id');
  console.log(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${search}`)
  return new Promise((resolve, reject) => {
    fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${search}`,
    )
      .then(res => res.json())
      .then(places => {
        resolve(places);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const dataPlaces = data => {
  return dispatch => {
    dispatch({
      type: DATA_PLACES,
      payload: data,
    });
  };
};

export const getDistanceMatrix = (origin, destination) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`,
    )
      .then(res => res.json())
      .then(resolve)
      .catch(reject);
  });
};

export const getDirections = (origin, destination) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`,
    )
      .then(res => res.json())
      .then(resolve)
      .catch(reject);
  });
};
