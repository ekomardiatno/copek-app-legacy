/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import { useCallback, useEffect } from 'react';
import {
  PermissionsAndroid, Alert,
  BackHandler,
  Linking,
  View
} from 'react-native';
import { version } from './package.json';
import { HOST_REST_API } from './app/components/Define';
import { persistor, store } from './app/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Navigation from './app/Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const requestLocationPermission = useCallback(async () => {
    let permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message:
          'This App needs access to your location ' +
          'so we can know where you are.',
      },
    );

    if (permission !== 'granted') {
      requestLocationPermission();
    } else if (permission === 'never_ask_again') {
      Linking.openSettings();
    }
  }, []);

  const checkVersion = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const result = await fetch(`${HOST_REST_API}app-version/copek`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!result.ok) {
        throw new Error('Failed to get version list');
      }
      const res = await result.json();
      if (res.length) {
        const find = res.find(item => {
          return item.appVersionName === version;
        });
        if (!find) {
          Alert.alert(
            'Aplikasi telah diperbarui',
            'Silakan perbarui aplikasi ke versi terbaru',
            [
              {
                text: 'Keluar',
                onPress: () => {
                  BackHandler.exitApp();
                },
              },
              {
                text: 'Perbarui',
                onPress: () => {
                  BackHandler.exitApp();
                  Linking.openURL('market://details?id=com.koma.copek');
                },
              },
            ],
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    requestLocationPermission();
    checkVersion();
  }, [requestLocationPermission, checkVersion]);

  return (
    <Provider store={store}>
      <PersistGate
        loading={<View style={{ flex: 1, backgroundColor: '#fff' }}></View>}
        persistor={persistor}
      >
        <SafeAreaProvider>
          <Navigation />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
