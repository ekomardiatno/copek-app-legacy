/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import Color, { colorYiq } from '../components/Color';
import { SimpleHeader, Button } from '../components/Components';
import Icon from '@react-native-vector-icons/fontawesome5';
import { HOST_REST_API } from '../components/Define';
import KeyboardSafeView from '../components/KeyboardSafeView';

export default class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      phone: '',
      email: '',
      pass: '',
      repass: '',
      loading: false,
      alertMsg: false,
      alertMsgText: 'Lengkapi semua isian',
    };
  }

  _onRegister = () => {
    this.setState({
      loading: true,
      alertMsg: false,
    });
    const { name, phone, email, pass, repass } = this.state;
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (
      name !== '' &&
      phone !== '' &&
      email !== '' &&
      reg.test(this.state.email) &&
      pass !== '' &&
      pass.length >= 8 &&
      pass === repass
    ) {
      const data = {
        userName: name,
        userPhone: phone,
        userEmail: email,
        userPassword: pass,
      };
      fetch(`${HOST_REST_API}user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(res => res.json())
        .then(res => {
          if (res.status == 'OK') {
            this.setState(
              {
                name: '',
                phone: '',
                email: '',
                pass: '',
                repass: '',
                loading: false,
              },
              () => {
                Alert.alert(
                  'Konfirmasi pendaftaran',
                  'Cek email untuk konfirmasi pendaftaran',
                );
              },
            );
          } else {
            this.setState(
              {
                loading: false,
              },
              () => {
                Alert.alert(
                  'Pendaftaran gagal',
                  'Kemungkinan Nomor HP atau Email telah terdaftar',
                );
              },
            );
          }
        })
        .catch(error => {
          this.setState(
            {
              loading: false,
            },
            () => {
              Alert.alert(
                'Koneksi Gagal',
                'Terjadi kesalahan pada sistem, coba lagi nanti',
              );
            },
          );
        });
    } else if (name === '' || phone === '' || email === '' || pass === '') {
      this.setState({
        loading: false,
        alertMsg: true,
        alertMsgText: 'Lengkapi semua isian',
      });
    } else if (!reg.test(this.state.email)) {
      this.setState({
        loading: false,
        alertMsg: true,
        alertMsgText: 'Alamat email tidak tepat',
      });
    } else if (pass.length < 8) {
      this.setState({
        loading: false,
        alertMsg: true,
        alertMsgText: 'Password kurang dari 6 karakter',
      });
    } else if (pass !== repass) {
      this.setState({
        loading: false,
        alertMsg: true,
        alertMsgText: 'Password tidak sama!',
      });
    } else {
      this.setState({
        loading: false,
        alertMsg: true,
        alertMsgText: 'Periksa kembali data yang anda masukkan',
      });
    }
  };

  render() {
    return (
      <KeyboardSafeView>
        <View style={{ flex: 1 }}>
          <SimpleHeader
            goBack
            navigation={this.props.navigation}
            title="Daftar akun"
          />
          <ScrollView>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                marginBottom: 15,
              }}
            >
              {this.state.alertMsg && (
                <View
                  style={{
                    padding: 10,
                    alignItems: 'center',
                    backgroundColor: Color.red,
                    marginBottom: 15,
                    borderRadius: 10,
                    elevation: 10,
                  }}
                >
                  <Text style={{ color: colorYiq(Color.red) }}>
                    {this.state.alertMsgText}
                  </Text>
                </View>
              )}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>Nama Lengkap</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: Color.borderColor,
                  }}
                >
                  <TextInput
                    placeholderTextColor={Color.gray}
                    value={this.state.name}
                    onChangeText={text => this.setState({ name: text })}
                    placeholder="Eko Mardiatno"
                    autoCapitalize="words"
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      color: Color.black,
                      letterSpacing: 1,
                    }}
                  />
                  <View
                    style={{
                      width: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      iconStyle="solid"
                      color={Color.gray}
                      name="user-alt"
                      size={20}
                    />
                  </View>
                </View>
              </View>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>No. Handphone</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: Color.borderColor,
                  }}
                >
                  <View style={{ justifyContent: 'center', paddingRight: 8 }}>
                    <Text style={{ color: Color.gray, fontWeight: 'bold' }}>
                      +62
                    </Text>
                  </View>
                  <TextInput
                    placeholderTextColor={Color.gray}
                    value={this.state.phone}
                    onChangeText={text => this.setState({ phone: text })}
                    placeholder="81234567890"
                    keyboardType="number-pad"
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      color: Color.black,
                      letterSpacing: 1,
                    }}
                  />
                  <View
                    style={{
                      width: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      iconStyle="solid"
                      color={Color.gray}
                      name="mobile-alt"
                      size={20}
                    />
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: Color.textMuted,
                    paddingTop: 4,
                    fontWeight: '300',
                  }}
                >
                  Pastikan nomor terdaftar di WhatsApp
                </Text>
              </View>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>Alamat Email</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: Color.borderColor,
                  }}
                >
                  <TextInput
                    placeholderTextColor={Color.gray}
                    value={this.state.email}
                    onChangeText={text => this.setState({ email: text })}
                    placeholder="ekomardiatno@domain.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      color: Color.black,
                      letterSpacing: 1,
                    }}
                  />
                  <View
                    style={{
                      width: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      iconStyle="solid"
                      color={Color.gray}
                      name="at"
                      size={20}
                    />
                  </View>
                </View>
              </View>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>Kata Sandi</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: Color.borderColor,
                  }}
                >
                  <TextInput
                    placeholderTextColor={Color.gray}
                    autoCapitalize="none"
                    value={this.state.pass}
                    onChangeText={text => this.setState({ pass: text })}
                    placeholder="••••••••"
                    secureTextEntry={true}
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      color: Color.black,
                      letterSpacing: 5,
                    }}
                  />
                  <View
                    style={{
                      width: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      iconStyle="solid"
                      color={Color.gray}
                      name="key"
                      size={20}
                    />
                  </View>
                </View>
              </View>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>Ulangi Kata Sandi</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: Color.borderColor,
                  }}
                >
                  <TextInput
                    placeholderTextColor={Color.gray}
                    autoCapitalize="none"
                    value={this.state.repass}
                    onChangeText={text => this.setState({ repass: text })}
                    placeholder="••••••••"
                    secureTextEntry={true}
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      color: Color.black,
                      letterSpacing: 5,
                    }}
                  />
                  <View
                    style={{
                      width: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      iconStyle="solid"
                      color={Color.gray}
                      name="key"
                      size={20}
                    />
                  </View>
                </View>
              </View>
              {this.state.loading ? (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Color.blue,
                    height: 40,
                    elevation: 3,
                    borderRadius: 3,
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color={colorYiq(Color.blue)}
                  />
                </View>
              ) : (
                <Button blue onPress={this._onRegister} title="Daftar" />
              )}
              <View style={{ paddingHorizontal: 30, marginVertical: 15 }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() =>
                    Linking.openURL('whatsapp://send?phone=+6287888161111')
                  }
                >
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{ fontSize: 13, textAlign: 'center' }}>
                      Punya masalah saat mendaftar?{' '}
                      <Text style={{ fontSize: 13, fontWeight: 'bold' }}>
                        Dapatkan bantuan Admin.
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: Color.green,
              alignItems: 'center',
              elevation: 10,
              backgroundColor: Color.green,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => this.props.navigation.goBack()}
            >
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 13, color: colorYiq(Color.green) }}>
                  Sudah punya akun?{' '}
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: colorYiq(Color.green),
                  }}
                >
                  Masuk.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardSafeView>
    );
  }
}
