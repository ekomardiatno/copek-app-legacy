import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'

export const addToCart = (food, merchant) => {
  return new Promise((resolve, reject) => {
    let cart = []
    getCart()
      .then(items => {
        if (items.length > 0) {
          if(items[0].merchantId === merchant.merchantId) {
            let index = items.map(c => { return c.foodId }).indexOf(food.foodId)
            if (index > -1) {
              items[index].qty += 1
            } else {
              items.push({
                foodId: food.foodId,
                merchantId: food.merchantId,
                merchantName: merchant.merchantName,
                foodPrice: food.foodPrice - (food.foodDiscount / 100 * food.foodPrice),
                foodRealPrice: food.foodPrice,
                foodDiscount: (food.foodDiscount / 100 * food.foodPrice),
                foodPicture: food.foodPicture,
                foodName: food.foodName,
                foodDetails: food.foodDetails,
                qty: 1,
                note: ''
              })
            }
            cart = items
            AsyncStorage.setItem('cart', JSON.stringify(cart), () => {
              resolve(cart)
            })
          } else {
            Alert.alert(
              'Mau ganti restoran?',
              'Boleh kok, tapi menu yang kamu pilih dari restoran sebelumnya kita hapus ya.',
              [
                {text: 'Tidak jadi', style: 'cancel', onPress: () => {
                  cart = items
                  AsyncStorage.setItem('cart', JSON.stringify(cart), () => {
                    resolve(cart)
                  })
                }},
                {text: 'Oke, ganti', onPress: () => {
                  cart.push({
                    foodId: food.foodId,
                    merchantId: food.merchantId,
                    merchantName: merchant.merchantName,
                    foodPrice: food.foodPrice - (food.foodDiscount / 100 * food.foodPrice),
                    foodRealPrice: food.foodPrice,
                    foodDiscount: (food.foodDiscount / 100 * food.foodPrice),
                    foodPicture: food.foodPicture,
                    foodName: food.foodName,
                    foodDetails: food.foodDetails,
                    qty: 1,
                    note: ''
                  })
                  AsyncStorage.setItem('cart', JSON.stringify(cart), () => {
                    resolve(cart)
                  })
                }}
              ]
            )
          }
        } else {
          cart.push({
            foodId: food.foodId,
            merchantId: food.merchantId,
            merchantName: merchant.merchantName,
            foodPrice: food.foodPrice - (food.foodDiscount / 100 * food.foodPrice),
            foodRealPrice: food.foodPrice,
            foodDiscount: (food.foodDiscount / 100 * food.foodPrice),
            foodPicture: food.foodPicture,
            foodName: food.foodName,
            foodDetails: food.foodDetails,
            qty: 1,
            note: ''
          })
          AsyncStorage.setItem('cart', JSON.stringify(cart), () => {
            resolve(cart)
          })
        }
      })
  })
}

export const getCart = () => {
  return new Promise((resolve, reject) => {
    AsyncStorage.getItem('cart', (error, result) => {
      if (result != null) {
        result = JSON.parse(result)
        resolve(result)
      } else {
        resolve([])
      }
    })
  })
}

export const removeFromCart = (id) => {
  return new Promise((resolve, reject) => {
    let cart = []
    getCart()
      .then(items => {
        if (items.length > 0) {
          let index = items.map(c => { return c.foodId }).indexOf(id)
          if (index > -1) {
            if (items[index].qty > 1) {
              items[index].qty = items[index].qty - 1
            } else {
              items.splice(index, 1)
            }
          }
          cart = items
        }
        AsyncStorage.setItem('cart', JSON.stringify(cart), () => {
          resolve(cart)
        })
      })
  })
}

export const editCart = (id, data) => {
  return new Promise((resolve, reject) => {
    getCart()
      .then(items => {
        let index = items.map(c => {return c.foodId}).indexOf(id)
        items[index] = {
          ...items[index],
          ...data
        }
        AsyncStorage.setItem('cart', JSON.stringify(items), () => {
          resolve(items)
        })
      })
  })
}