/* eslint-disable react-native/no-inline-styles */
// import { connect } from 'react-redux'
// import { bindActionCreators } from 'redux'
import { Component } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableNativeFeedback,
  Image,
  Animated,
  ActivityIndicator,
  BackHandler,
  Platform,
  TouchableHighlight,
} from 'react-native';
import Color from '../../components/Color';
import { Button, SimpleHeader } from '../../components/Components';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Ion from '@react-native-vector-icons/ionicons';
import Fa from '@react-native-vector-icons/fontawesome5';
import Spinner from 'react-native-spinkit';
import cancellablePromise from '../../helpers/cancellablePromise';
import { getCurrentPosition } from '../../actions/locations.actions';
import {
  getGeocoding,
  getAddressComponents,
} from '../../actions/geocode.actions';
import { LATITUDE_DELTA, LONGITUDE_DELTA } from '../../components/Define';

class Home extends Component {
  loadingTimeout;
  backHandler;
  constructor(props) {
    super(props);
    this.state = {
      loading: new Animated.Value(0),
      origin: null,
      destination: null,
      region: {
        latitude: -0.5327255,
        longitude: 101.570019,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      titleBySearch: '',
      userLocation: false,
      newRegion: null,
      geocode: null,
      currentLocation: false,
      regionSelected: null,
      followsUserLocation: false,
      mapView: true,
      position: null,
      isMapReady: false,
      errorLocation: false,
      errorGeocode: false,
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
      StatusBar.setBackgroundColor('rgba(255,255,255,.65)', true);
    StatusBar.setBarStyle('dark-content', true);
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      this._handleBackPress,
    );

    this._setInitialLocation();
  }

  componentWillUnmount() {
    this.backHandler?.remove();
    clearTimeout(this.loadingTimeout);
    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
    if (this.props.route.params?.statusbar) {
      StatusBar.setBarStyle(this.props.route.params?.statusbar.barStyle, true);
      Platform.OS === 'android' &&
        StatusBar.setBackgroundColor(
          this.props.route.params?.statusbar.background,
          true,
        );
    }
  }

  _mapReady = () => {
    this.setState({
      errorLocation: false,
    });
  };

  _setInitialLocation = () => {
    const wrappedPromise = cancellablePromise(getCurrentPosition());
    const { origin, currentLocation } = this.state;
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(position => {
        const region = {
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        if (origin === null) {
          this.setState(
            {
              newRegion: region,
              userLocation: true,
              followsUserLocation: true,
              isMapReady: true,
            },
            () => {
              this._changeLocation(region.latitude, region.longitude);
            },
          );
        } else {
          this._changeLocation(
            origin.geometry.latitude,
            origin.geometry.longitude,
          );
        }
      })
      .then(() => {
        if (!currentLocation) {
          this.setState({
            currentLocation: true,
          });
        }
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        this.setState({
          errorLocation: true,
        });
      });
  };

  _handleBackPress = () => {
    if (this.state.destination !== null) {
      let location = this.state.destination.geometry;
      this.setState(
        {
          destination: null,
          geocode: null,
        },
        () => {
          this._changeLocation(location.latitude, location.longitude);
        },
      );
      return true;
    }
  };

  _regionChange = () => {
    const { isMapReady } = this.state;
    if (isMapReady) {
      clearTimeout(this.loadingTimeout);
      if (this.state.geocode != null) {
        this.setState({
          geocode: null,
        });
      }
      this.pendingPromises.map(p => {
        this.removePendingPromise(p);
      });
    }
  };

  _setDestination = () => {
    this.setState(
      {
        destination: {
          geometry: {
            latitude: this.state.regionSelected.latitude,
            longitude: this.state.regionSelected.longitude,
          },
          geocode: {
            title: this.state.geocode.title,
            address: this.state.geocode.address,
          },
        },
      },
      () => {
        this.setState(
          {
            geocode: null,
          },
          () => {
            this._toCurrentLocation();
          },
        );
      },
    );
  };

  _setOrigin = () => {
    this.setState(
      {
        origin: {
          geometry: {
            latitude: this.state.regionSelected.latitude,
            longitude: this.state.regionSelected.longitude,
          },
          geocode: {
            title: this.state.geocode.title,
            address: this.state.geocode.address,
          },
        },
      },
      () => {
        this._navigate('Overview', [this.state.origin, this.state.destination]);
      },
    );
  };

  _regionChangeComplete = position => {
    const { isMapReady } = this.state;
    if (isMapReady) {
      this.setState(
        {
          position,
        },
        () => {
          this._getGeocode();
        },
      );
    }
  };

  _getGeocode = () => {
    this.setState({
      errorGeocode: false,
    });
    const { position } = this.state;
    const wrappedPromise = cancellablePromise(getGeocoding(position));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(geocode => {
        let address = getAddressComponents(geocode);
        this.loadingTimeout = setTimeout(
          function () {
            this.setState({
              geocode: {
                title:
                  this.state.titleBySearch != ''
                    ? this.state.titleBySearch
                    : address[0],
                address: address[1],
              },
              titleBySearch: '',
              regionSelected: {
                latitude: position.latitude,
                longitude: position.longitude,
              },
            });
          }.bind(this),
          1000,
        );
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

  _navigate = (screen, data = null) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: Color.white,
      },
      addBackListener: () => {
        BackHandler.addEventListener(
          'hardwareBackPress',
          this._handleBackPress,
        );
        this.setState({
          userLocation: true,
          followsUserLocation: true,
          mapView: true,
        });
      },
      setOrigin: origin => {
        this.setState(
          {
            origin: origin,
          },
          () => {
            this._changeLocation(
              this.state.origin.geometry.latitude,
              this.state.origin.geometry.longitude,
            );
          },
        );
      },
      setDestination: destination => {
        this.setState({
          destination: destination,
        });
      },
      removeBackListener: () => {
        this.setState({
          userLocation: false,
          followsUserLocation: false,
          mapView: false,
        });
      },
      actionBySearch: this._actionBySearch,
      data: data,
    });
  };

  _actionBySearch = (latitude, longitude, titleBySearch = '') => {
    this.setState(
      {
        titleBySearch: titleBySearch,
      },
      () => {
        this._changeLocation(latitude, longitude);
      },
    );
  };

  _changeLocation = (latitude, longitude) => {
    this.setState(
      {
        region: {
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
      },
      () => {
        this._mapView.animateToRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      },
    );
  };

  _toCurrentLocation = () => {
    this._mapView.animateToRegion({
      latitude:
        this.state.newRegion != null
          ? this.state.newRegion.latitude
          : this.state.region.latitude,
      longitude:
        this.state.newRegion != null
          ? this.state.newRegion.longitude
          : this.state.region.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  _userLocationChange = location => {
    this.setState({
      newRegion: {
        latitude: location.nativeEvent.coordinate.latitude,
        longitude: location.nativeEvent.coordinate.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
    });
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: Color.grayLighter,
            marginBottom: -15,
          }}
        >
          <View style={{ flex: 1 }}>
            <MapView
              // showsUserLocation={this.state.userLocation}
              followsUserLocation={this.state.followsUserLocation}
              onUserLocationChange={this._userLocationChange}
              showsCompass={false}
              ref={_mapView => (this._mapView = _mapView)}
              onMapReady={this._mapReady}
              onRegionChange={this._regionChange}
              onRegionChangeComplete={this._regionChangeComplete}
              provider={PROVIDER_GOOGLE}
              initialRegion={this.state.region}
              style={{ flex: 1 }}
              mapPadding={{
                top: StatusBar.currentHeight,
                left: 0,
                right: 0,
                bottom: 196,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: -142,
                marginLeft: -30,
                width: 60,
                height: 60,
              }}
            >
              {this.state.destination == null ? (
                <Image
                  style={{ width: '100%', height: '100%' }}
                  source={require('../../images/icons/destination-marker.png')}
                />
              ) : (
                <Image
                  style={{ width: '100%', height: '100%' }}
                  source={require('../../images/icons/passenger-marker.png')}
                />
              )}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  top: 3,
                }}
              >
                <Spinner
                  type="Circle"
                  color={Color.white}
                  size={Platform.OS === 'ios' ? 28 : 35}
                  isVisible={
                    this.state.geocode != null && this.state.currentLocation
                      ? false
                      : true
                  }
                />
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            backgroundColor: Color.white,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
          }}
        >
          <View style={{ position: 'absolute', top: -50, left: 0, right: 0 }}>
            <SimpleHeader
              goBack
              navigation={this.props.navigation}
              backBtnStyle={{ elevation: 5, backgroundColor: Color.white }}
              style={{
                position: 'absolute',
                top: 0,
                backgroundColor: 'transparent',
                zIndex: 10,
              }}
              rightComponent={
                this.state.region != null ? (
                  <View>
                    <TouchableHighlight
                      activeOpacity={1}
                      style={{
                        width: 40,
                        height: 40,
                        marginHorizontal: 5,
                        borderRadius: 20,
                      }}
                      onPress={this._toCurrentLocation}
                    >
                      <View
                        style={{
                          height: 40,
                          width: 40,
                          borderRadius: 40 / 2,
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'white',
                          elevation: 5,
                        }}
                      >
                        <Fa
                          iconStyle="solid"
                          size={18}
                          color={Color.blue}
                          name="crosshairs"
                        />
                      </View>
                    </TouchableHighlight>
                  </View>
                ) : null
              }
            />
          </View>
          <View>
            {this.state.errorLocation && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}
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
                    onPress={this._mapReady}
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
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}
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
                    onPress={this._getGeocode}
                    red
                    title="Coba lagi"
                  />
                </View>
              </View>
            )}
            <View
              style={{
                paddingHorizontal: 15,
                position: 'relative',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 5,
                  marginBottom: 5,
                }}
              >
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      paddingRight: 10,
                    }}
                  >
                    {this.state.destination == null
                      ? 'Set lokasi tujuan'
                      : 'Set lokasi jemput'}
                  </Text>
                  {this.state.geocode != null &&
                  this.state.currentLocation ? null : (
                    <ActivityIndicator size="small" color={Color.secondary} />
                  )}
                </View>
                <View style={{ width: 40, height: 40 }}>
                  {this.state.geocode != null && this.state.currentLocation ? (
                    <TouchableNativeFeedback
                      onPress={() => this._navigate('SearchPlaces')}
                      useForeground={true}
                      background={TouchableNativeFeedback.Ripple(
                        'rgba(0,0,0,.15)',
                        false,
                      )}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 40 / 2,
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ion size={20} name="search" />
                      </View>
                    </TouchableNativeFeedback>
                  ) : null}
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  marginBottom: 20,
                  height: 70,
                  overflow: 'hidden',
                }}
              >
                <View>
                  {this.state.geocode != null && this.state.currentLocation ? (
                    this.state.destination == null ? (
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 30 / 2,
                          backgroundColor: Color.primary,
                        }}
                      >
                        <Fa
                          iconStyle="solid"
                          color={Color.white}
                          size={18}
                          name="map-marker-alt"
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 30 / 2,
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
                    )
                  ) : (
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 30 / 2,
                        backgroundColor: Color.grayLighter,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  {this.state.geocode != null && this.state.currentLocation ? (
                    <View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontWeight: 'bold',
                          lineHeight: 20,
                          marginBottom: 3,
                        }}
                      >
                        {this.state.geocode.title}
                      </Text>
                      <Text numberOfLines={2} style={{ lineHeight: 20 }}>
                        {this.state.geocode.address}
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View
                        style={{
                          width: 70,
                          height: 15,
                          marginBottom: 10,
                          backgroundColor: Color.grayLighter,
                          borderRadius: 4,
                        }}
                      />
                      <View
                        style={{
                          width: '100%',
                          height: 15,
                          marginBottom: 10,
                          backgroundColor: Color.grayLighter,
                          borderRadius: 4,
                        }}
                      />
                      <View
                        style={{
                          width: 80,
                          height: 15,
                          marginBottom: 10,
                          backgroundColor: Color.grayLighter,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
              <View style={{ marginBottom: 15 }}>
                {this.state.geocode != null && this.state.currentLocation ? (
                  this.state.destination === null ? (
                    <Button
                      title="Set lokasi tujuan"
                      onPress={this._setDestination}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <Button
                      blue
                      title="Set lokasi jemput"
                      onPress={this._setOrigin}
                      style={{ flex: 1 }}
                    />
                  )
                ) : (
                  <Button
                    title=" "
                    style={{
                      flex: 1,
                      backgroundColor: Color.grayLighter,
                      elevation: 0,
                    }}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

// function mapStateToProps(state) {
//   return {
//     locations: state.locations,
//     geocode: state.geocode
//   }
// }

// function mapDispatchToProps(dispatch) {
//   return {
//     getCurrentLocation: bindActionCreators(getCurrentLocation, dispatch),
//     changeRegion: bindActionCreators(changeRegion, dispatch),
//     changeGeocode: bindActionCreators(changeGeocode, dispatch),
//     setRideOrigin: bindActionCreators(setRideOrigin, dispatch),
//     setRideDestination: bindActionCreators(setRideDestination, dispatch),
//     setFare: bindActionCreators(setFare, dispatch)
//   }
// }

// export default connect(mapStateToProps, mapDispatchToProps)(Home)
export default Home;
