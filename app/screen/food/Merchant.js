/* eslint-disable react-native/no-inline-styles */
import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  StatusBar,
  BackHandler,
  Alert,
  ToastAndroid,
  Dimensions,
  Platform,
} from 'react-native';
import Color from '../../components/Color';
import {
  PopUp,
  Input,
  Button,
  DummyMerchantInfo,
} from '../../components/Components';
import { MerchantSection } from '../../components/Section';
import Currency from '../../helpers/Currency';
import { getCurrentPosition } from '../../actions/locations.actions';
import {
  addToCart,
  removeFromCart,
  getCart,
  editCart,
} from '../../actions/carts.actions';
import { getGeocoding } from '../../actions/geocode.actions';
import cancellablePromise from '../../helpers/cancellablePromise';
import { HOST_REST_API } from '../../components/Define';
import getImageThumb from '../../helpers/getImageThumb';
import Toast from 'react-native-simple-toast';
const { width, height } = Dimensions.get('window');

export default class Merchant extends Component {
  backHandler;
  constructor(props) {
    super(props);
    this.state = {
      popUp: false,
      opened: false,
      merchant: null,
      popUpFood: null,
      popUpCatatan: false,
      formCatatan: '',
      idCatatanAktif: '',
      carts: [],
      cartMerchant: '',
      foods: [],
      position: props.route.params?.data.position || null,
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
    this.backHandler?.remove()
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
    if (this.props.route.params?.actionNext) {
      this.props.route.params?.actionNext();
    }

    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
  }

  componentDidMount() {
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setBarStyle('light-content', true);
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', this._handleBackPress);
    if(this.props.route.params?.data.position) {
      this._fetchDataMerchant()
    } else {
      this._getLocation();
    }
  }

  _getLocation = () => {
    const wrappedPromise = cancellablePromise(getCurrentPosition());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(position => {
        this.setState(
          {
            position,
          },
          () => {
            this._fetchDataMerchant();
          },
        );
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

  _dataCart = () => {
    const wrappedPromise = cancellablePromise(getCart());
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(carts => {
        this.setState({
          carts,
        });
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      });
  };

  _fetchDataMerchant = () => {
    const merchantId = this.props.route.params?.data.merchantId;
    if (!merchantId) return;
    const wrappedPromise = cancellablePromise(
      this._promiseMerchant(merchantId),
    );
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(merchant => {
        if (merchant) {
          merchant.merchantOcs === 'closed' &&
            Alert.alert('Toko tutup', 'Maaf toko saat ini sedang tutup', [
              {
                text: 'Kembali',
                onPress: () => {
                  this.props.navigation.goBack();
                },
              },
              { cancelable: true },
            ]);
          this.setState({ merchant }, () => {
            this._fetchDataFood();
          });
        } else {
          this.props.navigation.goBack();
          if (Platform.OS === 'android') {
            ToastAndroid.show('Toko libur hari ini', ToastAndroid.SHORT);
          } else {
            Toast.show('Toko libur hari ini', Toast.SHORT);
          }
        }
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        Alert.alert(
          'Gagal mendapatkan info resto',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._fetchDataMerchant,
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

  _fetchDataFood = () => {
    const merchantId = this.props.route.params?.data.merchantId;
    const foodId = this.props.route.params?.data.foodId;
    if (!merchantId) return;
    const wrappedPromise = cancellablePromise(this._promiseFoods(merchantId));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(foods => {
        this.setState(
          {
            foods: foods,
          },
          () => {
            if (foodId != null) {
              let forPopUp = foods.filter(f => {
                return f.foodId === foodId;
              });
              if (forPopUp.length > 0) {
                this._openPopUpFood(forPopUp[0]);
              }
            }
            this._dataCart();
          },
        );
      })
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      })
      .catch(error => {
        Alert.alert(
          'Gagal mendapatkan data makanan',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._fetchDataMerchant,
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

  _fetchGeocoding = location => {
    const wrappedPromise = cancellablePromise(getGeocoding(location));
    this.appendPendingPromise(wrappedPromise);
    wrappedPromise.promise
      .then(geocode => {})
      .then(() => {
        this.removePendingPromise(wrappedPromise);
      });
  };

  _promiseFoods = merchantId => {
    return new Promise((resolve, reject) => {
      fetch(`${HOST_REST_API}food/${merchantId}`)
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  };

  _promiseMerchant = merchantId => {
    return new Promise((resolve, reject) => {
      fetch(`${HOST_REST_API}merchant/${merchantId}`)
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  };

  _handleBackPress = () => {
    if (this.state.opened) {
      this.setState({
        opened: false,
      });
      return true;
    }
  };

  _navigate = (screen, params = {}) => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'light-content',
        background: 'transparent',
      },
      data: {
        position: this.state.position,
      },
      actionBack: () => this._dataCart(),
      ...params,
    });
  };

  _openPopUpFood = data => {
    this.setState(
      {
        popUpFood: data,
      },
      () => {
        this.setState({
          popUp: true,
          opened: true,
        });
      },
    );
  };

  _closePopUp = () => {
    this.setState({
      popUp: false,
      opened: false,
    });
  };

  _removeCart = id => {
    removeFromCart(id).then(items => {
      this.setState({
        carts: items,
      });
    });
  };

  _addCart = data => {
    addToCart(data, this.state.merchant).then(items => {
      this.setState({
        carts: items,
      });
    });
  };

  _closePopUpCatatan = () => {
    this.setState({
      opened: false,
      popUpCatatan: false,
    });
  };

  _openPopUpCatatan = foodId => {
    let data = this.state.carts.filter(e => {
      return e.foodId === foodId;
    });
    this.setState({
      popUpCatatan: true,
      opened: true,
      idCatatanAktif: foodId,
      formCatatan: data[0].note,
    });
  };

  _editCatatan = () => {
    let { idCatatanAktif, formCatatan } = this.state;
    let catatan = {
      note: formCatatan,
    };
    editCart(idCatatanAktif, catatan).then(carts => {
      this.setState({
        carts: carts,
        formCatatan: '',
      });
    });
  };

  render() {
    let { carts, merchant, foods, popUpFood, position } = this.state;
    return (
      <View style={{ flex: 1, backgroundColor: Color.grayLighter }}>
        {foods.length > 0 ? (
          <MerchantSection
            currentPosition={position}
            isFromOrderPage={this.props.route.params?.isFromOrderPage}
            info={merchant}
            carts={carts}
            foods={foods}
            removeCartAction={this._removeCart}
            addCartAction={this._addCart}
            openPopUpFood={this._openPopUpFood}
            openPopUpCatatan={this._openPopUpCatatan}
            navigate={this._navigate}
            navigation={this.props.navigation}
          />
        ) : (
          <DummyMerchantInfo />
        )}
        {this.state.popUp ? (
          <PopUp
            opened={this.state.opened}
            content={
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    width: width - 30,
                    height: ((width - 30) / 16) * 9,
                    marginBottom: 20,
                  }}
                >
                  <Image
                    style={{ width: '100%', height: '100%', borderRadius: 10 }}
                    source={{ uri: getImageThumb(popUpFood.foodPicture, 'md') }}
                  />
                </View>
                {popUpFood.foodDiscount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: -8.75,
                      width: 120,
                      height: 53,
                    }}
                  >
                    <Image
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                      source={require('../../images/ribbon.png')}
                    />
                  </View>
                )}
                <Text
                  style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 3 }}
                >
                  {popUpFood.foodName}
                </Text>
                <Text style={{ marginBottom: 15 }}>
                  {popUpFood.foodDetails}
                </Text>
                <View
                  style={{
                    borderTopColor: Color.borderColor,
                    borderTopWidth: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontWeight: 'bold' }}>Harga</Text>
                    <View
                      style={{ flexDirection: 'row', marginHorizontal: -5 }}
                    >
                      <Text style={{ fontWeight: 'bold', marginHorizontal: 5 }}>
                        {Currency(
                          popUpFood.foodPrice -
                            (popUpFood.foodDiscount / 100) *
                              popUpFood.foodPrice,
                        )}
                      </Text>
                      {popUpFood.foodDiscount > 0 && (
                        <Text
                          style={{
                            fontWeight: 'bold',
                            marginHorizontal: 5,
                            textDecorationLine: 'line-through',
                            textDecorationStyle: 'solid',
                            color: Color.textMuted,
                          }}
                        >
                          {Currency(
                            popUpFood.foodPrice -
                              (popUpFood.foodDiscount / 100) *
                                popUpFood.foodPrice,
                          )}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            }
            btnPrimaryTitle="Tambahkan ke keranjang"
            btnPrimaryAction={() => {
              this._addCart(popUpFood);
              this._closePopUp();
            }}
            close={this._closePopUp}
          />
        ) : null}
        {this.state.popUpCatatan ? (
          <PopUp
            opened={this.state.opened}
            content={
              <View>
                <Text
                  style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}
                >
                  Tambahkan catatan untuk pesanan
                </Text>
                <Input
                  maxLength={200}
                  onChangeText={text => {
                    this.setState({ formCatatan: text });
                  }}
                  style={{ paddingHorizontal: 10, marginBottom: 15 }}
                  value={this.state.formCatatan}
                  placeholder="Contoh: Extra pedas!"
                  multiline={true}
                  styleTextInput={{
                    height: 100,
                    textAlignVertical: 'top',
                    paddingVertical: 10,
                  }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: Color.textMuted }}>
                      {this.state.formCatatan.length} / 200
                    </Text>
                  </View>
                  <Button
                    onPress={() => {
                      this._editCatatan();
                      this._closePopUpCatatan();
                    }}
                    small
                    green
                    title="Selesai"
                  />
                </View>
              </View>
            }
            close={this._closePopUpCatatan}
          />
        ) : null}
      </View>
    );
  }
}
