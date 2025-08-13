import { Component } from 'react'
import { View, Text } from 'react-native'
import { SimpleHeader } from '../components/Components'
import Color from '../components/Color'

class Soon extends Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <SimpleHeader goBack navigation={this.props.navigation} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>Belum tersedia</Text>
          <Text style={{ textAlign: 'center', lineHeight: 18, color: Color.textMuted }}>Maaf ya, fiturnya belum tersedia.</Text>
        </View>
      </View>
    )
  }
}

export default Soon