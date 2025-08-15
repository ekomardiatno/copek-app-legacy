import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOST_REST_API } from '../components/Define';

export const getNearDrivers = location => {
  let uri = encodeURI(
    `${HOST_REST_API}driver/nearest/${location.lng}/${location.lat}`,
  );
  return new Promise((resolve, reject) => {
    AsyncStorage.getItem('token').then(v => {
      fetch(uri, {
        headers: {
          Authorization: `Bearer ${v}`,
        },
      })
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  });
};
