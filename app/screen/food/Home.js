/* eslint-disable react-native/no-inline-styles */
import React, { Component } from 'react';
import {
  View,
  Text,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  TouchableHighlight,
  ScrollView,
} from 'react-native';
import {
  SliderCard,
  Items,
  Button,
  DummyItems,
  DummySliderCard,
} from '../../components/Components';
import Feather from '@react-native-vector-icons/feather';
import Fa from '@react-native-vector-icons/fontawesome5';
import Color, { colorYiq } from '../../components/Color';
import Currency from '../../helpers/Currency';
import { getCurrentPosition } from '../../actions/locations.actions';
import {
  getGeocoding,
  getAddressComponents,
} from '../../actions/geocode.actions';
import cancellablePromise from '../../helpers/cancellablePromise';
import { getCart } from '../../actions/carts.actions';
import { HOST_REST_API } from '../../components/Define';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get('window');

class Home extends Component {
  constructor() {
    super();
    this.state = {
      carts: [],
      position: null,
      collection: [],
      currentLocation: null,
      emptyCollection: false,
      errorLocation: false,
      errorGeocode: false,
      errorCollection: false,
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
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor(Color.white, true);
    StatusBar.setBarStyle('dark-content', true);
    this._getLocation();
  }

  componentWillUnmount() {
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
  }

  _getLocation = () => {
    this.setState(
      {
        errorLocation: false,
      },
      () => {
        const wrappedPromise = cancellablePromise(getCurrentPosition());
        this.appendPendingPromise(wrappedPromise);
        wrappedPromise.promise
          .then(position => {
            console.log(position);
            this._getGeocoding({ position: position });
          })
          .then(() => {
            this.removePendingPromise(wrappedPromise);
          })
          .catch(error => {
            this.setState({
              errorLocation: true,
            });
          });
      },
    );
  };

  dataCart = (state = {}) => {
    console.log(state);
    const wrappedPromise = cancellablePromise(getCart());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(carts => {
        if (state === null) {
          this.setState({
            carts,
          });
        } else {
          this.setState({
            carts,
            ...state,
          });
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      });
  };

  _getGeocoding = state => {
    if (this.state.errorGeocode) {
      this.setState({
        errorGeocode: false,
      });
    }
    const wrappedPromise = cancellablePromise(getGeocoding(state.position));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(geocode => {
        let poi = getAddressComponents(geocode);
        let filter = geocode.results.filter(g => {
          return g.types.indexOf('route') > -1;
        });
        filter = filter[0].address_components.filter(f => {
          return f.types.indexOf('administrative_area_level_2') > -1;
        });
        let cityName = filter[0].short_name;
        this._getCollection({
          currentLocation: {
            poi: poi[0],
            cityName: cityName,
            fullAddress: poi[1],
          },
          ...state,
        });
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        this.setState({
          errorGeocode: true,
        });
      });
  };

  _getCollection = state => {
    if (this.errorCollection) {
      this.setState({
        errorCollection: false,
      });
    }
    const wrappedPromise = cancellablePromise(
      this._promiseCollection(state.currentLocation, state.position),
    );
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(data => {
        if (data.length > 0) {
          this.dataCart({
            ...state,
            emptyCollection: false,
            collection: data,
          });
        } else {
          this.setState({
            ...state,
            emptyCollection: true,
          });
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        this.setState({
          errorCollection: true,
        });
      });
  };

  _promiseCollection = (currentLocation, position) => {
    return new Promise((resolve, reject) => {
      const cityName = encodeURI(currentLocation.cityName);
      AsyncStorage.getItem('token').then(v => {
        fetch(
          `${HOST_REST_API}food/collection?kota=${cityName}&koordinat=${position.latitude},${position.longitude}`,
          {
            headers: {
              Authorization: `Bearer ${v}`,
            },
          },
        )
          .then(res => res.json())
          .then(resolve)
          .catch(reject);
      });
    });
  };

  _navigate = (screen, data = {}, params = {}) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: Color.white,
      },
      actionBack: () => this.dataCart(),
      data: {
        position: this.state.position,
        ...data,
      },
      ...params,
    });
  };

  _selectLocation = position => {
    this._getGeocoding({
      collection: [],
      position: {
        latitude: position.geometry.latitude,
        longitude: position.geometry.longitude,
      },
    });
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View
            style={[
              {
                flexDirection: 'column',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: Color.white,
                zIndex: 10,
              },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 15,
                paddingTop: StatusBar.currentHeight + 5,
                paddingBottom: 5,
              }}
            >
              <View style={{ justifyContent: 'center' }}>
                <TouchableHighlight
                  style={{ borderRadius: 40 / 2 }}
                  activeOpacity={0.85}
                  underlayColor="#fff"
                  onPress={() => this.props.navigation.goBack()}
                >
                  <View
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: 40 / 2,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Fa iconStyle="solid" size={18} name="chevron-left" />
                  </View>
                </TouchableHighlight>
              </View>
              <TouchableHighlight
                style={{ borderRadius: 5 }}
                activeOpacity={1}
                underlayColor="transparent"
                onPress={() => {
                  this._navigate('MapSelecting', null, {
                    selectLocation: this._selectLocation,
                    selectedLocation: {
                      latitude: this.state.position.latitude,
                      longitude: this.state.position.longitude,
                    },
                  });
                }}
              >
                <View
                  style={{
                    flexDirection: 'column',
                    paddingVertical: 5,
                    overflow: 'hidden',
                    borderRadius: 5,
                    paddingHorizontal: 10,
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={[
                      {
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        overflow: 'hidden',
                        alignItems: 'center',
                        height: 20,
                        gap: 10,
                      },
                    ]}
                  >
                    <Text>Lokasimu</Text>
                    <Fa
                      iconStyle="solid"
                      size={16}
                      color={Color.red}
                      name="chevron-down"
                    />
                  </View>
                  {this.state.currentLocation == null ? (
                    !this.state.errorLocation ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{ paddingRight: 8, color: Color.textMuted }}
                        >
                          Mendapatkan lokasi saat ini
                        </Text>
                        <ActivityIndicator
                          size="small"
                          color={Color.secondary}
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ paddingRight: 8, color: Color.danger }}>
                          Gagal mendapatkan lokasi saat ini
                        </Text>
                      </View>
                    )
                  ) : (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text numberOfLines={1} style={{ fontWeight: 'bold' }}>
                        {this.state.currentLocation.poi}
                      </Text>
                      <View style={[{ marginLeft: 3, opacity: 0 }]}>
                        <Feather
                          size={15}
                          color={Color.red}
                          name="chevron-down"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableHighlight>
              {/* <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingRight: 0 }}>
                <TouchableNativeFeedback
                  useForeground={true}
                  background={TouchableNativeFeedback.Ripple('rgba(0,0,0,.15)', false)}
                >
                  <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, overflow: 'hidden' }}>
                    <Feather name="heart" size={20} />
                  </View>
                </TouchableNativeFeedback>
              </View> */}
            </View>
            {this.state.collection.length ? (
              <View>
                <TouchableHighlight
                  style={{ borderRadius: 10 }}
                  activeOpacity={0.85}
                  underlayColor="#fff"
                  onPress={() => {
                    this._navigate('SearchMenu', {
                      cityName: this.state.currentLocation.cityName,
                      position: this.state.position,
                    });
                  }}
                >
                  <View
                    style={{
                      height: 40,
                      overflow: 'hidden',
                      backgroundColor: Color.grayLighter,
                      marginHorizontal: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        height: 40,
                        width: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather
                        name="search"
                        color={Color.textMuted}
                        size={16}
                      />
                    </View>
                    <Text
                      style={{
                        color: Color.textMuted,
                        paddingHorizontal: 6,
                        paddingRight: 10,
                        letterSpacing: 1,
                      }}
                    >
                      Mau makan apa hari ini?
                    </Text>
                  </View>
                </TouchableHighlight>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: Color.grayLighter,
                  borderRadius: 10,
                  paddingHorizontal: 15,
                  marginHorizontal: 15,
                  marginBottom: 10,
                  opacity: 1,
                  height: 40,
                }}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            {this.state.collection.length ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={0}
                contentContainerStyle={{
                  paddingBottom: this.state.carts.length > 0 ? 70 : 0,
                }}
              >
                <View style={{ paddingTop: 135, flex: 1 }}>
                  <View>
                    {this.state.collection.map((item, i) =>
                      item.data.length ? (
                        <View key={(i + 1) * Math.random()}>
                          {item.style === 'adSlideCard' ? (
                            <SliderCard
                              navigate={(screen, data = null, params = {}) => {
                                this._navigate(screen, data, params);
                              }}
                              data={item.data}
                            />
                          ) : (
                            <Items
                              style={item.style}
                              title={item.title[0]}
                              subTitle={item.title[1]}
                              more={() => {
                                this._navigate(
                                  item.category === 'food'
                                    ? 'ListMenu'
                                    : 'ListMerchant',
                                  {
                                    cityName:
                                      this.state.currentLocation.cityName,
                                    position: this.state.position,
                                    orderBy: item.more,
                                  },
                                );
                              }}
                              navigate={this._navigate}
                              category={item.category}
                              product={item.data}
                            />
                          )}
                        </View>
                      ) : null,
                    )}
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  paddingTop: 135,
                  position: 'relative',
                }}
              >
                <DummySliderCard />
                <DummyItems />
                <DummyItems horizontal />
                {this.state.emptyCollection && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      left: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Color.white,
                      paddingHorizontal: 30,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginBottom: 6,
                      }}
                    >
                      Belum tersedia
                    </Text>
                    <Text
                      style={{
                        textAlign: 'center',
                        lineHeight: 18,
                        color: Color.textMuted,
                      }}
                    >
                      Maaf belum ada resto yang buka di sekitar sini, silakan
                      coba lagi lain waktu!
                    </Text>
                  </View>
                )}
                {this.state.errorLocation && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      left: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,.75)',
                      paddingHorizontal: 30,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginBottom: 6,
                      }}
                    >
                      Gagal mendapatkan lokasi saat ini
                    </Text>
                    <Text
                      style={{
                        textAlign: 'center',
                        lineHeight: 18,
                        color: Color.textMuted,
                      }}
                    >
                      Terjadi kesalahan pada sistem, coba lagi nanti
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        marginHorizontal: -5,
                        marginTop: 15,
                      }}
                    >
                      <Button
                        style={{ marginHorizontal: 5 }}
                        onPress={() => this.props.navigation.goBack()}
                        secondary
                        title="Kembali"
                      />
                      <Button
                        style={{ marginHorizontal: 5 }}
                        onPress={this._getLocation}
                        red
                        title="Coba lagi"
                      />
                    </View>
                  </View>
                )}
                {this.state.errorGeocode && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      left: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,.75)',
                      paddingHorizontal: 30,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginBottom: 6,
                      }}
                    >
                      Gagal mendapatkan info lokasi
                    </Text>
                    <Text
                      style={{
                        textAlign: 'center',
                        lineHeight: 18,
                        color: Color.textMuted,
                      }}
                    >
                      Terjadi kesalahan pada sistem, coba lagi nanti
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        marginHorizontal: -5,
                        marginTop: 15,
                      }}
                    >
                      <Button
                        style={{ marginHorizontal: 5 }}
                        onPress={() => this.props.navigation.goBack()}
                        secondary
                        title="Kembali"
                      />
                      <Button
                        style={{ marginHorizontal: 5 }}
                        onPress={this._getGeocoding}
                        red
                        title="Coba lagi"
                      />
                    </View>
                  </View>
                )}
                {this.state.errorCollection && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      left: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,.75)',
                      paddingHorizontal: 30,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginBottom: 6,
                      }}
                    >
                      Gagal mendapatkan resto
                    </Text>
                    <Text
                      style={{
                        textAlign: 'center',
                        lineHeight: 18,
                        color: Color.textMuted,
                      }}
                    >
                      Terjadi kesalahan pada sistem, coba lagi nanti
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        marginHorizontal: -5,
                        marginTop: 15,
                      }}
                    >
                      <Button
                        style={{ marginHorizontal: 5 }}
                        onPress={() => this.props.navigation.goBack()}
                        secondary
                        title="Kembali"
                      />
                      <Button
                        style={{ marginHorizontal: 5 }}
                        onPress={this._getCollection}
                        red
                        title="Coba lagi"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
          {this.state.carts.length > 0 && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                overflow: 'hidden',
              }}
            >
              <TouchableHighlight
                onPress={() => this._navigate('Order', null)}
                activeOpacity={0.85}
                underlayColor="#fff"
                style={{ borderRadius: 4, margin: 15 }}
              >
                <View
                  style={{
                    padding: 10,
                    borderRadius: 4,
                    elevation: 3,
                    backgroundColor: Color.primary,
                  }}
                >
                  {this.state.carts.length > 0 ? (
                    <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
                      <View style={{ flex: 1, paddingLeft: 5 }}>
                        <Text
                          style={{
                            fontWeight: 'bold',
                            color: colorYiq(Color.primary),
                            fontSize: 12,
                          }}
                        >
                          {this.state.carts.length > 0
                            ? this.state.carts.reduce((a, b) => {
                                return a + b.qty;
                              }, 0)
                            : 0}{' '}
                          item |{' '}
                          {Currency(
                            this.state.carts.length > 0
                              ? this.state.carts.reduce((a, b) => {
                                  return a + b.qty * b.foodPrice;
                                }, 0)
                              : 0,
                          )}{' '}
                          (est)
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colorYiq(Color.primary),
                          }}
                        >
                          {this.state.carts.length > 0
                            ? this.state.carts[0].merchantName
                            : 'Tidak ada merchant'}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 5,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Feather
                          color={colorYiq(Color.primary)}
                          size={18}
                          name="shopping-bag"
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              </TouchableHighlight>
            </View>
          )}
        </View>
      </View>
    );
  }
}

export default Home;
