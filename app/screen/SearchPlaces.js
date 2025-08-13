/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Image,
  Text,
  TouchableHighlight,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SimpleHeader, Input } from '../components/Components';
import Color from '../components/Color';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  dataPlaces,
  getDataPlaces,
  getCurrentPosition,
} from '../actions/locations.actions';
import cancellablePromise from '../helpers/cancellablePromise';
import Fa from '@react-native-vector-icons/fontawesome5';

class SearchPlaces extends Component {
  timeoutSearch;
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      isSearching: false,
      region: null,
      places: [],
      nextPageToken: null,
    };
  }

  componentDidMount() {
    this._getLocation();
  }

  _getLocation = () => {
    const wrappedPromise = cancellablePromise(getCurrentPosition());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(position => {
        this.setState({
          region: {
            latitude: position.latitude,
            longitude: position.longitude,
          },
        });
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        Alert.alert(
          'Gagal mendapatkan lokasi terkini',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._getLocation,
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

  componentWillUnmount() {
    this.pendingPromises.map(p => {
      p.cancel();
      this.removePendingPromise(p);
    });
  }

  pendingPromises = [];

  appendPendingPromise = promise => {
    this.pendingPromises = [...this.pendingPromises, promise];
  };

  removePendingPromise = promise => {
    this.pendingPromises = this.pendingPromises.filter(p => p !== promise);
  };

  _changeText = search => {
    if (this.timeoutSearch) clearTimeout(this.timeoutSearch);
    this.setState(
      {
        search,
      },
      () => {
        if (this.state.search)
          this.timeoutSearch = setTimeout(() => {
            this._onSearch();
          }, 800);
      },
    );
  };

  _onSearch = () => {
    this.setState(
      {
        isSearching: true,
      },
      () => {
        const wrappedPromise = cancellablePromise(
          getDataPlaces(
            this.state.region.latitude + ',' + this.state.region.longitude,
            this.state.search,
            this.state.nextPageToken,
          ),
        );
        this.appendPendingPromise(wrappedPromise);
        wrappedPromise.promise
          .then(places => {
            console.log(places);
            if (!this.state.nextPageToken) {
              this.setState({
                places: places.results,
              });
            } else {
              this.state.places.push(...places.results);
            }
            this.setState({
              nextPageToken: places.next_page_token || null,
            });
          })
          .then(() => {
            this.setState(
              {
                isSearching: false,
              },
              () => {
                this.removePendingPromise(wrappedPromise);
              },
            );
          })
          .catch(error => {
            Alert.alert(
              'Gagal mendapatkan tempat',
              'Terjadi kesalahan pada sistem, coba lagi nanti',
              [
                {
                  text: 'Coba lagi',
                  onPress: this._onSearch,
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
      },
    );
  };

  _chooseLocation = (lat, lng, title) => {
    this.props.navigation.goBack();
    this.props.route.params?.actionBySearch(lat, lng, title);
  };

  _onScrollEndDrag = e => {
    if (
      e.nativeEvent.contentOffset.y >=
      e.nativeEvent.contentSize.height -
        e.nativeEvent.layoutMeasurement.height -
        100
    )
      if (this.state.nextPageToken) this._onSearch();
  };

  render() {
    let dummyResults = [];
    for (let i = 0; i < 10; i++) {
      dummyResults.push(
        <View
          key={i}
          style={{ paddingHorizontal: 15, backgroundColor: Color.white }}
        >
          <View style={{ flexDirection: 'row' }}>
            <View style={{ paddingRight: 15, paddingTop: 18 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: Color.grayLighter,
                  borderRadius: 40 / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </View>
            <View
              style={{
                borderBottomColor: Color.borderColor,
                borderBottomWidth: 1,
                paddingVertical: 15,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 180,
                  height: 16,
                  marginBottom: 9,
                  marginTop: 1,
                  backgroundColor: Color.grayLighter,
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  width: '100%',
                  height: 15,
                  marginBottom: 4,
                  marginTop: 1,
                  backgroundColor: Color.grayLighter,
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  width: 120,
                  height: 15,
                  marginBottom: 4,
                  marginTop: 1,
                  backgroundColor: Color.grayLighter,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>,
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <View style={[{ backgroundColor: Color.white }]}>
          <SimpleHeader
            goBack
            navigation={this.props.navigation}
            mainComponent={
              this.state.region ? (
                <Input
                  autoFocus={true}
                  returnKeyType="search"
                  style={{ flex: 1 }}
                  value={this.state.search}
                  feather
                  icon="search"
                  placeholder="Cari tempat"
                  onChangeText={this._changeText}
                />
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: Color.grayLighter,
                    borderRadius: 10,
                    paddingHorizontal: 15,
                  }}
                >
                  <View
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: Color.grayLight,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, height: 40, padding: 0 }} />
                </View>
              )
            }
          />
        </View>
        {this.state.isSearching && this.state.places.length < 1 ? (
          <View style={{ flex: 1, overflow: 'hidden' }}>{dummyResults}</View>
        ) : this.state.places.length < 1 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 30,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>
              Pencarian tempat
            </Text>
            <Text
              style={{
                textAlign: 'center',
                lineHeight: 18,
                color: Color.textMuted,
              }}
            >
              Masukan nama tempat yang ingin Anda cari
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={this._onScrollEndDrag}
            scrollEventThrottle={16}
          >
            {this.state.places.length > 0 ? (
              <>
                {this.state.places.map((p, i) => (
                  <TouchableHighlight
                    key={i}
                    onPress={() => {
                      this._chooseLocation(
                        p.geometry.location.lat,
                        p.geometry.location.lng,
                        p.name,
                      );
                    }}
                    activeOpacity={0.85}
                    underlayColor="#fff"
                  >
                    <View
                      style={{
                        paddingHorizontal: 15,
                        backgroundColor: Color.white,
                      }}
                    >
                      <View style={{ flexDirection: 'row' }}>
                        <View style={{ paddingRight: 15, paddingTop: 18 }}>
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: Color.grayLighter,
                              borderRadius: 40 / 2,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Image
                              style={{ width: 24, height: 24 }}
                              source={{ uri: p.icon }}
                            />
                          </View>
                        </View>
                        <View
                          style={{
                            borderBottomColor: Color.borderColor,
                            borderBottomWidth: 1,
                            paddingVertical: 15,
                            flex: 1,
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 16,
                              fontWeight: 'bold',
                              marginBottom: 5,
                            }}
                          >
                            {p.name}
                          </Text>
                          <Text
                            style={{ color: Color.textMuted, lineHeight: 18 }}
                          >
                            {p.vicinity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableHighlight>
                ))}
                {this.state.nextPageToken ? dummyResults[0] : null}
              </>
            ) : (
              <View style={{ paddingHorizontal: 15 }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ paddingRight: 15, paddingTop: 18 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: Color.grayLighter,
                        borderRadius: 40 / 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Fa
                        iconStyle="solid"
                        name="map-marker-alt"
                        size={26}
                        color={Color.red}
                      />
                    </View>
                  </View>
                  <View
                    style={{
                      borderBottomColor: Color.borderColor,
                      borderBottomWidth: 1,
                      paddingVertical: 15,
                      flex: 1,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginBottom: 5,
                      }}
                    >
                      Tidak ada hasil yang ditemukan
                    </Text>
                    <Text style={{ color: Color.textMuted }}>
                      Maaf kami tidak dapat menemukan tempat yang Anda cari,
                      coba kata kunci lain.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}
        {this.state.region == null && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: Color.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size={100} color={Color.green} />
          </View>
        )}
      </View>
    );
  }
}

function mapStateToProps(state) {
  return {
    locations: state.locations,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dataPlaces: bindActionCreators(dataPlaces, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchPlaces);
