/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TouchableHighlight
} from 'react-native';
import { Button } from '../components/Components';
import Color, { colorYiq } from '../components/Color';
import Icon from '@react-native-vector-icons/fontawesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOST_REST_API } from '../components/Define';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: '',
      password: '',
      errorPhoneNumber: false,
      errorPassword: false,
      errorOtp: false,
      errorPhoneNumberMessage: 'Wajib memasukkan nomor handphone',
      errorPasswordMessage: 'Wajib memasukkan password',
      errorOtpMessage: 'Wajib memasukkan OTP',
      render: false,
      alertMsg: false,
      alertMsgText: 'Kombinasi nomor handphone dan password tidak ditemukan',
      isSigningIn: false,
      isSecurePass: true,
      insertingOtp: false,
      otp: '',
      isVerifying: false,
      user: null,
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
    AsyncStorage.getItem('user_logged_in', (error, result) => {
      if (!error) {
        if (result === null) {
          this.setState({
            render: true,
          });
        } else {
          this.props.navigation.replace('Main');
        }
      }
    });
  }

  componentWillUnmount() {
    this.pendingPromises.map(p => {
      this.removePendingPromise(p);
    });
  }

  _login = async () => {
    const { phoneNumber, password } = this.state;
    phoneNumber === '' && this.setState({ errorPhoneNumber: true });
    password === '' && this.setState({ errorPassword: true });

    if (phoneNumber !== '' && password !== '') {
      this.setState({
        isSigningIn: true,
      });
      const data = {
        userPhone: phoneNumber,
        userPassword: password,
      };
      try {
        const result = await fetch(`${HOST_REST_API}user/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!result.ok) {
          throw new Error('Failed to login');
        }
        const json = await result.json();
        if (json.status === 'OK') {
          const user = json.data;
          AsyncStorage.setItem('token', json.token);
          this.setState({
            isSigningIn: false,
            insertingOtp: true,
            user,
          });
        } else if (json.status === 'UNCONFIRMED') {
          this.setState({
            alertMsgText: 'Maaf akun Anda belum dikonfirmasi',
            alertMsg: true,
          });
        } else if (json.status === 'UNABLE_TO_GET_OTP') {
          Alert.alert(
            'Gagal masuk',
            'Terjadi kesalahan pada sistem, coba lagi nanti',
            [
              {
                text: 'Coba lagi',
                onPress: this._login,
              },
              {
                text: 'Batal',
                onPress: () => {
                  this.setState({
                    password: '',
                    phoneNumber: '',
                    isSigningIn: false,
                  });
                },
              },
            ],
            { cancelable: false },
          );
        } else {
          this.setState({
            alertMsgText: 'Nomor HP atau password tidak tepat',
            alertMsg: true,
          });
        }
      } catch (e) {
        console.log(e);
        Alert.alert(
          'Gagal masuk',
          'Terjadi kesalahan pada sistem, coba lagi nanti',
          [
            {
              text: 'Coba lagi',
              onPress: this._login,
            },
            {
              text: 'Batal',
              onPress: () => {
                this.setState({
                  password: '',
                  phoneNumber: '',
                  isSigningIn: false,
                });
              },
            },
          ],
          { cancelable: false },
        );
      } finally {
        this.setState({
          isSigningIn: false,
        });
      }
    }
  };

  _passwordChangeText = password => {
    this.setState({
      password,
      errorPassword: false,
      alertMsg: false,
    });
  };

  _phoneNumberChangeText = phoneNumber => {
    this.setState({
      phoneNumber,
      errorPhoneNumber: false,
      alertMsg: false,
    });
  };

  _otpChangeText = otp => {
    this.setState({
      otp,
      errorOtp: false,
      alertMsg: false,
    });
  };

  _onVerify = async () => {
    const { otp, phoneNumber } = this.state;
    if (!otp) {
      this.setState({ errorOtp: true });
    }
    this.setState({
      isVerifying: true,
    });
    const data = {
      userPhone: phoneNumber,
      otp: otp,
    };
    try {
      const result = await fetch(`${HOST_REST_API}user/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!result.ok) {
        throw new Error('Failed to verify OTP');
      }
      const json = await result.json();
      if (json.status === 'OK') {
        const user = this.state.user;
        AsyncStorage.setItem(
          'user_logged_in',
          JSON.stringify({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            userPhone: user.userPhone,
          }),
          error => {
            if (!error) {
              this.props.navigation.navigate('Main');
            }
          },
        );
      } else {
        this.setState({
          alertMsgText: 'OTP tidak tepat',
          alertMsg: true,
        });
      }
    } catch (e) {
      console.log(e);
      Alert.alert(
        'OTP gagal',
        'Terjadi kesalahan pada sistem, coba lagi nanti',
        [
          {
            text: 'Coba lagi',
            onPress: this._onVerify,
          },
          {
            text: 'Batal',
            onPress: () => {
              this.setState({
                otp: '',
                isVerifying: false,
              });
            },
          },
        ],
        { cancelable: false },
      );
    } finally {
      this.setState({
        isVerifying: false,
        insertingOtp: false,
        otp: '',
        phoneNumber: '',
        password: '',
      });
    }
  };

  render() {
    const {
      phoneNumber,
      password,
      errorPhoneNumber,
      errorPassword,
      errorPhoneNumberMessage,
      errorPasswordMessage,
      render,
      alertMsg,
      alertMsgText,
      isSigningIn,
      otp,
      insertingOtp,
      isVerifying,
      errorOtp,
      errorOtpMessage,
    } = this.state;
    return render ? (
      <View style={{ paddingTop: StatusBar.currentHeight, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <ScrollView>
            <View
              style={{
                paddingHorizontal: 30,
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Image
                style={{
                  width: 150,
                  height: 150,
                  marginBottom: 20,
                  marginTop: 20,
                }}
                source={require('../images/copek.png')}
              />
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}
              >
                Selamat datang!
              </Text>
              <Text
                style={{
                  color: Color.textMuted,
                  textAlign: 'center',
                  paddingHorizontal: 20,
                }}
              >
                Silakan masukan nomor handphone dan password anda
              </Text>
            </View>
            {alertMsg && (
              <View
                style={{
                  borderRadius: 10,
                  marginHorizontal: 40,
                  marginBottom: 15,
                }}
              >
                <Text style={{ textAlign: 'center', color: Color.red }}>
                  {alertMsgText}
                </Text>
              </View>
            )}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>No. Handphone</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: errorPhoneNumber
                      ? Color.red
                      : Color.borderColor,
                  }}
                >
                  <View style={{ justifyContent: 'center', paddingRight: 8 }}>
                    <Text style={{ color: Color.gray, fontWeight: 'bold' }}>
                      +62
                    </Text>
                  </View>
                  <TextInput
                    value={phoneNumber}
                    readOnly={insertingOtp}
                    onChangeText={this._phoneNumberChangeText}
                    placeholderTextColor={Color.gray}
                    placeholder="81234567890"
                    keyboardType="number-pad"
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
                      color={errorPhoneNumber ? Color.red : Color.gray}
                      iconStyle="solid"
                      name="mobile-alt"
                      size={20}
                    />
                  </View>
                </View>
                {errorPhoneNumber && (
                  <Text
                    style={{ fontSize: 11, marginTop: 4, color: Color.red }}
                  >
                    {errorPhoneNumberMessage}
                  </Text>
                )}
              </View>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13 }}>Kata Sandi</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: errorPassword
                      ? Color.red
                      : Color.borderColor,
                  }}
                >
                  <TextInput
                    value={password}
                    readOnly={insertingOtp}
                    onChangeText={this._passwordChangeText}
                    autoCapitalize="none"
                    placeholder="••••••••"
                    placeholderTextColor={Color.gray}
                    secureTextEntry={this.state.isSecurePass}
                    style={{
                      paddingHorizontal: 0,
                      paddingVertical: 6,
                      flex: 1,
                      fontFamily: 'Yantramanav',
                      letterSpacing: 5,
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
                      color={errorPassword ? Color.red : Color.gray}
                      iconStyle="solid"
                      name="lock"
                      size={18}
                    />
                  </View>
                  <TouchableHighlight
                    activeOpacity={0.85}
                    underlayColor="#fff"
                    onPress={() => {
                      this.setState({
                        isSecurePass: this.state.isSecurePass ? false : true,
                      });
                    }}
                  >
                    <View style={{ paddingVertical: 5 }}>
                      <View
                        style={{
                          width: 40,
                          borderLeftWidth: 1,
                          flex: 1,
                          borderLeftColor: Color.borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon
                          color={
                            this.state.isSecurePass ? Color.gray : Color.black
                          }
                          name={this.state.isSecurePass ? 'eye-slash' : 'eye'}
                          size={15}
                        />
                      </View>
                    </View>
                  </TouchableHighlight>
                </View>
                {errorPassword && (
                  <Text
                    style={{ fontSize: 11, marginTop: 4, color: Color.red }}
                  >
                    {errorPasswordMessage}
                  </Text>
                )}
              </View>
              {this.state.insertingOtp && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 13 }}>OTP</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      borderBottomWidth: 1,
                      borderBottomColor: errorPassword
                        ? Color.red
                        : Color.borderColor,
                    }}
                  >
                    <TextInput
                      value={otp}
                      maxLength={6}
                      onChangeText={this._otpChangeText}
                      autoCapitalize="none"
                      placeholder="••••••"
                      placeholderTextColor={Color.gray}
                      style={{
                        paddingHorizontal: 0,
                        paddingVertical: 6,
                        flex: 1,
                        fontFamily: 'Yantramanav',
                        letterSpacing: 5,
                        color: Color.black,
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  {errorOtp && (
                    <Text
                      style={{ fontSize: 11, marginTop: 4, color: Color.red }}
                    >
                      {errorOtpMessage}
                    </Text>
                  )}
                </View>
              )}
              {insertingOtp ? (
                <>
                  {isVerifying ? (
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 3,
                        paddingHorizontal: 15,
                        height: 40,
                        backgroundColor: Color.blue,
                        elevation: 3,
                      }}
                    >
                      <ActivityIndicator
                        size={19}
                        color={colorYiq(Color.blue)}
                      />
                    </View>
                  ) : (
                    <Button
                      onPress={this._onVerify}
                      title="Verifikasi OTP"
                      blue
                    />
                  )}
                </>
              ) : !isSigningIn ? (
                <Button onPress={this._login} blue title="Masuk" />
              ) : (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    paddingHorizontal: 15,
                    height: 40,
                    backgroundColor: Color.blue,
                    elevation: 3,
                  }}
                >
                  <ActivityIndicator size={19} color={colorYiq(Color.blue)} />
                </View>
              )}
              <View style={{ paddingHorizontal: 30, marginTop: 10 }}>
                <TouchableOpacity
                  activeOpacity={1}
                  disabled={isSigningIn || isVerifying}
                  onPress={() => {
                    if (insertingOtp) {
                      this.setState({
                        insertingOtp: false,
                        otp: '',
                      });
                      return;
                    }
                    this.props.navigation.navigate('Forgot');
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'center' }}
                  >
                    {insertingOtp ? (
                      <Text
                        style={{
                          fontSize: 13,
                          textAlign: 'center',
                        }}
                      >
                        Masukkan ulang No. HP dan Kata Sandi
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 13, textAlign: 'center' }}>
                        Lupa detail informasi masuk?{' '}
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>
                          Dapatkan bantuan masuk.
                        </Text>
                      </Text>
                    )}
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
              disabled={isSigningIn || isVerifying}
              onPress={() => this.props.navigation.navigate('Register')}
            >
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 13, color: colorYiq(Color.green) }}>
                  Tidak punya akun?{' '}
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: colorYiq(Color.green),
                  }}
                >
                  Buat akun.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ) : null;
  }
}
