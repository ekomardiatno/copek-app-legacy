import { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity
} from 'react-native';
import Color, { colorYiq } from '../components/Color';
import { SimpleHeader, Button } from '../components/Components';
import Icon from '@react-native-vector-icons/fontawesome5';
import cancellablePromise from '../helpers/cancellablePromise';
import { HOST_REST_API } from '../components/Define';
import KeyboardSafeView from '../components/KeyboardSafeView';

export default class ForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      loading: false,
    };
  }

  pendingPromises = [];
  appendPendingPromise = promise =>
    (this.pendingPromises = [...this.pendingPromises, promise]);
  removePendingPromise = promise =>
    (this.pendingPromises = this.pendingPromises.filter(p => p !== promise));

  componentWillUnmount() {
    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
  }

  _reset = () => {
    this.setState(
      {
        loading: true,
      },
      () => {
        const wrappedPromise = cancellablePromise(this._promiseReset());
        this.appendPendingPromise(wrappedPromise);
        wrappedPromise.promise
          .then(res => {
            if (res.status === 'EMPTY') {
              Alert.alert(
                'Gagal',
                'Email tidak terdaftar atau belum dikonfirmasi',
              );
            } else if (res.status === 'OK') {
              Alert.alert(
                'Terkirim!',
                'Kami telah mengirim link ke Email Anda untuk me-reset password',
              );
            } else {
              Alert.alert('Gagal', 'Ada kesalahan yang tidak diketahui');
            }
          })
          .then(() => {
            this.removePendingPromise(wrappedPromise);
            this.setState({
              loading: false,
            });
          })
          .catch(err => {
            Alert.alert(
              'Koneksi gagal',
              'Terjadi kesalahan pada sistem, pastikan Anda telah menggunakan aplikasi terbaru dan coba lagi nanti',
            );
          });
      },
    );
  };

  _promiseReset = () => {
    return new Promise((resolve, reject) => {
      fetch(`${HOST_REST_API}reset-password/user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetPasswordEmail: this.state.email,
        }),
      })
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
    });
  };

  render() {
    return (
      <KeyboardSafeView>
        <View style={{ flex: 1 }}>
          <SimpleHeader
            goBack
            navigation={this.props.navigation}
            title="Reset Password"
          />
          <ScrollView>
            <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
              <View
                style={{
                  paddingHorizontal: 30,
                  alignItems: 'center',
                  marginBottom: 30,
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}
                >
                  Lupa Password
                </Text>
                <Text style={{ color: Color.textMuted, textAlign: 'center' }}>
                  Silakan masukan alamat email anda untuk me-reset kata sandi.
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
                    value={this.state.value}
                    onChangeText={email => this.setState({ email })}
                    placeholder="ekomardiatno@domain.com"
                    placeholderTextColor={Color.gray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      letterSpacing: 1,
                      color: Color.black,
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
              {this.state.loading ? (
                <View
                  style={{
                    backgroundColor: Color.blue,
                    elevation: 3,
                    borderRadius: 3,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 40,
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color={colorYiq(Color.blue)}
                  />
                </View>
              ) : (
                <Button onPress={this._reset} blue title="Reset Password" />
              )}
              <View style={{ paddingHorizontal: 30, marginVertical: 15 }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() =>
                    Linking.openURL('whatsapp://send?phone=+62859106975774')
                  }
                >
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{ fontSize: 13, textAlign: 'center' }}>
                      Punya masalah lain saat ingin masuk?{' '}
                      <Text style={{ fontSize: 13, fontWeight: 'bold' }}>
                        Dapatkan bantuan Admin.
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardSafeView>
    );
  }
}
