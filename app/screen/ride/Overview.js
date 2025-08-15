import { Component } from 'react';
import {
  View,
  Text,
  StatusBar,
  Alert,
  ToastAndroid,
  Platform,
  TouchableHighlight,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Fa from '@react-native-vector-icons/fontawesome5';
import Color, { colorYiq } from '../../components/Color';
import {
  Input,
  Button,
  SimpleHeader,
  DummyFareRide,
} from '../../components/Components';
import Currency from '../../helpers/Currency';
import DistanceFormat from '../../helpers/DistanceFormat';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Polyline as Direction,
} from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Polyline from '@mapbox/polyline';
import cancellablePromise from '../../helpers/cancellablePromise';
import {
  getDistanceMatrix,
  getDirections,
} from '../../actions/locations.actions';
import { getFare } from '../../actions/fare.actions';
import {
  LATITUDE_DELTA,
  LONGITUDE_DELTA,
  HOST_REST_API,
} from '../../components/Define';
import Toast from 'react-native-simple-toast';

class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      distances: null,
      coords: [],
      region: {
        latitude: -0.5327255,
        longitude: 101.570019,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      origin: null,
      destination: null,
      mapView: true,
      note: '',
      fare: 0,
      bookingLoading: false,
    };
  }

  pendingPromises = [];

  appendPendingPromise = promise => {
    this.pendingPromises = [...this.pendingPromises, promise];
  };

  removePendingPromise = promise => {
    this.pendingPromises = this.pendingPromises.filter(p => p !== promise);
  };

  componentWillUnmount() {
    this.pendingPromises.map(p => p.cancel());
    if (this.props.route.params?.statusbar) {
      StatusBar.setBarStyle(this.props.route.params?.statusbar.barStyle, true);
      Platform.OS === 'android' &&
        StatusBar.setBackgroundColor(
          this.props.route.params?.statusbar.background,
          true,
        );
    }

    if (this.props.route.params?.addBackListener) {
      this.props.route.params?.addBackListener();
    }
  }

  componentDidMount() {
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor('rgba(255,255,255,.65)', true);
    StatusBar.setBarStyle('dark-content', true);
    if (this.props.route.params?.removeBackListener) {
      this.props.route.params?.removeBackListener();
    }
  }

  _mapReady = () => {
    if (this.props.route.params?.data) {
      let data = this.props.route.params?.data;
      const MARKERS = [data[0].geometry, data[1].geometry];
      this.setState(
        {
          origin: data[0],
          destination: data[1],
        },
        () => {
          this._getStarted();
        },
      );
    }
  };

  _getStarted = () => {
    const wrappedPromise = cancellablePromise(
      this._getDirections(
        this.state.origin.geometry,
        this.state.destination.geometry,
      ),
    );
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(coords => {
        this.setState({
          coords,
        });
      })
      .then(() => {
        this._getDistances();
        this.removePendingPromise(wrappedPromise);
        this._mapView.fitToElements(true);
      })
      .catch(error => {
        Alert.alert(
          'Gagal mendapatkan rute',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getStarted,
            },
            {
              text: 'Kembali',
              onPress: () => {
                this.props.navigation.goBack();
              },
            },
          ],
          { cancelable: false },
        );
      });
  };

  _getDistances = () => {
    const { origin, destination } = this.state;
    const wrappedPromise = cancellablePromise(
      getDistanceMatrix(origin.geometry, destination.geometry),
    );
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(async distances => {
        this.setState({
          distances: {
            distance: distances.rows[0].elements[0].distance.value,
            duration: distances.rows[0].elements[0].duration.value,
          },
          fare: await getFare(distances.rows[0].elements[0].distance.value),
        });
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        Alert.alert(
          'Gagal menghitung jarak',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getDistances,
            },
            {
              text: 'Kembali',
              onPress: () => {
                this.props.navigation.goBack();
              },
            },
          ],
          { cancelable: false },
        );
      });
  };

  _getDirections = async (origin, destination) => {
    try {
      let directions = await getDirections(origin, destination);
      let points = Polyline.decode(
        directions.routes[0].overview_polyline.points,
      );
      let coords = points.map((point, index) => {
        return {
          latitude: point[0],
          longitude: point[1],
        };
      });
      return coords;
    } catch (error) {
      return error;
    }
  };

  _navigate = (screen, params = {}) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: Color.white,
      },
      map: {
        close: () => {
          this.setState({
            mapView: false,
          });
        },
        open: () => {
          this.setState({
            mapView: true,
          });
        },
      },
      ...params,
    });
  };

  _changeOrigin = origin => {
    this.setState(
      {
        origin,
      },
      () => {
        this.props.route.params?.setOrigin &&
          this.props.route.params?.setOrigin(origin);
        this._getStarted();
      },
    );
  };

  _changeDestination = destination => {
    this.setState(
      {
        destination,
      },
      () => {
        this.props.route.params?.setDestination &&
          this.props.route.params?.setDestination(destination);
        this._getStarted();
      },
    );
  };

  _booking = () => {
    this.setState({
      bookingLoading: true,
    });
    const wrappedPromise = cancellablePromise(this._promiseCheckOrderStatus());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(res => {
        if (res.length > 0) {
          for (let i = 0; i < res.length; i++) {
            AsyncStorage.getItem('orders', (err, order) => {
              if (order !== null) {
                order = JSON.parse(order);
                let index = order
                  .map(item => {
                    return item.orderId;
                  })
                  .indexOf(res[i].orderId.toString());
                if (res[i].status !== null) {
                  order[index].status = res[i].status;
                } else {
                  order.splice(index, 1);
                }
                AsyncStorage.setItem('orders', JSON.stringify(order), error => {
                  if (i + 1 >= res.length) {
                    this._checkOrderUnfinishedAndBooking();
                  }
                });
              }
            });
          }
        } else {
          this._checkOrderUnfinishedAndBooking();
        }
      })
      .then(() => this.removePendingPromise(wrappedPromise))
      .catch(err => {
        Alert.alert(
          'Gagal membuat pesanan',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
        );
      });
  };

  _checkOrderUnfinishedAndBooking = () => {
    AsyncStorage.getItem(
      'orders',
      async function (err, orders) {
        let length = 0,
          array = [];
        if (orders !== null) {
          orders = JSON.parse(orders);
          for (let i = 0; i < orders.length; i++) {
            if (
              orders[i].status !== 'completed' &&
              orders[i].status !== 'cancelled_by_user' &&
              orders[i].status !== 'cancelled_by_driver'
            ) {
              array.push(orders[i]);
            }
          }
          length = array.length;
        }
        if (length > 0) {
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Anda memiliki pesanan yang belum selesai',
              ToastAndroid.SHORT,
            );
          } else {
            Toast.show('Anda memiliki pesanan yang belum selesai', Toast.SHORT);
          }
        } else {
          this._navigate('Booking', {
            orderType: 'RIDE',
            origin: this.state.origin,
            fare: this.state.fare,
            destination: this.state.destination,
            distances: this.state.distances,
            note: this.state.note,
          });
        }
        this.setState({
          bookingLoading: false,
        });
      }.bind(this),
    );
  };

  _promiseCheckOrderStatus = () => {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('orders', (error, result) => {
        if (!error && result !== null) {
          result = JSON.parse(result);
          let filtered = result.filter(a => {
            return (
              a.status !== 'completed' &&
              a.status !== 'cancelled_by_user' &&
              a.status !== 'cancelled_by_driver'
            );
          });
          if (filtered.length > 0) {
            filtered = filtered.map(a => {
              return a.orderId;
            });
            AsyncStorage.getItem('token').then(v => {
              fetch(`${HOST_REST_API}order/checking`, {
                method: 'post',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(filtered),
                Authorization: `Bearer ${v}`,
              })
                .then(res => res.json())
                .then(resolve)
                .catch(reject);
            });
          } else {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      });
    });
  };

  render() {
    console.log(this.state.origin);
    return (
      <View style={{ flex: 1, backgroundColor: Color.grayLighter }}>
        <SimpleHeader
          goBack
          navigation={this.props.navigation}
          backBtnStyle={{ backgroundColor: 'white', elevation: 5 }}
          style={{
            position: 'absolute',
            top: 0,
            backgroundColor: 'transparent',
            zIndex: 10,
          }}
        />
        {this.state.mapView && (
          <MapView
            onMapReady={this._mapReady}
            showsCompass={false}
            ref={_mapView => (this._mapView = _mapView)}
            provider={PROVIDER_GOOGLE}
            initialRegion={this.state.region}
            style={{ flex: 1 }}
            mapPadding={{
              top: StatusBar.currentHeight + 45,
              left: 15,
              right: 15,
              bottom: 271 + 50,
            }}
          >
            {this.state.origin !== null ? (
              <Marker
                coordinate={this.state.origin.geometry}
                image={require('../../images/icons/passenger-marker.png')}
              />
            ) : null}
            {this.state.destination !== null ? (
              <Marker
                coordinate={this.state.destination.geometry}
                image={require('../../images/icons/destination-marker.png')}
              />
            ) : null}
            <Direction
              coordinates={this.state.coords}
              strokeWidth={4}
              strokeColor={Color.green}
            />
          </MapView>
        )}
        {this.state.distances ? (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              backgroundColor: Color.white,
              elevation: 5,
            }}
          >
            <SafeAreaView>
              <View style={{ paddingTop: 10, paddingBottom: 15 }}>
                <View
                  style={{
                    borderBottomWidth: 5,
                    borderBottomColor: Color.grayLighter,
                  }}
                >
                  <View style={{ marginBottom: 8 }}>
                    <TouchableHighlight
                      onPress={() => {
                        this._navigate('MapSelecting', {
                          selectLocation: this._changeOrigin,
                          selectType: 'pickup',
                          selectedLocation: this.state.origin.geometry,
                        });
                      }}
                      activeOpacity={0.85}
                      underlayColor="#fff"
                    >
                      <View
                        style={{
                          paddingHorizontal: 15,
                          paddingVertical: 12,
                          flexDirection: 'row',
                        }}
                      >
                        <View>
                          <View
                            style={{
                              width: 30,
                              height: 30,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 45 / 2,
                              backgroundColor: Color.secondary,
                            }}
                          >
                            <Fa
                              iconStyle="solid"
                              color={Color.white}
                              size={18}
                              name="user"
                            />
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 10, flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 10, textTransform: 'uppercase' }}
                          >
                            Lokasi jemput
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 15,
                              fontWeight: 'bold',
                              lineHeight: 20,
                            }}
                          >
                            {this.state.origin.geocode.title}
                          </Text>
                          {/* <Text numberOfLines={2} style={{ fontSize: 13, color: Color.textMuted }}>Jl. Nusa Indah, Sungai Dawu, Rengat Bar., Kabupaten Indragiri Hulu, Riau 29351, Indonesia</Text> */}
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 5,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Fa
                            iconStyle="solid"
                            color={Color.gray}
                            name="chevron-right"
                          />
                        </View>
                      </View>
                    </TouchableHighlight>
                    <TouchableHighlight
                      onPress={() => {
                        this._navigate('MapSelecting', {
                          selectLocation: this._changeDestination,
                          selectedLocation: this.state.destination.geometry,
                        });
                      }}
                      activeOpacity={0.85}
                      underlayColor="#fff"
                    >
                      <View
                        style={{
                          paddingHorizontal: 15,
                          paddingVertical: 12,
                          flexDirection: 'row',
                        }}
                      >
                        <View>
                          <View
                            style={{
                              width: 30,
                              height: 30,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 45 / 2,
                              backgroundColor: Color.primary,
                            }}
                          >
                            <Fa
                              iconStyle="solid"
                              color={Color.white}
                              size={16}
                              name="map-marker-alt"
                            />
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 10, flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 10, textTransform: 'uppercase' }}
                          >
                            Lokasi tujuan •{' '}
                            {DistanceFormat(this.state.distances.distance)}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 15,
                              fontWeight: 'bold',
                              lineHeight: 20,
                            }}
                          >
                            {this.state.destination.geocode.title}
                          </Text>
                          {/* <Text numberOfLines={2} style={{ fontSize: 13, color: Color.textMuted }}>Pematang Reba, Rengat Barat, Pematang Reba, Rengat Bar, Kabupaten Indragiri Hulu, Riau 29351, Indonesia</Text> */}
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 5,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Fa
                            iconStyle="solid"
                            color={Color.gray}
                            name="chevron-right"
                          />
                        </View>
                      </View>
                    </TouchableHighlight>
                    <View style={{ position: 'absolute', left: 28.5, top: 46 }}>
                      <View>
                        <View
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: Color.grayLight,
                            marginVertical: 2,
                          }}
                        ></View>
                        <View
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: Color.grayLight,
                            marginVertical: 2,
                          }}
                        ></View>
                        <View
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: Color.grayLight,
                            marginVertical: 2,
                          }}
                        ></View>
                      </View>
                    </View>
                  </View>
                  <View style={{ paddingHorizontal: 15, marginBottom: 15 }}>
                    <Input
                      value={this.state.note}
                      onChangeText={note => {
                        this.setState({ note });
                      }}
                      feather
                      icon="clipboard"
                      placeholder="Tambahkan catatan untuk driver"
                    />
                  </View>
                </View>
                <View
                  style={{
                    paddingHorizontal: 15,
                    paddingTop: 10,
                    borderTopColor: Color.borderColor,
                    borderTopWidth: 1,
                  }}
                >
                  {/* <View style={{ flexDirection: 'row', marginBottom: 6, marginHorizontal: -3, alignItems: 'flex-start' }}>
                    <Text style={{ flex: 1, fontSize: 13, marginHorizontal: 3 }}>Tarif</Text>
                    <Text style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 'bold', marginHorizontal: 3 }}>{Currency(this.state.distances.distance > 2000 ? (this.state.distances.distance / 2000).toFixed(0) * 5000 : 5000)}</Text>
                  </View> */}
                  {this.state.bookingLoading ? (
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 3,
                        paddingHorizontal: 15,
                        height: 40,
                        backgroundColor: Color.primary,
                        elevation: 3,
                      }}
                    >
                      <ActivityIndicator
                        size={19}
                        color={colorYiq(Color.primary)}
                      />
                    </View>
                  ) : (
                    <Button
                      onPress={this._booking}
                      component={
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>Pesan sekarang</Text>
                          <Text style={{ fontSize: 13, fontWeight: 'bold' }}>
                            {Currency(this.state.fare)}
                          </Text>
                        </View>
                      }
                    />
                  )}
                </View>
              </View>
            </SafeAreaView>
          </View>
        ) : (
          <DummyFareRide />
        )}
      </View>
    );
  }
}

export default Overview;
