/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SimpleHeader, OrderHistoryItem, Button } from '../components/Components'
import Color from '../components/Color'
import AsyncStorage from '@react-native-async-storage/async-storage'
import dateFormatted from '../helpers/dateFormatted'
import Currency from '../helpers/Currency'
import cancellablePromise from '../helpers/cancellablePromise'
import { HOST_REST_API } from '../components/Define'

export default class History extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: [],
      errorFetch: false
    }
  }

  pendingPromises = []

  appendPendingPromise = promise => {
    this.pendingPromises = [...this.pendingPromises, promise]
  }

  removePendingPromise = promise => {
    this.pendingPromises = this.pendingPromises.filter(p => p !== promise)
  }

  componentDidMount() {
    this._getCheckOrderStatus()
  }

  _getData = () => {
    AsyncStorage.getItem('orders', function (_err, orders) {
      if (orders != null) {
        orders = JSON.parse(orders)
        orders.reverse()
        this.setState({
          orders
        })
      }
    }.bind(this))
  }

  _getCheckOrderStatus = () => {
    this.setState({
      errorFetch: false
    })
    const wrappedPromise = cancellablePromise(this._promiseCheckOrderStatus())
    this.appendPendingPromise(wrappedPromise)
    wrappedPromise.promise
      .then(res => {
        if (res.length > 0) {
          for (let i = 0; i < res.length; i++) {
            AsyncStorage.getItem('orders', (_err, order) => {
              if (order !== null) {
                order = JSON.parse(order)
                let index = order.map(item => {
                  return item.orderId
                }).indexOf(res[i].orderId.toString())
                if (res[i].status !== null) {
                  order[index].status = res[i].status
                } else {
                  order.splice(index, 1)
                }
                AsyncStorage.setItem('orders', JSON.stringify(order), _err => {
                  if (i + 1 >= res.length) {
                    this._getData()
                  }
                })
              }
            })
          }
        } else {
          this._getData()
        }
      })
      .then(() => this.removePendingPromise(wrappedPromise))
      .catch(_err => {
        this.setState({
          alert: false
        })
      })
  }

  _promiseCheckOrderStatus = () => {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('orders', (error, result) => {
        if (!error && result !== null) {
          result = JSON.parse(result)
          let filtered = result.filter(a => {
            return a.status !== 'completed' && a.status !== 'cancelled_by_user' && a.status !== 'cancelled_by_driver'
          })
          if (filtered.length > 0) {
            filtered = filtered.map(a => {
              return a.orderId
            })
            fetch(`${HOST_REST_API}order/checking`, {
              method: 'post',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(filtered)
            })
              .then(res => res.json())
              .then(resolve)
              .catch(reject)
          } else {
            resolve([])
          }
        } else {
          resolve([])
        }
      })
    })
  }

  componentWillUnmount() {
    this.pendingPromises.map(p => {
      this.removePendingPromise(p)
    })
  }

  render() {
    const { orders, errorFetch } = this.state
    let estimatedPrice = 0
    return (
      <View style={{ flex: 1 }}>
        <View style={[{ backgroundColor: Color.white }]}>
          <SimpleHeader
            navigation={this.props.navigation}
            title='Pesanan'
          />
        </View>
        {
          orders.length <= 0 ?
            errorFetch === true ?
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>Gagal mendapatkan daftar pesanan</Text>
                <Text style={{ textAlign: 'center', lineHeight: 18, color: Color.textMuted }}>Terjadi kesalahan pada sistem, coba lagi nanti</Text>
                <View style={{ flexDirection: 'row', marginHorizontal: -5, marginTop: 15 }}>
                  <Button style={{ marginHorizontal: 5 }} onPress={this._getCheckOrderStatus} red title='Coba lagi' />
                </View>
              </View>
              :
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Belum ada pesanan</Text>
              </View>
            :
            <ScrollView
              bounces={false}
              scrollEventThrottle={16}>
              {
                orders.map((order, i) => (
                  order.orderType === 'FOOD' ?
                    <OrderHistoryItem last={i === orders.length - 1 ? true : false} onPress={() => this.props.navigation.navigate('Booking', {
                      dataOrder: order
                    })} key={order.orderId} origin={order.origin} destination={order.destination} dateTime={dateFormatted(order.date, true)} type={order.orderType} fare={Currency(order.carts.map(function (a) {
                      return a.foodPrice * a.qty
                    }).reduce(function (a, b) {
                      return a + b
                    }) + order.fare)} status={order.status} />
                    :
                    <OrderHistoryItem last={i === orders.length - 1 ? true : false} onPress={() => this.props.navigation.navigate('Booking', {
                      dataOrder: order
                    })} key={order.orderId} origin={order.origin} destination={order.destination} dateTime={dateFormatted(order.date, true)} type={order.orderType} fare={Currency(order.fare)} status={order.status} />
                ))
              }
            </ScrollView>
        }
      </View>
    )
  }
}