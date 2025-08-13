/* eslint-disable no-return-assign */
import { Component } from 'react';
import {
  View,
  Text,
  BackHandler,
  ToastAndroid,
  Image,
  StatusBar,
  Alert,
  AppState,
  Animated, Linking,
  ActivityIndicator,
  Platform,
  TouchableHighlight,
  SafeAreaView
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  AnimatedRegion,
  Polyline as Direction,
} from 'react-native-maps';
import {
  LATITUDE_DELTA,
  LONGITUDE_DELTA,
  NODE_APP_URL,
  HOST_REST_API,
} from '../components/Define';
import Color, { colorYiq } from '../components/Color';
import {
  Button,
  BookingStatus,
  Card,
  SimpleHeader,
} from '../components/Components';
import Fa from '@react-native-vector-icons/fontawesome5';
import { getNearDrivers } from '../actions/drivers.actions';
import { getDirections } from '../actions/locations.actions';
import cancellablePromise from '../helpers/cancellablePromise';
import io from 'socket.io-client';
import Polyline from '@mapbox/polyline';
import AsyncStorage from '@react-native-async-storage/async-storage';
import phoneNumFormat from '../helpers/phoneNumFormat';
import getImageThumb from '../helpers/getImageThumb';
import Toast from 'react-native-simple-toast';

class Booking extends Component {
  timer;
  timeoutPolyline;
  timeoutNextDriver;
  timerConnect;
  backHandler;
  constructor(props) {
    super(props);
    this.state = {
      driverCandidate: [],
      driver: null,
      driverCoord: null,
      driverTemporary: null,
      indexCandidate: 0,
      orderId: null,
      orderType: '',
      dateString: '',
      status: 'search_driver',
      receiverId: '',
      region: {
        latitude: -0.5327255,
        // latitude: -0.39601500329,
        longitude: 101.570019,
        // longitude: 102.4153175120702,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      merchant: undefined,
      nextAppState: AppState.currentState,
      carts: undefined,
      origin: undefined,
      destination: null,
      destinationMarker: false,
      fare: 0,
      distances: null,
      polyline: [],
      polylineCoords: {
        origin: {
          latitude: 0,
          longitude: 0,
        },
        destination: {
          latitude: 0,
          longitude: 0,
        },
      },
      orderDate: null,
      customer: {},
      note: '',
      hasNewChats: false,
      chats: [],
      newChatLength: 0,
      opacityBoxNotif: new Animated.Value(0),
      cancelling: false,
      isConnected: false,
      preventBack: true,
      readyConnect: false,
    };

    const dataOrder = this.props.route.params?.dataOrder;
    if (
      dataOrder === undefined ||
      (dataOrder.status !== 'completed' &&
        dataOrder.status !== 'cancelled_by_user' &&
        dataOrder.status !== 'cancelled_by_driver')
    ) {
      let socket = io(
        `${NODE_APP_URL}`,
        // {
        //   autoConnect: false,
        //   reconnectionDelay: 1000,
        //   reconnection: true,
        //   transports: ['websocket'],
        //   agent: false,
        //   // [2] Please don't set this to true
        //   upgrade: false,
        //   rejectUnauthorized: false
        // }
      );
      this.socket = socket;
      this.socket.on(
        'connect',
        function () {
          clearTimeout(this.timerConnect);
          this.setState({
            isConnected: true,
            readyConnect: true,
          });
        }.bind(this),
      );
      this.socket.on(
        'disconnect',
        function () {
          this.setState({
            isConnected: false,
          });
        }.bind(this),
      );
    }
  }

  componentDidMount() {
    this.timerConnect = setTimeout(
      function () {
        this.setState({
          readyConnect: true,
        });
      }.bind(this),
      5000,
    );
    if (this.props.route.params?.map) {
      this.props.route.params?.map.close();
    }
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      this.preventBackButton,
    );
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor('rgba(255,255,255,.65)', true);
    StatusBar.setBarStyle('dark-content', true);
    AppState.addEventListener('change', this._handleAppStateChange);
    AsyncStorage.getItem('user_logged_in', (error, user) => {
      if (!error) {
        if (user != null) {
          user = JSON.parse(user);
          this.setState({
            customer: user,
            receiverId: user.userId,
          });
        }
      }
    });
  }

  componentWillUnmount() {
    this.backHandler?.remove();
    if (this.props.route.params?.map) {
      this.props.route.params?.map.open();
    }
    if (this.props.route.params?.actionBack) {
      this.props.route.params?.actionBack();
    }
    if (this.props.route.params?.statusbar) {
      StatusBar.setBarStyle(this.props.route.params?.statusbar.barStyle, true);
      Platform.OS === 'android' &&
        StatusBar.setBackgroundColor(
          this.props.route.params?.statusbar.background,
          true,
        );
    }
    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
    if (this.socket) {
      this.socket.disconnect();
    }
    clearTimeout(this.timeoutPolyline);
    clearTimeout(this.timeoutNextDriver);
  }

