import { Component } from 'react'
import { View, Text } from 'react-native'
import { SimpleHeader } from '../components/Components'

export default class Inbox extends Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <SimpleHeader style={{ elevation: 5 }} navigation={this.props.navigation} title='Inbox' />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Belum ada pesan masuk!</Text>
          <Text style={{ textAlign: 'center' }}>Selalu cek pesan masuk untuk mendapatkan promo atau informasi terbaru dari kami.</Text>
        </View>
      </View>
    )
  }
}