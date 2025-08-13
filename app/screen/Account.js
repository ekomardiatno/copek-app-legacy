import { Component } from 'react';
import {
  View,
  Text, ScrollView,
  Linking, TouchableHighlight
} from 'react-native';
import { SimpleHeader, Button } from '../components/Components';
import Color, { colorYiq } from '../components/Color';
import Icon from '@react-native-vector-icons/fontawesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { version } from '../../package.json';

export default class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userLoggedIn: null,
    };
  }

  componentDidMount() {
    AsyncStorage.getItem('user_logged_in', (error, result) => {
      if (!error) {
        if (result !== null) {
          result = JSON.parse(result);
          this.setState({
            userLoggedIn: result,
          });
        }
      }
    });
  }

  _logout = () => {
    AsyncStorage.removeItem('user_logged_in', error => {
      if (!error) {
        this.props.navigation.replace('Login');
      }
    });
  };

  render() {
    const { userLoggedIn } = this.state;
    let sortName = '';
    if (userLoggedIn !== null) {
      let name = userLoggedIn.userName;
      name = name.split(' ');
      for (let i = 0; i < name.length; i++) {
        if (i <= 1) {
          sortName += name[i].substr(0, 1);
        }
      }
    }
    return (
      <View style={{ flex: 1, backgroundColor: Color.white }}>
        <SimpleHeader navigation={this.props.navigation} title="Akun" />
        <ScrollView>
          <View style={{ paddingHorizontal: 15, marginVertical: 15 }}>
            {userLoggedIn === null ? (
              <View style={{ flexDirection: 'row', marginHorizontal: -7.5 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 50 / 2,
                    backgroundColor: Color.grayLighter,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 7.5,
                  }}
                />
                <View style={{ paddingLeft: 10 }}>
                  <View
                    style={{
                      width: 110,
                      height: 20,
                      marginTop: 1,
                      marginBottom: 4 + 6,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  ></View>
                  <View
                    style={{
                      width: 100,
                      height: 14,
                      marginTop: 1,
                      marginBottom: 4 + 6,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  ></View>
                  <View
                    style={{
                      width: 150,
                      height: 14,
                      marginTop: 1,
                      marginBottom: 4,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  ></View>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', marginHorizontal: -7.5 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 50 / 2,
                    backgroundColor: Color.green,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 5,
                    marginHorizontal: 7.5,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: 'bold',
                      letterSpacing: 1,
                      fontSize: 18,
                      color: colorYiq(Color.green),
                    }}
                  >
                    {sortName}
                  </Text>
                </View>
                <View style={{ marginHorizontal: 7.5, flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      fontSize: 20,
                      marginBottom: 3,
                    }}
                  >
                    {userLoggedIn.userName}
                  </Text>
                  <Text style={{ marginBottom: 3 }}>
                    {'+62' + userLoggedIn.userPhone.substr(1)}
                  </Text>
                  <Text>{userLoggedIn.userEmail}</Text>
                </View>
              </View>
            )}
          </View>
          <View style={{ marginBottom: 15 }}>
            <Menu
              items={[
                // {
                //   title: 'Ikuti kami di Instagram',
                //   iconName: 'instagram',
                //   onPress: () => {
                //     Linking.openURL('https://instagram.com/copek_kuansing')
                //   }
                // },
                {
                  title: 'Dapatkan bantuan Admin',
                  iconName: 'question-circle',
                  onPress: () => {
                    Linking.openURL('whatsapp://send?phone=+6287888161111');
                  },
                },
                {
                  title: 'Beri kami nilai',
                  iconName: 'star',
                  onPress: () => {
                    Linking.openURL('market://details?id=com.koma.copek');
                  },
                },
              ]}
            />
          </View>
          <View style={{ paddingHorizontal: 15 }}>
            <Button onPress={this._logout} red title="Keluar" />
          </View>
          <View style={{ padding: 15 }}>
            <Text style={{ textAlign: 'center', color: Color.textMuted }}>
              Versi{' '}
              <Text style={{ fontWeight: 'bold', color: Color.textMuted }}>
                {version}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}

class Menu extends Component {
  render() {
    return (
      <View style={{ marginBottom: 15 }}>
        {this.props.items.map((item, i) => {
          return (
            <TouchableHighlight
              key={i}
              onPress={item.onPress}
              activeOpacity={0.85}
              underlayColor="#fff"
            >
              <View
                style={{
                  flexDirection: 'row',
                  paddingLeft: 15,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{ width: 25, marginRight: 5, alignItems: 'center' }}
                >
                  <Icon
                    iconStyle="solid"
                    size={20}
                    color={Color.grayDark}
                    name={item.iconName}
                  />
                </View>
                <View
                  style={{
                    borderBottomWidth: 1,
                    paddingVertical: 15,
                    borderBottomColor: Color.borderColor,
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 17,
                      marginTop: 2,
                      color: Color.grayDark,
                      letterSpacing: 1,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.title}
                  </Text>
                </View>
              </View>
            </TouchableHighlight>
          );
        })}
      </View>
    );
  }
}
