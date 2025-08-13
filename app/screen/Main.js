/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  StatusBar,
  Dimensions,
  AppState,
  Platform,
  ToastAndroid,
  TouchableHighlight,
  Text,
  Image,
  ScrollView,
} from 'react-native';
import Color, { colorYiq } from '../components/Color';
import { MainMenu } from '../components/Components';
import { HOST_REST_API } from '../components/Define';
import cancellablePromise from '../helpers/cancellablePromise';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCurrentPosition } from '../actions/locations.actions';
import Icon from '@react-native-vector-icons/ionicons';
import Geolocation from '@react-native-community/geolocation';
const { width, height } = Dimensions.get('window');

export default class Main extends Component {
  timer;
  constructor(props) {
    super(props);
    this.state = {
      hasConnection: true,
      ready: false,
      isLocationReady: false,
      isGeolocationActive: false,
      statusConnection: '',
      user: null,
    };
  }

  pendingPromises = [];

  appendPendingPromise = promise => {
    this.pendingPromises = [...this.pendingPromises, promise];
  };

  removePendingPromise = promise => {
    this.pendingPromises = this.pendingPromises.filter(p => p !== promise);
  };

  componentDidMount() {
    console.log(this.props);
    // AsyncStorage.removeItem('currentLocation')
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setBarStyle('dark-content', true);
    AppState.addEventListener('change', this._handleAppState);
    this._fetchGetUser();

    Geolocation.getCurrentPosition(e => {
      this._onLocation(e.coords);
    });
  }

  _fetchGetUser = () => {
    this.setState({
      statusConnection: 'FETCHING',
    });
    const wrappedPromise = cancellablePromise(this._promiseGetUser());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(user => {
        if (user !== null) {
          this.setState(
            {
              user: user,
            },
            () => {
              this._getFareSettings();
            },
          );
        } else {
          AsyncStorage.removeItem('user_logged_in', error => {
            if (!error) {
              AsyncStorage.removeItem('orders');
              this.props.navigation.replace('Login');
            }
          });
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(() => {
        this.setState({
          statusConnection: 'ERROR',
        });
      });
  };

  _promiseGetUser = () => {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('user_logged_in', (error, result) => {
        if (!error) {
          if (result !== null) {
            const user = JSON.parse(result);
            console.log(`${HOST_REST_API}user/${user.userPhone}`);
            fetch(`${HOST_REST_API}user/${user.userPhone}`)
              .then(res => res.json())
              .then(resolve)
              .catch(reject);
          }
        }
      });
    });
  };

  componentWillUnmount() {
    // AppState.removeEventListener('change', this._handleAppState);
    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
    clearTimeout(this.timer);
  }

  _handleAppState = nextAppState => {
    if (nextAppState === 'active') {
      Geolocation.watchPosition(
        e => {
          this._onLocation(e.coords);
        },
        undefined,
        {
          enableHighAccuracy: true,
        },
      );
    }
  };

  _onLocation = position => {
    const wrappedPromise = cancellablePromise(setCurrentPosition(position));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(res => {
        console.log(res);
        clearTimeout(this.timer);
        this.setState({
          isLocationReady: true,
        });
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      });
  };

  _navigate = (screen, data) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: 'transparent',
      },
      data: data,
    });
  };

  _getFareSettings = () => {
    this.setState({
      statusConnection: 'FETCHING',
    });
    const wrappedPromise = cancellablePromise(this._promiseFareSettings());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(res => {
        AsyncStorage.setItem('fare', JSON.stringify(res), () => {
          this.setState({
            ready: true,
          });
        });
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(e => {
        this.setState({
          statusConnection: 'ERROR',
        });
      });
  };

  _promiseFareSettings = () => {
    return new Promise((resolve, reject) => {
      fetch(`${HOST_REST_API}fare`)
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: StatusBar.currentHeight,
              backgroundColor: Color.white,
              zIndex: 2,
              opacity: 0.5,
            },
          ]}
        />
        <View
          style={{
            paddingHorizontal: 15,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: (1.5 / 4) * width,
              height: (1.5 / 4) * width,
              backgroundColor: Color.purple,
              marginTop: (1 / 4) * width,
              marginBottom: (1 / 4) * width,
              borderRadius: 20,
            }}
          >
            <Image
              style={[
                {
                  width: '100%',
                  height: '100%',
                },
              ]}
              resizeMode="contain"
              source={require('../images/copek.png')}
            />
          </View>
        </View>
        <View style={{ position: 'relative', flex: 1, zIndex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
          >
            <View>
              <View
                style={[
                  {
                    flex: 1,
                    paddingVertical: 15,
                    paddingHorizontal: 0,
                    backgroundColor: Color.white,
                    borderWidth: 1, 
                    borderColor: Color.borderColor,
                    marginHorizontal: 15,
                    borderRadius: 20,
                  },
                ]}
              >
                {this.state.statusConnection === 'ERROR' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      marginHorizontal: 15,
                      backgroundColor: Color.red,
                      borderRadius: 4,
                      marginTop: 5,
                    }}
                  >
                    <View style={{ flex: 1, marginHorizontal: 5 }}>
                      <Text
                        style={{ color: colorYiq(Color.red), fontSize: 13 }}
                      >
                        Tidak dapat terhubung ke sistem
                      </Text>
                    </View>
                    <TouchableHighlight
                      underlayColor={Color.black}
                      onPress={() => {
                        if (this.state.user === null) {
                          this._fetchGetUser();
                        } else {
                          this._getFareSettings();
                        }
                      }}
                      style={{ marginHorizontal: 5, borderRadius: 30 / 2 }}
                    >
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 30 / 2,
                          backgroundColor: colorYiq(Color.red),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon color={Color.red} name="refresh" size={18} />
                      </View>
                    </TouchableHighlight>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <MainMenu
                    onPress={() => {
                      this.state.ready && this.state.isLocationReady
                        ? this._navigate('Ride')
                        : ToastAndroid.show(
                            'Aplikasi belum terhubung ke sistem',
                            ToastAndroid.SHORT,
                          );
                    }}
                    fa="motorcycle"
                    color={
                      this.state.ready && this.state.isLocationReady
                        ? Color.purple
                        : Color.grayLight
                    }
                    title="Ride"
                  />
                  <MainMenu
                    onPress={() => {
                      this.state.ready && this.state.isLocationReady
                        ? this._navigate('Food')
                        : ToastAndroid.show(
                            'Aplikasi belum terhubung ke sistem',
                            ToastAndroid.SHORT,
                          );
                    }}
                    fa="utensils"
                    color={
                      this.state.ready && this.state.isLocationReady
                        ? Color.red
                        : Color.grayLight
                    }
                    title="Food"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
}
