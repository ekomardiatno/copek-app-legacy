import { Component } from 'react';
import { View, Text, StatusBar, Platform, ScrollView } from 'react-native';
import { SimpleHeader, Card, DashLine } from '../components/Components';
import Color from '../components/Color';
import Fa from '@react-native-vector-icons/fontawesome5';
import Currency from '../helpers/Currency';
import DistanceFormat from '../helpers/DistanceFormat';
import dateFormatted from '../helpers/dateFormatted';

export default class OrderDetails extends Component {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    Platform.OS === 'android' &&
      StatusBar.setBackgroundColor(Color.white, true);
    StatusBar.setBarStyle('dark-content', true);
    if (this.props.route.params?.backListener) {
      this.props.route.params?.backListener.remove();
    }
  }

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
    if (this.props.route.params?.backListener) {
      this.props.route.params?.backListener.add();
    }
  }

  _navigate = screen => {
    this.props.navigation.navigate(screen, {
      statusbar: {
        barStyle: 'dark-content',
        background: Color.white,
      },
    });
  };

  render() {

    const {
      carts,
      fare,
      merchant,
      distances,
      destination,
      date,
      orderType,
      origin,
      orderId,
    } = this.props.route.params?.data;

    let estimatedPrice = 0;
    if (carts !== undefined) {
      carts.map(c => {
        estimatedPrice += c.foodPrice * c.qty;
      });
    }
    return (
      <View style={{flex: 1, backgroundColor: Color.grayLighter}}>
        <View
          style={[{backgroundColor: Color.white}]}>
          <SimpleHeader
            goBack
            navigation={this.props.navigation}
            title="Detail Order"
          />
        </View>
        <ScrollView>
          <Card
            headerStyleGray
            headerTitle={
              orderType === 'FOOD' ? 'Detail Pengiriman' : 'Detail Alamat'
            }
            body={
              <View style={{paddingHorizontal: 15}}>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 15,
                    alignItems: 'center',
                  }}>
                  <View>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 45 / 2,
                        backgroundColor:
                          orderType === 'RIDE' ? Color.blue : Color.red,
                      }}>
                      {orderType === 'RIDE' && (
                        <Fa iconStyle='solid' size={16} color={Color.white} name="user" />
                      )}
                      {orderType === 'FOOD' && (
                        <Fa iconStyle='solid' size={16} color={Color.white} name="utensils" />
                      )}
                    </View>
                  </View>
                  <View style={{paddingHorizontal: 10, flex: 1}}>
                    <Text
                      numberOfLines={1}
                      style={{fontSize: 11, textTransform: 'uppercase'}}>
                      {orderType === 'FOOD'
                        ? 'Alamat restoran'
                        : 'Alamat jemput'}
                    </Text>
                    {orderType === 'FOOD' && (
                      <Text
                        numberOfLines={1}
                        style={{fontSize: 14, fontWeight: 'bold'}}>
                        {merchant.merchantName},{' '}
                        {merchant.merchantAddress.split(',')[0] !==
                        'Unnamed Road'
                          ? merchant.merchantAddress.split(',')[0]
                          : merchant.merchantAddress
                              .split(',')[1]
                              .slice(
                                1,
                                merchant.merchantAddress.split(',')[1].length,
                              )}
                      </Text>
                    )}
                    {orderType === 'RIDE' && (
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          marginTop: 5,
                        }}>
                        {origin.geocode.title}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 15,
                    alignItems: 'center',
                  }}>
                  <View>
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 45 / 2,
                        backgroundColor: Color.secondary,
                      }}>
                      <Fa iconStyle='solid' color={Color.white} size={16} name="map-marker-alt" />
                    </View>
                  </View>
                  <View style={{paddingHorizontal: 10, flex: 1}}>
                    <Text
                      numberOfLines={1}
                      style={{fontSize: 11, textTransform: 'uppercase'}}>
                      {orderType === 'FOOD'
                        ? 'Alamat pengiriman'
                        : 'Alamat tujuan'}{' '}
                      • {DistanceFormat(distances.distance)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{fontSize: 14, fontWeight: 'bold', marginTop: 5}}>
                      {destination.geocode.title}
                    </Text>
                  </View>
                </View>
                <View style={{position: 'absolute', left: 28, top: 38}}>
                  <Fa iconStyle='solid' color={Color.textMuted} name="ellipsis-v" />
                </View>
              </View>
            }
          />
          <Card
            headerStyleGray
            headerTitle="Info Pesanan"
            body={
              <View style={{paddingHorizontal: 15, paddingBottom: 9}}>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 6,
                    marginHorizontal: -3,
                    alignItems: 'flex-start',
                  }}>
                  <Text style={{flex: 1, fontSize: 13, marginHorizontal: 3}}>
                    No. pesanan
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: 'right',
                      fontSize: 13,
                      marginHorizontal: 3,
                    }}>
                    {orderType === 'RIDE' ? 'R' : 'F'}-{orderId}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 6,
                    marginHorizontal: -3,
                    alignItems: 'flex-start',
                  }}>
                  <Text style={{flex: 1, fontSize: 13, marginHorizontal: 3}}>
                    Dibuat pada
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: 'right',
                      fontSize: 13,
                      marginHorizontal: 3,
                    }}>
                    {dateFormatted(date, true)}
                  </Text>
                </View>
              </View>
            }
          />
          {orderType === 'FOOD' && (
            <Card
              headerStyleGray
              headerTitle="Pesanan"
              body={
                <View style={{paddingHorizontal: 15, paddingBottom: 9}}>
                  {carts.map(c => (
                    <View
                      key={c.foodId}
                      style={{
                        flexDirection: 'row',
                        marginBottom: 6,
                        marginHorizontal: -3,
                      }}>
                      <View style={{flex: 1, marginHorizontal: 3}}>
                        <Text style={{fontSize: 13, marginBottom: 2}}>
                          {c.foodName}
                        </Text>
                        {/* <View style={{ flexDirection: 'row' }}>
                          <Text style={{ fontSize: 11, color: Color.textMuted, marginRight: 4 }}>Catatan:</Text>
                          <Text style={{ flex: 1, fontSize: 11, color: Color.textMuted }}>Cokelat dan kejunya dibanyakin ya! Sama kalau kasirnya cantik, tolong diminta nomor WA-nya, oke sob?</Text>
                        </View> */}
                      </View>
                      <View style={{width: 30, marginHorizontal: 3}}>
                        <Text
                          style={{
                            textAlign: 'right',
                            fontSize: 13,
                            fontWeight: 'bold',
                          }}>
                          {c.qty}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              }
            />
          )}
          <Card
            headerStyleGray
            headerTitle="Detail Pembayaran"
            body={
              <View style={{paddingHorizontal: 15, paddingBottom: 9}}>
                <View>
                  {orderType === 'FOOD' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        marginBottom: 6,
                        marginHorizontal: -3,
                        alignItems: 'flex-start',
                      }}>
                      <Text
                        style={{flex: 1, fontSize: 13, marginHorizontal: 3}}>
                        Total harga pesanan
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          textAlign: 'right',
                          fontSize: 13,
                          marginHorizontal: 3,
                        }}>
                        {Currency(estimatedPrice)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      flexDirection: 'row',
                      marginBottom: 6,
                      marginHorizontal: -3,
                      alignItems: 'flex-start',
                    }}>
                    <Text style={{flex: 1, fontSize: 13, marginHorizontal: 3}}>
                      {orderType === 'RIDE' ? 'Tarif' : 'Ongkos kirim'}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        fontSize: 13,
                        marginHorizontal: 3,
                      }}>
                      {Currency(fare)}
                    </Text>
                  </View>
                </View>
                <DashLine />
                <View style={{marginTop: 6}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      marginBottom: 6,
                      marginHorizontal: -3,
                      alignItems: 'flex-start',
                    }}>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        marginHorizontal: 3,
                        fontWeight: 'bold',
                      }}>
                      Total pembayaran
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        fontSize: 13,
                        marginHorizontal: 3,
                        fontWeight: 'bold',
                      }}>
                      {orderType === 'FOOD'
                        ? Currency(estimatedPrice + fare)
                        : Currency(fare)}
                    </Text>
                  </View>
                </View>
              </View>
            }
          />
        </ScrollView>
      </View>
    );
  }
}
