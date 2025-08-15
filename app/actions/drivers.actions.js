import AsyncStorage from '@react-native-async-storage/async-storage';
import { NODE_APP_URL } from '../components/Define';

export const getNearDrivers = location => {
  let uri = encodeURI(
    `${NODE_APP_URL}drivers/near/${location.lng}/${location.lat}`,
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
