/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Text,
  StatusBar, Image,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  TouchableHighlight
} from 'react-native';
import Color from '../components/Color';
import { SimpleHeader, Button } from '../components/Components';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import Ion from '@react-native-vector-icons/ionicons';
import Fa from '@react-native-vector-icons/fontawesome5';
import Spinner from 'react-native-spinkit';
import { getCurrentPosition } from '../actions/locations.actions';
import { getGeocoding, getAddressComponents } from '../actions/geocode.actions';
import cancellablePromise from '../helpers/cancellablePromise';
import { LATITUDE_DELTA, LONGITUDE_DELTA } from '../components/Define';

class MapSelecting extends Component {
  pendingPromises = [];
  loadingTimeout;
  constructor(props) {
    super(props);
    this.state = {
      currentLocation: false,
      region: {
        latitude: -0.5327255,
        // latitude: -0.39601500329,
        longitude: 101.570019,
        // longitude: 102.4153175120702,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      newRegion: null,
      userLocation: false,
      regionSelected: null,
      geocode: null,
      titleBySearch: '',
      position: null,
      isMapReady: false,
    };
  }

  appendPendingPromise = promise => {
    this.pendingPromises = [...this.pendingPromises, promise];
  };

  removePendingPromise = promise => {
    this.pendingPromises = this.pendingPromises.filter(p => p !== promise);
  };

  componentDidMount() {
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor('rgba(255,255,255,.5)', true);
    StatusBar.setBarStyle('dark-content', true);
  }

  _mapReady = () => {
    if (this.props.route.params?.selectedLocation) {
      const selectedLocation = this.props.route.params?.selectedLocation;
      const position = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      this.setState(
        {
          currentLocation: true,
          region: position,
          userLocation: true,
          isMapReady: true,
        },
        () => {
          this._changeLocation(
            selectedLocation.latitude,
            selectedLocation.longitude,
          );
        },
      );
    } else {
      const wrappedPromise = cancellablePromise(this.getLocation());
      this.appendPendingPromise(wrappedPromise);
      wrappedPromise.promise
        .then(position => {
          position = {
            latitude: position.latitude,
            longitude: position.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          };
          this.setState(
            {
              newRegion: position,
              userLocation: true,
              isMapReady: true,
            },
            () => {
              this._changeLocation(position.latitude, position.longitude);
            },
          );
        })
        .then(() => {
          this.setState({
            currentLocation: true,
          });
          this.removePendingPromise(wrappedPromise);
        })
        .catch(error => {
          Alert.alert(
            'Gagal mendapatkan lokasi terkini',
            'Terjadi kesalahan pada sistem, coba lagi nanti',
            [
              {
                text: 'Coba lagi',
                onPress: this._mapReady,
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
    }
  };

  getLocation = async () => {
    try {
      let position = await getCurrentPosition();
      return position;
    } catch (error) {
      return error;
    }
  };

  componentWillUnmount() {
    this.pendingPromises.map(p => {
      p.cancel();
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
    const { position } = this.state;
    const wrappedPromise = cancellablePromise(getGeocoding(position));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(geocode => {
        let poi = getAddressComponents(geocode);
        this.loadingTimeout = setTimeout(
          function () {
            this.setState({
              geocode: {
                title:
                  this.state.titleBySearch != ''
                    ? this.state.titleBySearch
                    : poi[0],
                address: poi[1],
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
        Alert.alert(
          'Gagal mendapatkan info lokasi',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getGeocode,
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

  _navigate = (screen, params = {}) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: Color.white,
      },
      ...params,
    });
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

  _changeLocation = (latitude, longitude) => {
    this._mapView.animateToRegion({
      latitude: latitude,
      longitude: longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  _selectLocation = selected => {
    this.props.route.params?.selectLocation(selected);
    this.props.navigation.goBack();
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

  render() {
    return (
      <View style={{ flex: 1 }}>
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
          rightComponent={
            this.state.region ? (
              <View>
                <TouchableHighlight
                  style={{ borderRadius: 40 / 2 }}
                  activeOpacity={0.85}
                  underlayColor="#fff"
                  onPress={this._toCurrentLocation}
                >
                  <View
                    style={{
                      height: 40,
                      marginHorizontal: 5,
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
        <View style={{ flex: 1, backgroundColor: Color.grayLighter }}>
          <View style={{ flex: 1 }}>
            <MapView
              // showsUserLocation={this.state.userLocation}
              followsUserLocation={true}
              onUserLocationChange={this._userLocationChange}
              ref={_mapView => (this._mapView = _mapView)}
              onRegionChange={this._regionChange}
              onRegionChangeComplete={this._regionChangeComplete}
              onMapReady={this._mapReady}
              provider={PROVIDER_GOOGLE}
              initialRegion={this.state.region}
              style={{ flex: 1 }}
              mapPadding={{
                top: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
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
              {this.props.route.params?.selectType &&
              this.props.route.params?.selectType === 'pickup' ? (
                <Image
                  style={{ width: '100%', height: '100%' }}
                  source={require('../images/icons/passenger-marker.png')}
                />
              ) : (
                <Image
                  style={{ width: '100%', height: '100%' }}
                  source={require('../images/icons/destination-marker.png')}
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
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            backgroundColor: Color.white,
            elevation: 5,
          }}
        >
          <View
            style={{
              backgroundColor: Color.white,
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size={100} color={Color.green} />
          </View>
          <Animated.View
            style={{
              backgroundColor: Color.white,
              paddingHorizontal: 15,
              opacity: this.state.loading,
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
                {this.props.route.params?.selectType &&
                this.props.route.params?.selectType === 'pickup' ? (
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      paddingRight: 10,
                    }}
                  >
                    Set lokasi jemput
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      paddingRight: 10,
                    }}
                  >
                    Set lokasi tujuan
                  </Text>
                )}
                {this.state.geocode != null &&
                this.state.currentLocation ? null : (
                  <ActivityIndicator size="small" color={Color.secondary} />
                )}
              </View>
              <TouchableHighlight
                style={{ borderRadius: 40 / 2 }}
                activeOpacity={0.85}
                underlayColor="#fff"
                onPress={() =>
                  this._navigate('SearchPlaces', {
                    actionBySearch: this._actionBySearch,
                  })
                }
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
              </TouchableHighlight>
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
                  this.props.route.params?.selectType &&
                  this.props.route.params?.selectType === 'pickup' ? (
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 30 / 2,
                        backgroundColor: Color.blue,
                      }}
                    >
                      <Fa
                        iconStyle="solid"
                        color={Color.white}
                        size={18}
                        name="user"
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
                        name="map-marker-alt"
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
                  ></View>
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
                    ></View>
                    <View
                      style={{
                        width: '100%',
                        height: 15,
                        marginBottom: 10,
                        backgroundColor: Color.grayLighter,
                        borderRadius: 4,
                      }}
                    ></View>
                    <View
                      style={{
                        width: 80,
                        height: 15,
                        marginBottom: 10,
                        backgroundColor: Color.grayLighter,
                        borderRadius: 4,
                      }}
                    ></View>
                  </View>
                )}
              </View>
            </View>
            <View style={{ marginBottom: 15 }}>
              {this.state.geocode != null && this.state.currentLocation ? (
                this.props.route.params?.selectType &&
                this.props.route.params?.selectType === 'pickup' ? (
                  <Button
                    blue
                    title="Set jemput"
                    onPress={() => {
                      this._selectLocation({
                        geometry: this.state.regionSelected,
                        geocode: this.state.geocode,
                      });
                    }}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    title="Set tujuan"
                    onPress={() => {
                      this._selectLocation({
                        geometry: this.state.regionSelected,
                        geocode: this.state.geocode,
                      });
                    }}
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
          </Animated.View>
        </Animated.View>
      </View>
    );
  }
}

export default MapSelecting;
