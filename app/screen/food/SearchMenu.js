/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Text, Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView
} from 'react-native';
import {
  Items,
  DummyItems,
  Input
} from '../../components/Components';
import Color from '../../components/Color';
import cancellablePromise from '../../helpers/cancellablePromise';
import { HOST_REST_API } from '../../components/Define';

export default class SearchMenu extends Component {
  timeoutFetch;
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      data: [],
      isAbleToScroll: false,
      isFetchReached: false,
      scrolling: true,
      dataEmpty: false,
      status: 'NOT_SEARCH_YET',
      search: '',
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
    if (this.props.route.params?.statusbar) {
      StatusBar.setBarStyle(
        this.props.route.params?.statusbar.barStyle,
        true,
      );
      Platform.OS === 'android' &&
        StatusBar.setBackgroundColor(
          this.props.route.params?.statusbar.background,
          true,
        );
    }
    if (this.props.route.params?.actionBack) {
      this.props.route.params?.actionBack();
    }
    clearInterval(this.timeoutFetch);
    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
  }

  _fetchData = () => {
    const wrappedPromise = cancellablePromise(this._promiseFetch());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(res => {
        this.state.page === 1 &&
          res.length <= 0 &&
          this.setState({
            dataEmpty: true,
            status: 'EMPTY',
          });

        res.length > 0
          ? this.setState(
              {
                data: [...this.state.data, ...res],
                status: 'READY',
              },
              () => {
                this.setState({
                  scrolling: true,
                });
              },
            )
          : this.setState(
              {
                isFetchReached: true,
              },
              () => {
                this.setState({
                  scrolling: true,
                });
              },
            );
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        Alert.alert(
          'Koneksi gagal',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._fetchData,
            },
            {
              text: 'Kembali',
              onPress: () => {
                this.props.navigation.goBack();
              },
            },
          ],
          {cancelable: false},
        );
      });
  };

  _search = search => {
    clearTimeout(this.timeoutFetch);
    this.setState({search}, () => {
      if (this.state.search !== '') {
        this.timeoutFetch = setTimeout(() => {
          this.setState(
            {
              status: 'LOADING',
              page: 1,
              data: [],
            },
            () => {
              this._fetchData();
            },
          );
        }, 500);
      } else {
        this.setState({
          status: 'NOT_SEARCH_YET',
        });
      }
    });
  };

  _promiseFetch = () => {
    let {page, search} = this.state;
    let {cityName, position} = this.props.route.params?.data;
    cityName = encodeURI(cityName);
    search = encodeURI(search);
    return new Promise((resolve, reject) => {
      fetch(
        `${HOST_REST_API}food/get?cari=${search}&koordinat=${
          position.latitude
        },${position.longitude}&orderby=nearest&kota=${cityName}&page=${page}`,
      )
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  };

  _navigate = (screen, data) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: Color.white,
      },
      data: data,
    });
  };

  render() {
    const {
      data,
      page,
      isAbleToScroll,
      isFetchReached,
      scrolling,
      status,
    } = this.state;
    const isCloseToBottom = ({
      layoutMeasurement,
      contentOffset,
      contentSize,
    }) => {
      const paddingToBottom = 20;
      return (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      );
    };

    return (
      <View style={{flex: 1}}>
        <View
          style={{elevation: 1, backgroundColor: Color.white}}>
          <View
            style={{
              paddingTop: StatusBar.currentHeight + 10,
              paddingBottom: 10,
              backgroundColor: Color.white,
            }}>
            <Input
              autoFocus
              onChangeText={this._search}
              feather
              icon="search"
              style={{marginHorizontal: 15, marginBottom: 10}}
              placeholder="Mau makan apa hari ini?"
            />
          </View>
        </View>
        {status === 'READY' && data.length > 0 && (
          <ScrollView
            bounces={false}
            onScrollBeginDrag={() => {
              this.setState({
                isAbleToScroll: true
              })
            }}
            scrollEventThrottle={16}
            onMomentumScrollEnd={({nativeEvent}) => {
              if (isCloseToBottom(nativeEvent)) {
                !isFetchReached &&
                  scrolling &&
                  this.setState(
                    {
                      scrolling: false,
                    },
                    () => {
                      this.timeoutFetch = setTimeout(
                        function() {
                          this.setState(
                            {
                              page: page + 1,
                            },
                            () => {
                              this._fetchData();
                            },
                          );
                        }.bind(this),
                        3000,
                      );
                    },
                  );
              } else {
                clearInterval(this.timeoutFetch);
                this.setState({
                  scrolling: true,
                });
              }
            }}>
            <Items
              headless={true}
              navigate={this._navigate}
              category="food"
              product={data}
            />
            {(isAbleToScroll && !isFetchReached) && (
              <View
                style={{
                  padding: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ActivityIndicator size="large" color={Color.success} />
              </View>
            )}
          </ScrollView>
        )}
        {status === 'LOADING' && <DummyItems headless horizontal />}
        {status === 'EMPTY' && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 30,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 6}}>
              Yah tidak ketemu
            </Text>
            <Text
              style={{
                textAlign: 'center',
                lineHeight: 18,
                color: Color.textMuted,
              }}>
              Maaf kami tidak dapat menemukan menu yang anda cari
            </Text>
          </View>
        )}
        {status === 'NOT_SEARCH_YET' && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 30,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 6}}>
              Mau makan apa?
            </Text>
            <Text
              style={{
                textAlign: 'center',
                lineHeight: 18,
                color: Color.textMuted,
              }}>
              Cari resto dan menu favoritmu disini
            </Text>
          </View>
        )}
      </View>
    );
  }
}
