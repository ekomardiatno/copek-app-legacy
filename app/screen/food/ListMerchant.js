/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { SimpleHeader, Items, DummyItems } from '../../components/Components';
import Color from '../../components/Color';
import cancellablePromise from '../../helpers/cancellablePromise';
import { HOST_REST_API } from '../../components/Define';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class ListMerchant extends Component {
  timeoutFetch;
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      data: [],
      isFetchReached: false,
      scrolling: true,
      dataEmpty: false,
      status: 'LOADING',
      isLoaderViewed: false,
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
    this._fetchData();
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
          res.length < 1 &&
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
                status: 'READY',
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
          { cancelable: false },
        );
      });
  };

  _promiseFetch = () => {
    const { page } = this.state;
    if (this.props.route.params?.data) {
      const { cityName, position, orderBy } = this.props.route.params.data;
      return new Promise((resolve, reject) => {
        AsyncStorage.getItem('token').then(v => {
          fetch(
            `${HOST_REST_API}merchant/get?kota=${cityName}&koordinat=${position.latitude},${position.longitude}&page=${page}&orderby=${orderBy}`,
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
    }
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
    const { data, page, isFetchReached, isLoaderViewed, scrolling, status } =
      this.state;
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
      <View style={{ flex: 1 }}>
        <View style={[{ backgroundColor: Color.white }]}>
          <SimpleHeader
            goBack
            navigation={this.props.navigation}
            title="Daftar Resto"
          />
        </View>
        {status === 'READY' && data.length > 0 && (
          <ScrollView
            bounces={false}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              this.setState({
                isLoaderViewed: true,
              });
            }}
            onMomentumScrollEnd={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) {
                !isFetchReached &&
                  scrolling &&
                  this.setState(
                    {
                      isBottomScrollView: true,
                      scrolling: false,
                    },
                    () => {
                      this.timeoutFetch = setTimeout(
                        function () {
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
            }}
          >
            <Items
              headless={true}
              navigate={this._navigate}
              category="merchant"
              product={data}
            />
            {isLoaderViewed && !isFetchReached && (
              <View
                style={{
                  padding: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="large" color={Color.success} />
              </View>
            )}
          </ScrollView>
        )}
        {status === 'LOADING' && <DummyItems headless horizontal />}
        {status === 'EMPTY' && (
          <View
            style={{
              padding: 15,
              margin: 15,
              backgroundColor: Color.grayLighter,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: Color.textMuted }}>
              Maaf belum ada menu yang tersedia saat ini
            </Text>
          </View>
        )}
      </View>
    );
  }
}