  _socket = () => {
    const socket = this.socket;
    const { orderId, receiverId } = this.state;
    socket.on(
      'connect',
      function () {
        this._getOrderStatus();
        this._getChats();
      }.bind(this),
    );
    socket.on(
      `${receiverId}_receive_response`,
      function (status) {
        clearTimeout(this.timeoutNextDriver);
        if (status === 'ACCEPT') {
          this.setState(
            {
              driver: this.state.driverTemporary,
              driverCoord: new AnimatedRegion({
                latitude: this.state.driverTemporary.driverLatitude,
                longitude: this.state.driverTemporary.driverLongitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              }),
            },
            () => {
              this._postOrder();
            },
          );
        } else {
          this.setState(
            {
              indexCandidate: this.state.indexCandidate + 1,
            },
            () => {
              this._findConnectedDriver();
            },
          );
        }
      }.bind(this),
    );
    socket.on(
      `${receiverId}_receive_order_status`,
      function (status) {
        this.setState(
          {
            status: status,
          },
          () => {
            AsyncStorage.getItem('orders', (err, order) => {
              if (order !== null) {
                order = JSON.parse(order);
                let index = order
                  .map(item => {
                    return item.orderId;
                  })
                  .indexOf(orderId.toString());
                order[index].status = status;
                AsyncStorage.setItem('orders', JSON.stringify(order), () => {
                  this._makePolyline();
                });
              }
            });
          },
        );
      }.bind(this),
    );
    socket.on(
      `${receiverId}_receive_coordinate`,
      function (coordinate) {
        let duration = 300;
        this.state.driverCoord !== null &&
          this.state.driverCoord
            .timing({
              ...coordinate,
              duration: duration,
            })
            .start();
      }.bind(this),
    );
    socket.on(
      `${receiverId}_receive_order_cancellation`,
      function () {
        AsyncStorage.getItem('orders', (err, order) => {
          if (order !== null) {
            order = JSON.parse(order);
            let index = order
              .map(item => {
                return item.orderId;
              })
              .indexOf(orderId.toString());
            order[index].status = 'cancelled_by_driver';
            AsyncStorage.setItem('orders', JSON.stringify(order), () => {
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  'Driver membatalkan pesanan anda',
                  ToastAndroid.SHORT,
                );
              } else {
                Toast.show('Driver membatalkan pesanan anda', Toast.SHORT);
              }
              this.props.navigation.goBack();
            });
          }
        });
      }.bind(this),
    );
    socket.on(
      `${receiverId}_receive_chat`,
      function (chat) {
        this.setState(
          {
            hasNewChats: true,
            chats: [
              ...this.state.chats,
              {
                ...chat,
              },
            ],
            newChatLength: this.state.newChatLength + 1,
          },
          () => {
            this._saveChatOnStorage({
              orderId: chat.orderId,
              sender: chat.sender,
              text: chat.text,
              dateTime: chat.dateTime,
            });
            Animated.timing(this.state.opacityBoxNotif, {
              toValue: 1,
              duration: 500,
            }).start();
            if (this.state.newChatLength > 0) {
              clearTimeout(this.timer);
              this.timer = setTimeout(
                function () {
                  Animated.timing(this.state.opacityBoxNotif, {
                    toValue: 0,
                    duration: 500,
                  }).start();
                  setTimeout(
                    function () {
                      this.setState({
                        newChatLength: 0,
                      });
                    }.bind(this),
                    500,
                  );
                }.bind(this),
                5000,
              );
            }
          },
        );
      }.bind(this),
    );
  };

  _saveChatOnStorage = data => {
    AsyncStorage.getItem('chats', (error, chat) => {
      if (chat !== null) {
        chat = JSON.parse(chat);
        chat.push(data);
        AsyncStorage.setItem('chats', JSON.stringify(chat));
      } else {
        AsyncStorage.setItem('chats', JSON.stringify([data]));
      }
    });
  };

  _getOrderStatus = () => {
    const { orderId } = this.state;
    const wrappedPromise = cancellablePromise(this._promiseGetOrderStatus());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(res => {
        if (res) {
          this.setState(
            {
              status: res.orderEndStatus,
            },
            () => {
              const { status } = this.state;
              AsyncStorage.getItem('orders', (err, order) => {
                if (order !== null) {
                  order = JSON.parse(order);
                  let index = order
                    .map(item => {
                      return item.orderId;
                    })
                    .indexOf(orderId.toString());
                  order[index].status = status;
                  AsyncStorage.setItem('orders', JSON.stringify(order));
                }
              });
            },
          );
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(err => {
        Alert.alert(
          'Gagal memperbarui status pesanan',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getOrderStatus,
            },
          ],
          { cancelable: true },
        );
      });
  };

  _promiseGetOrderStatus = () => {
    return new Promise((resolve, reject) => {
      const { orderId } = this.state;
      if (orderId !== null) {
        fetch(`${HOST_REST_API}order/${orderId}`)
          .then(res => res.json())
          .then(resolve)
          .catch(reject);
      }
    });
  };

  _getChats = () => {
    const { orderId, chats } = this.state;
    const wrappedPromise = cancellablePromise(this._promiseGetChats());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(chat => {
        if (chat.status === 'OK' && chat.data.length > 0) {
          chat = chat.data;
          this.setState(
            {
              chats: chat,
            },
            () => {
              AsyncStorage.getItem('chats', (err, res) => {
                if (res !== null) {
                  res = JSON.parse(res);
                  let chatArray = [];
                  res.map(a => {
                    a.orderId !== orderId && chatArray.push(a);
                  });
                  AsyncStorage.setItem(
                    'chats',
                    JSON.stringify(chatArray.concat(chat)),
                  );
                  let length = res.map(a => {
                    return a.orderId === orderId;
                  }).length;
                  if (length < chat.length) {
                    this.setState(
                      {
                        newChatLength: chat.length - length,
                        hasNewChats: true,
                      },
                      () => {
                        if (this.state.hasNewChats) {
                          Animated.timing(this.state.opacityBoxNotif, {
                            toValue: 1,
                            duration: 500,
                          }).start();
                          clearTimeout(this.timer);
                          this.timer = setTimeout(
                            function () {
                              Animated.timing(this.state.opacityBoxNotif, {
                                toValue: 0,
                                duration: 500,
                              }).start();
                              setTimeout(
                                function () {
                                  this.setState({
                                    newChatLength: 0,
                                  });
                                }.bind(this),
                                500,
                              );
                            }.bind(this),
                            5000,
                          );
                        }
                      },
                    );
                  }
                } else {
                  AsyncStorage.setItem('chats', JSON.stringify(chat));
                }
              });
            },
          );
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(err => {
        Alert.alert(
          'Gagal mendapatkan obrolan',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getChats,
            },
          ],
          { cancelable: true },
        );
      });
  };

  _promiseGetChats = () => {
    return new Promise((resolve, reject) => {
      const { orderId } = this.state;
      if (orderId !== null) {
        fetch(`${HOST_REST_API}chat/history/${orderId}`)
          .then(res => res.json())
          .then(resolve)
          .catch(reject);
      }
    });
  };

  _mapReady = () => {
    const dataOrder = this.props.route.params?.dataOrder;
    if (dataOrder === undefined) {
      const merchant = this.props.route.params?.merchant;
      const origin = this.props.route.params?.origin;
      let geometry = null;
      let originState = null;
      if (merchant !== undefined) {
        geometry = {
          latitude: merchant.merchantLatitude,
          longitude: merchant.merchantLongitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        originState = {
          geometry: {
            latitude: merchant.merchantLatitude,
            longitude: merchant.merchantLongitude,
          },
          geocode: {
            title: merchant.merchantName,
            address: merchant.merchantAddress,
          },
        };
      } else if (origin !== undefined) {
        geometry = {
          latitude: origin.geometry.latitude,
          longitude: origin.geometry.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        originState = origin;
      }
      this.setState(
        {
          merchant: merchant,
          origin: originState,
        },
        () => {
          if (geometry !== null) {
            this._mapView.animateToRegion(geometry);
            this._getNearDriver();
          }
        },
      );
    } else {
      const {
        orderId,
        orderType,
        carts,
        origin,
        destination,
        fare,
        distances,
        merchant,
        status,
        customer,
        note,
        driver,
        date,
      } = dataOrder;
      this.setState(
        {
          orderId,
          orderType,
          carts,
          origin,
          destination,
          distances,
          driver,
          fare,
          merchant,
          status,
          customer,
          note,
          driverCoord: new AnimatedRegion({
            latitude: driver.driverLatitude,
            longitude: driver.driverLongitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }),
          orderDate: date,
          preventBack: false,
        },
        () => {
          AsyncStorage.getItem(
            'chats',
            function (err, chat) {
              if (chat !== null) {
                chat = JSON.parse(chat);
                this.setState({
                  chats: chat.filter(function (c) {
                    return c.orderId === orderId;
                  }),
                });
              }
            }.bind(this),
          );
          this._makePolyline();
          if (
            status !== 'completed' &&
            status !== 'cancelled_by_user' &&
            status !== 'cancelled_by_driver'
          ) {
            if (this.socket) {
              this._socket();
            }
          }
        },
      );
    }
  };

  _makePolyline = () => {
    clearTimeout(this.timeoutPolyline);
    let {
      orderType,
      driver,
      status,
      destination,
      origin,
      merchant,
      polylineCoords,
    } = this.state;
    if (
      status === 'completed' ||
      status === 'cancelled_by_driver' ||
      status === 'cancelled_by_user'
    ) {
      polylineCoords = {
        origin: origin.geometry,
        destination: destination.geometry,
      };
    }
    if (orderType === 'FOOD') {
      if (status === 'towards_resto') {
        polylineCoords = {
          origin: {
            latitude: driver.driverLatitude,
            longitude: driver.driverLongitude,
          },
          destination: {
            latitude: merchant.merchantLatitude,
            longitude: merchant.merchantLongitude,
          },
        };
      } else if (status === 'towards_customer') {
        polylineCoords = {
          origin: {
            latitude: merchant.merchantLatitude,
            longitude: merchant.merchantLongitude,
          },
          destination: {
            latitude: destination.geometry.latitude,
            longitude: destination.geometry.longitude,
          },
        };
      } else {
        this._mapView.fitToElements(true);
      }
    } else if (orderType === 'RIDE') {
      if (status === 'towards_customer') {
        polylineCoords = {
          origin: {
            latitude: driver.driverLatitude,
            longitude: driver.driverLongitude,
          },
          destination: {
            latitude: origin.geometry.latitude,
            longitude: origin.geometry.longitude,
          },
        };
      } else if (status === 'drop_off') {
        polylineCoords = {
          origin: {
            latitude: origin.geometry.latitude,
            longitude: origin.geometry.longitude,
          },
          destination: {
            latitude: destination.geometry.latitude,
            longitude: destination.geometry.longitude,
          },
        };
      } else {
        this._mapView.fitToElements(true);
      }
    }

    this.setState(
      {
        polylineCoords,
        destinationMarker:
          status === 'drop_off' ||
          status === 'cancelled_by_driver' ||
          status === 'cancelled_by_user' ||
          status === 'completed'
            ? true
            : false,
      },
      () => {
        this.timeoutPolyline = setTimeout(
          function () {
            if (polylineCoords.origin.latitude !== 0) {
              const wrappedPromise = cancellablePromise(
                getDirections(
                  polylineCoords.origin,
                  polylineCoords.destination,
                ),
              );
              this.appendPendingPromise(wrappedPromise);
              wrappedPromise.promise
                .then(directions => {
                  let points = Polyline.decode(
                    directions.routes[0].overview_polyline.points,
                  );
                  let coords = points.map((point, index) => {
                    return {
                      latitude: point[0],
                      longitude: point[1],
                    };
                  });
                  this.setState(
                    {
                      polyline: status === 'bought_order' ? [] : coords,
                    },
                    () => {
                      this._mapView.fitToElements(true);
                    },
                  );
                })
                .then(() => {
                  this.removePendingPromise(wrappedPromise);
                })
                .catch(error => {
                  Alert.alert(
                    'Gagal membuat rute',
                    'Terjadi kesalahan pada sistem, coba lagi nanti',
                    [
                      {
                        text: 'Coba lagi',
                        onPress: this._makePolyline,
                      },
                    ],
                    { cancelable: true },
                  );
                });
            }
          }.bind(this),
          1000,
        );
      },
    );
  };

  _handleAppStateChange = nextAppState => {
    this.setState({ nextAppState });
  };

  pendingPromises = [];

  appendPendingPromise = promise => {
    this.pendingPromises = [...this.pendingPromises, promise];
  };

  removePendingPromise = promise => {
    this.pendingPromises = this.pendingPromises.filter(p => p !== promise);
  };

  _getNearDriver = () => {
    const { origin } = this.state;
    const position = {
      lat: origin.geometry.latitude,
      lng: origin.geometry.longitude,
    };
    const wrappedPromise = cancellablePromise(getNearDrivers(position));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(drivers => {
        if (drivers.length > 0) {
          const date = new Date();
          let d = date.getDate();
          let m = date.getMonth() + 1;
          let y = date.getFullYear();
          let h = date.getHours();
          let i = date.getMinutes();
          let s = date.getSeconds();
          m = m.toString().length < 2 ? '0' + m.toString() : m.toString();
          d = d.toString().length < 2 ? '0' + d.toString() : d.toString();
          h = h.toString().length < 2 ? '0' + h.toString() : h.toString();
          i = i.toString().length < 2 ? '0' + i.toString() : i.toString();
          s = s.toString().length < 2 ? '0' + s.toString() : s.toString();
          const dateString = `${y}-${m}-${d} ${h}:${i}:${s}`;
          this.setState(
            {
              orderId: new Date().getTime(),
              driverCandidate: drivers,
              status: 'finded',
              dateString: dateString,
              orderType: this.props.route.params?.orderType,
              carts: this.props.route.params?.carts,
              destination: this.props.route.params?.destination,
              distances: this.props.route.params?.distances,
              fare: this.props.route.params?.fare,
              note: this.props.route.params?.note,
              orderDate: new Date(),
            },
            () => {
              if (this.socket) {
                this._socket();
              }
              this._findConnectedDriver();
            },
          );
        } else {
          this.props.navigation.goBack();
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Tidak dapat menemukan driver terdekat',
              ToastAndroid.SHORT,
            );
          } else {
            Toast.show('Tidak dapat menemukan driver terdekat', Toast.SHORT);
          }
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        Alert.alert(
          'Gagal mendapatkan driver',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getNearDriver,
            },
            {
              text: 'Kembali',
              onPress: () => {
                this.props.navigation.goBack();
                this.setState({
                  preventBack: false,
                });
              },
            },
          ],
          { cancelable: false },
        );
      });
  };

  _findConnectedDriver = () => {
    const {
      driverCandidate,
      indexCandidate,
      isConnected,
      orderType,
      carts,
      origin,
      destination,
      fare,
      distances,
      merchant,
      status,
      customer,
      note,
      dateString,
    } = this.state;
    if (this.socket && isConnected) {
      if (driverCandidate.length > 0 && driverCandidate[indexCandidate]) {
        this.socket.emit(
          'isConnected',
          driverCandidate[indexCandidate].driverSocketId,
          function (result) {
            if (result) {
              const driver = {
                driverId: driverCandidate[indexCandidate].driverId,
                driverName: driverCandidate[indexCandidate].driverName,
                driverVRP: driverCandidate[indexCandidate].driverVRP,
                driverPhone: driverCandidate[indexCandidate].driverPhone,
                driverEmail: driverCandidate[indexCandidate].driverEmail,
                driverPicture: driverCandidate[indexCandidate].driverPicture,
                driverLatitude: Number(
                  driverCandidate[indexCandidate].driverLatitude,
                ),
                driverLongitude: Number(
                  driverCandidate[indexCandidate].driverLongitude,
                ),
              };
              this.setState(
                {
                  driverTemporary: driver,
                },
                () => {
                  const sendData = {
                    orderId: this.state.orderId.toString(),
                    orderType: orderType,
                    carts: carts,
                    origin: origin,
                    destination: destination,
                    fare: fare,
                    distances: distances,
                    merchant: merchant,
                    status: status,
                    customer: customer,
                    driver: driver,
                    note: note,
                    date: dateString,
                  };
                  this.socket.emit('find_driver', {
                    receiverId: this.state.driverTemporary.driverId,
                    data: sendData,
                  });
                  this.timeoutNextDriver = setTimeout(() => {
                    this.setState(
                      {
                        indexCandidate: this.state.indexCandidate + 1,
                      },
                      () => {
                        this._findConnectedDriver();
                      },
                    );
                  }, 15000);
                },
              );
            } else {
              this.setState(
                {
                  indexCandidate: this.state.indexCandidate + 1,
                },
                () => {
                  this._findConnectedDriver();
                },
              );
            }
          }.bind(this),
        );
      } else {
        this.props.navigation.goBack();
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'Belum ada driver yang terhubung',
            ToastAndroid.SHORT,
          );
        } else {
          Toast.show('Belum ada driver yang terhubung', Toast.SHORT);
        }
      }
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Tidak dapat terhubung', ToastAndroid.SHORT);
      } else {
        Toast.show('Tidak dapat terhubung', Toast.SHORT);
      }
      this.props.navigation.goBack();
    }
  };

  _postOrder = () => {
    const {
      orderType,
      carts,
      origin,
      destination,
      fare,
      distances,
      merchant,
      status,
      customer,
      note,
      driver,
      dateString,
      orderId,
    } = this.state;
    let estimatedPrice = 0;
    if (carts !== undefined) {
      carts.map(c => {
        estimatedPrice += c.foodPrice * c.qty;
      });
    }
    const data = {
      orderId: orderId,
      orderType: orderType,
      orderDate: dateString,
      orderEndStatus: status,
      orderOrigin: origin.geocode.title,
      orderDestination: destination.geocode.title,
      orderOriginLatitude: origin.geometry.latitude,
      orderOriginLongitude: origin.geometry.longitude,
      orderDestinationLatitude: destination.geometry.latitude,
      orderDestinationLongitude: destination.geometry.longitude,
      orderFare: fare,
      orderCost: estimatedPrice + fare,
      driverId: driver.driverId,
      userId: customer.userId,
    };
    const wrappedPromise = cancellablePromise(
      this._promisePostOrderToServer(data),
    );
    this.timeOutPostOrder = setTimeout(
      function () {
        wrappedPromise.cancel();
        this.removePendingPromise(wrappedPromise);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Gagal membuat pesanan', ToastAndroid.SHORT);
        } else {
          Toast.show('Gagal membuat pesanan', Toast.SHORT);
        }
        this.props.navigation.goBack();
      }.bind(this),
      10000,
    );
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(res => {
        const sendData = {
          orderId: orderId.toString(),
          orderType: orderType,
          carts: carts,
          origin: origin,
          destination: destination,
          fare: fare,
          distances: distances,
          merchant: merchant,
          status: status,
          customer: customer,
          driver: driver,
          note: note,
          date: dateString,
        };
        if (res.status == 'OK') {
          clearTimeout(this.timeOutPostOrder);
          this.socket.emit('send_response', {
            receiverId: driver.driverId,
            data: true,
          });
          this.setState(
            {
              preventBack: false,
            },
            () => {
              AsyncStorage.getItem('orders', (err, order) => {
                if (order != null) {
                  order = JSON.parse(order);
                  order.push(sendData);
                  AsyncStorage.setItem('orders', JSON.stringify(order));
                } else {
                  AsyncStorage.setItem('orders', JSON.stringify([sendData]));
                }
              });
              this._mapView.fitToElements(true);
              if (Platform.OS === 'android') {
                ToastAndroid.show('Driver ditemukan', ToastAndroid.SHORT);
              } else {
                Toast.show('Driver ditemukan', Toast.SHORT);
              }
            },
          );
        } else {
          if (this.state.preventBack) {
            if (Platform.OS === 'android') {
              ToastAndroid.show('Gagal membuat pesanan', ToastAndroid.SHORT);
            } else {
              Toast.show('Gagal membuat pesanan', Toast.SHORT);
            }
            this.props.navigation.goBack();
          }
        }
      })
      .catch(err => {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'Terjadi kesalahan pada sistem, coba lagi nanti',
            ToastAndroid.SHORT,
          );
        } else {
          Toast.show(
            'Terjadi kesalahan pada sistem, coba lagi nanti',
            Toast.SHORT,
          );
        }
        this.props.navigation.goBack();
      });
  };

  _promisePostOrderToServer = data => {
    return new Promise((resolve, reject) => {
      fetch(`${HOST_REST_API}order/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  };

  _cancelOrder = () => {
    this.setState(
      {
        cancelling: true,
      },
      () => {
        const { driver, orderId, carts } = this.state;
        const status = 'cancelled_by_user';
        fetch(`${HOST_REST_API}order/status`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            status: status,
          }),
        })
          .then(res => res.json())
          .then(res => {
            if (res.status === 'OK') {
              AsyncStorage.getItem('orders', (err, order) => {
                if (order !== null) {
                  order = JSON.parse(order);
                  let index = order
                    .map(item => {
                      return item.orderId;
                    })
                    .indexOf(orderId.toString());
                  order[index].status = status;
                  AsyncStorage.setItem('orders', JSON.stringify(order));
                }
              });
              if (driver != null) {
                if (this.socket) {
                  this.socket.emit('send_order_cancellation', {
                    receiverId: driver.driverId,
                    data: 'by_user',
                  });
                }
              }
              if (Platform.OS === 'android') {
                ToastAndroid.show('Pesanan dibatalkan', ToastAndroid.SHORT);
              } else {
                Toast.show('Pesanan dibatalkan', Toast.SHORT);
              }
              this.props.navigation.goBack();
            } else {
              this.setState({
                cancelling: false,
              });
            }
          })
          .catch(err => {
            Alert.alert(
              'Gagal membatalkan pesanan',
              'Terjadi kesalahan pada sistem, coba lagi nanti',
              [
                {
                  text: 'Coba lagi',
                  onPress: this._cancelOrder,
                },
              ],
              { cancelable: true },
            );
          });
      },
    );
  };

  _navigate = (screen, data = null) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: 'rgba(255,255,255,.65)',
      },
      backListener: {
        add: () =>
          BackHandler.addEventListener(
            'hardwareBackPress',
            this.preventBackButton,
          ),
        remove: () => {},
      },
      data: data,
    });
  };

  preventBackButton = () => {
    if (this.state.preventBack) {
      return true;
    }
  };

  render() {
    const {
      merchant,
      origin,
      driver,
      destination,
      destinationMarker,
      polyline,
      fare,
      carts,
      orderDate,
      distances,
      status,
      region,
      orderType,
      orderId,
      driverCoord,
    } = this.state;
    return (
      <View style={{ flex: 1 }}>
        {driver != null && (
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
        )}
        <View style={{ flex: 1 }}>
          <MapView
            ref={_mapView => (this._mapView = _mapView)}
            onMapReady={this._mapReady}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            style={{ flex: 1 }}
            mapPadding={{
              top: StatusBar.currentHeight + 45,
              left: 15,
              right: 15,
              bottom: 300,
            }}
          >
            {orderType === 'FOOD' && (
              <Marker
                coordinate={{
                  latitude: merchant.merchantLatitude,
                  longitude: merchant.merchantLongitude,
                }}
              >
                <View style={{ width: 60, height: 60 }}>
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    source={require('../images/icons/resto-marker.png')}
                  />
                </View>
              </Marker>
            )}
            {orderType === 'RIDE' && (
              <Marker
                coordinate={{
                  latitude: origin.geometry.latitude,
                  longitude: origin.geometry.longitude,
                }}
              >
                <View style={{ width: 60, height: 60 }}>
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    source={require('../images/icons/passenger-marker.png')}
                  />
                </View>
              </Marker>
            )}
            {driver != null && (
              <Marker.Animated
                ref={marker => (this.driverMarker = marker)}
                coordinate={driverCoord}
              >
                <View style={{ width: 60, height: 60 }}>
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    source={require('../images/icons/driver-marker.png')}
                  />
                </View>
              </Marker.Animated>
            )}
            {destinationMarker && (
              <Marker
                coordinate={{
                  latitude: destination.geometry.latitude,
                  longitude: destination.geometry.longitude,
                }}
              >
                <View style={{ width: 60, height: 60 }}>
                  <Image
                    style={{ width: '100%', height: '100%' }}
                    source={require('../images/icons/destination-marker.png')}
                  />
                </View>
              </Marker>
            )}
            <Direction
              coordinates={polyline}
              strokeWidth={4}
              strokeColor={Color.green}
            />
          </MapView>
        </View>
        <View
          style={{
            backgroundColor: Color.white,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <SafeAreaView>
            {driver == null && (
              <View style={{ padding: 15 }}>
                <Text
                  style={{
                    marginTop: 5,
                    fontWeight: 'bold',
                    fontSize: 18,
                    marginBottom: 10,
                    textAlign: 'center',
                  }}
                >
                  Mencari driver...
                </Text>
                <View
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <ActivityIndicator size={100} color={Color.green} />
                </View>
              </View>
            )}
            {driver != null && (
              <View>
                <BookingStatus
                  orderType={orderType}
                  status={status}
                  navigation={this._navigate}
                  navigateOrderDetail={() =>
                    this._navigate('OrderDetails', {
                      orderType: orderType,
                      origin: origin,
                      merchant: merchant,
                      destination: destination,
                      fare: fare,
                      carts: carts,
                      date: orderDate,
                      distances: distances,
                      orderId: orderId,
                    })
                  }
                />
                <View
                  style={{
                    padding: 15,
                    flexDirection: 'row',
                    marginHorizontal: -5,
                    alignItems: 'center',
                  }}
                >
                  <View style={{ marginHorizontal: 5 }}>
                    <View
                      style={{
                        height: 75,
                        width: 75,
                        borderRadius: 37.5,
                        padding: 5,
                        backgroundColor: Color.grayLight,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: '100%',
                          borderRadius: 37.5,
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          style={{ height: '100%', width: '100%' }}
                          source={{
                            uri: getImageThumb(driver.driverPicture, 'sm'),
                          }}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={{ marginHorizontal: 5, flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ marginBottom: 8, fontSize: 13 }}
                    >
                      {driver.driverVRP}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ fontWeight: 'bold', fontSize: 18 }}
                    >
                      {driver.driverName}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ marginHorizontal: 5 }}>
                      <TouchableHighlight
                        style={{ borderRadius: 40 / 2 }}
                        underlayColor="#fff"
                        activeOpacity={0.85}
                        onPress={() =>
                          Linking.openURL(`tel://${driver.driverPhone}`)
                        }
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: Color.green,
                            borderRadius: 40 / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Fa
                            iconStyle="solid"
                            name="phone"
                            size={16}
                            style={{ color: Color.white }}
                          />
                        </View>
                      </TouchableHighlight>
                    </View>
                    <View style={{ marginHorizontal: 5 }}>
                      <TouchableHighlight
                        underlayColor="#fff"
                        activeOpacity={0.85}
                        style={{ borderRadius: 40 / 2 }}
                        onPress={() =>
                          this._navigate('Chat', {
                            chats: this.state.chats,
                            noNewChat: () => {
                              this.setState({
                                hasNewChats: false,
                                newChatLength: 0,
                              });
                            },
                            pushChat: chats => {
                              this.setState({ chats });
                            },
                            socket: this.socket,
                            receiverId: this.state.receiverId,
                            driver: this.state.driver,
                            orderId: this.state.orderId,
                            status: this.state.status,
                          })
                        }
                      >
                        <View
                          style={{
                            position: 'relative',
                            width: 40,
                            height: 40,
                            backgroundColor: Color.green,
                            borderRadius: 40 / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {this.state.hasNewChats && (
                            <View
                              style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 10,
                                height: 10,
                                borderRadius: 10 / 2,
                                backgroundColor: Color.red,
                              }}
                            />
                          )}
                          <Fa
                            iconStyle="solid"
                            name="comment-dots"
                            size={16}
                            style={{ color: Color.white }}
                          />
                        </View>
                      </TouchableHighlight>
                    </View>
                    <View style={{ marginHorizontal: 5 }}>
                      <TouchableHighlight
                        style={{ borderRadius: 40 / 2 }}
                        activeOpacity={0.85}
                        underlayColor="#fff"
                        onPress={() =>
                          Linking.openURL(
                            `whatsapp://send?phone=${phoneNumFormat(
                              driver.driverPhone,
                            )}`,
                          )
                        }
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: Color.green,
                            borderRadius: 40 / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Fa
                            iconStyle="solid"
                            name="whatsapp"
                            size={16}
                            style={{ color: Color.white }}
                          />
                        </View>
                      </TouchableHighlight>
                    </View>
                  </View>
                </View>
                <Card
                  body={
                    <View
                      style={{
                        padding: 15,
                        borderTopColor: Color.borderColor,
                        borderTopWidth: 1,
                      }}
                    >
                      {status != 'finded' && status != 'towards_resto' ? (
                        status === 'completed' ? (
                          <View
                            style={{
                              borderRadius: 3,
                              backgroundColor: Color.grayLighter,
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 40,
                            }}
                          >
                            <Text>Selesai</Text>
                          </View>
                        ) : status !== 'cancelled_by_user' &&
                          status !== 'canceled_by_driver' ? (
                          <View
                            style={{
                              borderRadius: 3,
                              backgroundColor: Color.grayLighter,
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 40,
                            }}
                          >
                            <Text>Pesanan diproses</Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              borderRadius: 3,
                              backgroundColor: Color.grayLighter,
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 40,
                            }}
                          >
                            <Text>Pesanan dibatalkan</Text>
                          </View>
                        )
                      ) : this.state.cancelling ? (
                        <View
                          style={{
                            borderRadius: 3,
                            backgroundColor: Color.red,
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 40,
                            elevation: 3,
                          }}
                        >
                          <ActivityIndicator
                            size="small"
                            color={colorYiq(Color.red)}
                          />
                        </View>
                      ) : (
                        <Button
                          red
                          onPress={this._cancelOrder}
                          title="Batalkan pesanan"
                        />
                      )}
                    </View>
                  }
                />
              </View>
            )}
            {driver !== null &&
              this.socket &&
              !this.state.isConnected &&
              (this.state.readyConnect ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,.35)',
                    zIndex: 2,
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    name="exclamation-circle"
                    size={40}
                    style={{ color: Color.red, marginBottom: 15 }}
                  />
                  <Text
                    style={{
                      textAlign: 'center',
                      color: Color.white,
                      fontWeight: 'bold',
                    }}
                  >
                    Tidak bisa terhubung
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,.35)',
                    zIndex: 2,
                  }}
                >
                  <View
                    style={{
                      marginBottom: 15,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator size="large" color={Color.primary} />
                  </View>
                  <Text
                    style={{
                      textAlign: 'center',
                      color: Color.white,
                      fontWeight: 'bold',
                    }}
                  >
                    Menghubungkan
                  </Text>
                </View>
              ))}
          </SafeAreaView>
        </View>
        {this.state.newChatLength > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              paddingTop: StatusBar.currentHeight,
            }}
          >
            <Animated.View
              style={{
                marginHorizontal: 15,
                marginVertical: 15,
                backgroundColor: Color.white,
                borderRadius: 10,
                elevation: 1,
                padding: 10,
                opacity: this.state.opacityBoxNotif,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 10 }}>
                  <View
                    style={{
                      backgroundColor: Color.secondary,
                      width: 30,
                      height: 30,
                      borderRadius: 30 / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Fa
                      iconStyle="solid"
                      size={18}
                      color={colorYiq(Color.secondary)}
                      name="bell"
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ color: Color.textMuted, marginBottom: 3 }}>
                    Pesan Baru
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {this.state.newChatLength} Pesan Teks
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    );
  }
}

export default Booking;
