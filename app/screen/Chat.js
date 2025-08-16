/* eslint-disable react-native/no-inline-styles */
import { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  Linking,
  Alert,
  TouchableHighlight,
} from 'react-native';
import Fa from '@react-native-vector-icons/fontawesome5';
import Color, { colorYiq } from '../components/Color';
import phoneNumFormat from '../helpers/phoneNumFormat';
import dateFormatted from '../helpers/dateFormatted';
import { HOST_REST_API } from '../components/Define';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getImageThumb from '../helpers/getImageThumb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chats: [],
      chatText: '',
      driver: null,
      orderId: null,
      status: '',
    };
  }

  _getChats = () => {
    const { orderId } = this.state;
    if (orderId !== null) {
      AsyncStorage.getItem('token').then(v => {
        fetch(`${HOST_REST_API}chat/history/${orderId}`, {
          headers: {
            Authorization: `Bearer ${v}`,
          },
        })
          .then(res => res.json())
          .then(chat => {
            if (chat.status === 'OK' && chat.data.length > 0) {
              chat = chat.data;
              this.setState(
                {
                  chats: chat,
                },
                () => {
                  AsyncStorage.getItem('chats', (_err, res) => {
                    if (res !== null) {
                      res = JSON.parse(res);
                      let chatArray = [];
                      res.map(a => {
                        a.orderId !== orderId && chatArray.push(a);
                      });
                      AsyncStorage.setItem(
                        'chats',
                        JSON.stringify(chatArray.concat(chat)),
                      );
                    } else {
                      AsyncStorage.setItem('chats', JSON.stringify([chat]));
                    }
                  });
                },
              );
            }
          })
          .catch(_err => {
            Alert.alert(
              'Gagal mendapatkan obrolan',
              'Terjadi kesalahan pada sistem, coba lagi nanti',
              [
                {
                  text: 'Coba lagi',
                  onPress: this._getChats,
                },
              ],
              { cancelable: true },
            );
          });
      });
    }
  };

  _handleReceiveChat = chat => {
    this.setState(
      {
        chats: [
          ...this.state.chats,
          {
            ...chat,
          },
        ],
      },
      () => {
        this._saveOnStorage({
          orderId: chat.orderId,
          sender: chat.sender,
          text: chat.text,
          dateTime: chat.dateTime,
        });
      },
    );
  };

  componentDidMount() {
    const { socket } = this.context;

    if (socket?.connected) {
      this._getChats();
    }
    AsyncStorage.getItem('user_logged_in').then(v => {
      if (v) {
        const user = JSON.parse(v);
        socket?.on(`${user.userId}_receive_chat`, this._handleReceiveChat);
      }
    });

    if (this.props.route.params?.data) {
      const { chats, driver, orderId, status } = this.props.route.params?.data;
      this.setState({
        chats,
        driver,
        orderId,
        status,
      });
    }
  }

  componentWillUnmount() {
    if (this.props.route.params?.data) {
      this.props.route.params?.data.noNewChat();
      this.props.route.params?.data.pushChat(this.state.chats);
    }

    if (this.props.route.params?.actionBack) {
      this.props.route.params?.actionBack();
    }

    const { socket } = this.context;
    AsyncStorage.getItem('user_logged_in').then(v => {
      if (v) {
        const user = JSON.parse(v);
        socket?.on(`${user.userId}_receive_chat`, this._handleReceiveChat);
      }
    });
  }

  _onSendChat = () => {
    const { socket } = this.context;
    const { chatText, driver, orderId } = this.state;
    if (chatText.length > 0) {
      AsyncStorage.getItem('token').then(v => {
        fetch(`${HOST_REST_API}chat/post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${v}`,
          },
          body: JSON.stringify({
            orderId: orderId,
            sender: 'customer',
            text: chatText,
          }),
        })
          .then(res => res.json())
          .then(chat => {
            if (chat.status === 'OK') {
              chat = chat.data;
              this.setState(
                {
                  chats: [
                    ...this.state.chats,
                    {
                      orderId: chat.orderId,
                      sender: chat.sender,
                      text: chat.text,
                      dateTime: chat.dateTime,
                    },
                  ],
                  chatText: '',
                },
                () => {
                  this._saveOnStorage({
                    orderId: chat.orderId,
                    sender: chat.sender,
                    text: chat.text,
                    dateTime: chat.dateTime,
                  });
                  socket?.emit('send_chat', {
                    receiverId: driver.driverId,
                    data: {
                      orderId: chat.orderId,
                      sender: chat.sender,
                      text: chat.text,
                      dateTime: chat.dateTime,
                    },
                  });
                },
              );
            }
          });
      });
    }
  };

  _saveOnStorage = data => {
    AsyncStorage.getItem('chats', (_error, chat) => {
      if (chat !== null) {
        const newChat = JSON.parse(chat);
        const filterChat = newChat.filter(
          c => c.orderId === data.orderId && c.dateTime === data.dateTime,
        );
        AsyncStorage.setItem('chats', JSON.stringify([...filterChat, data]));
      } else {
        AsyncStorage.setItem('chats', JSON.stringify([data]));
      }
    });
  };

  render() {
    let { chats, driver } = this.state;
    return (
      <View style={{ flex: 1, paddingBottom: this.props.insets.bottom }}>
        <View
          style={{
            backgroundColor: Color.primary,
            elevation: 5,
            paddingTop: this.props.insets.top,
          }}
        >
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ padding: 10, paddingLeft: 15 }}>
                <TouchableHighlight
                  style={{ borderRadius: 35 / 2 }}
                  activeOpacity={0.85}
                  underlayColor="#fff"
                  onPress={() => {
                    this.props.navigation.goBack();
                    if (this.props.route.params?.actionBack) {
                      this.props.route.params?.actionBack();
                    }
                  }}
                >
                  <View
                    style={{
                      width: 35,
                      height: 35,
                      borderRadius: 35 / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <Fa
                      iconStyle="solid"
                      color={Color.white}
                      size={20}
                      name="chevron-left"
                    />
                  </View>
                </TouchableHighlight>
              </View>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                    backgroundColor: Color.grayLighter,
                  }}
                >
                  {driver !== null ? (
                    <Image
                      style={{ width: 42, height: 42, borderRadius: 42 / 2 }}
                      source={{
                        uri: getImageThumb(driver.driverPicture, 'sm'),
                      }}
                    />
                  ) : null}
                </View>
                <View style={{ paddingHorizontal: 10 }}>
                  {driver !== null ? (
                    <View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 17,
                          marginBottom: 3,
                          color: Color.white,
                        }}
                      >
                        {driver.driverName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          color: Color.white,
                          letterSpacing: 1,
                        }}
                      >
                        {driver.driverVRP}
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View
                        style={{
                          height: 17,
                          width: 120,
                          backgroundColor: Color.textColor,
                          marginBottom: 2,
                        }}
                      />
                      <View
                        style={{
                          height: 12,
                          width: 80,
                          backgroundColor: Color.textColor,
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
              <View
                style={{ flexDirection: 'row', padding: 5, paddingRight: 15 }}
              >
                <View style={{ marginHorizontal: 2.5 }}>
                  <TouchableHighlight
                    style={{ borderRadius: 35 / 2 }}
                    activeOpacity={0.85}
                    underlayColor="#fff"
                    onPress={() =>
                      Linking.openURL(`tel://${driver.driverPhone}`)
                    }
                  >
                    <View
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 35 / 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Color.white,
                        overflow: 'hidden',
                      }}
                    >
                      <Fa
                        iconStyle="solid"
                        color={Color.primary}
                        size={16}
                        name="phone"
                      />
                    </View>
                  </TouchableHighlight>
                </View>
                <View style={{ marginHorizontal: 2.5 }}>
                  <TouchableHighlight
                    style={{ borderRadius: 35 / 2 }}
                    activeOpacity={0.85}
                    underlayColor="#fff"
                    onPress={() =>
                      Linking.openURL(
                        `whatsapp://send?phone=${phoneNumFormat(
                          driver.driverPhone,
                        )}`,
                      )
                    }
                  >
                    <View
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 35 / 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Color.white,
                        overflow: 'hidden',
                      }}
                    >
                      <Fa
                        iconStyle="brand"
                        color={Color.primary}
                        size={16}
                        name="whatsapp"
                      />
                    </View>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: Color.grayLighter }}>
          {chats.length <= 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 30,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: Color.textMuted,
                }}
              >
                Layanan chat (beta)
              </Text>
              <Text style={{ textAlign: 'center', color: Color.textMuted }}>
                Layanan chat belum sempurna, disarankan menelepon langsung ke
                nomor HP driver atau menggunakan Whatsapp
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={ref => (this._scrollView = ref)}
              onContentSizeChange={(_contentWidth, _contentHeight) => {
                this._scrollView.scrollToEnd({ animated: true });
              }}
            >
              {chats.map((chat, i) => {
                if (chat.sender === 'driver') {
                  return (
                    <View key={i}>
                      <View
                        style={{
                          paddingHorizontal: 15,
                          paddingVertical: 5,
                          paddingRight: 50,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            marginTop: i === 0 ? 10 : 0,
                            marginBottom:
                              chats[i + 1] === undefined
                                ? i === chats.length - 1
                                  ? 10
                                  : 0
                                : chat.sender !== chats[i + 1].sender
                                ? 10
                                : 0,
                          }}
                        >
                          <View
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: Color.grayLight,
                              borderRadius: 15,
                              elevation: 1,
                            }}
                          >
                            <Text style={{ lineHeight: 16 }}>{chat.text}</Text>
                          </View>
                        </View>
                      </View>
                      {chats[i + 1] === undefined ? (
                        <Text
                          style={{
                            textAlign: 'left',
                            marginLeft: 20,
                            fontSize: 10,
                            color: Color.textMuted,
                          }}
                        >
                          {dateFormatted(chat.dateTime, true, true)}
                        </Text>
                      ) : (
                        dateFormatted(chats[i].dateTime, true, true) !==
                          dateFormatted(chats[i + 1].dateTime, true, true) ||
                        (chats[i].sender !== chats[i + 1].sender && (
                          <Text
                            style={{
                              textAlign: 'left',
                              marginLeft: 20,
                              fontSize: 10,
                              color: Color.textMuted,
                            }}
                          >
                            {dateFormatted(chat.dateTime, true, true)}
                          </Text>
                        ))
                      )}
                    </View>
                  );
                } else {
                  return (
                    <View key={i}>
                      <View
                        key={i}
                        style={{
                          paddingHorizontal: 15,
                          paddingVertical: 5,
                          paddingLeft: 50,
                          alignItems: 'flex-end',
                          marginTop: i === 0 ? 10 : 0,
                          marginBottom:
                            chats[i + 1] === undefined
                              ? i === chats.length - 1
                                ? 10
                                : 0
                              : chat.sender !== chats[i + 1].sender
                              ? 10
                              : 0,
                        }}
                      >
                        <View style={{ flexDirection: 'row' }}>
                          <View
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: Color.primary,
                              borderRadius: 15,
                              elevation: 1,
                            }}
                          >
                            <Text
                              style={{
                                lineHeight: 16,
                                color: Color.white,
                              }}
                            >
                              {chat.text}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {chats[i + 1] === undefined ? (
                        <Text
                          style={{
                            textAlign: 'right',
                            marginRight: 20,
                            fontSize: 10,
                            color: Color.white,
                          }}
                        >
                          {dateFormatted(chat.dateTime, true, true)}
                        </Text>
                      ) : (
                        dateFormatted(chats[i].dateTime, true, true) !==
                          dateFormatted(chats[i + 1].dateTime, true, true) ||
                        (chats[i].sender !== chats[i + 1].sender && (
                          <Text
                            style={{
                              textAlign: 'right',
                              marginRight: 20,
                              fontSize: 10,
                              color: Color.textMuted,
                            }}
                          >
                            {dateFormatted(chat.dateTime, true, true)}
                          </Text>
                        ))
                      )}
                    </View>
                  );
                }
              })}
            </ScrollView>
          )}
        </View>
        <View style={{ backgroundColor: Color.grayLighter }}>
          <View>
            <View
              style={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'flex-end',
              }}
            >
              {this.state.status === 'completed' ||
              this.state.status === 'cancelled_by_driver' ||
              this.state.status === 'cancelled_by_user' ? (
                <View
                  style={{
                    backgroundColor: Color.grayLight,
                    height: 45,
                    flex: 1,
                    borderRadius: 45 / 2,
                    elevation: 1,
                    paddingHorizontal: 15,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: Color.textMuted, fontSize: 14 }}>
                    Sesi obrolan berakhir
                  </Text>
                </View>
              ) : (
                <TextInput
                  multiline
                  value={this.state.chatText}
                  onChangeText={chatText => this.setState({ chatText })}
                  style={{
                    flex: 1,
                    color: Color.textColor,
                    fontFamily: 'Yantramanav',
                    fontSize: 14,
                    backgroundColor: Color.white,
                    paddingVertical: 6,
                    paddingHorizontal: 15,
                    minHeight: 45,
                    maxHeight: 90,
                    borderRadius: 45 / 2,
                    elevation: 1,
                  }}
                  placeholder="Masukkan pesan"
                />
              )}
              {this.state.status === 'completed' ||
              this.state.status === 'cancelled_by_driver' ||
              this.state.status === 'cancelled_by_user' ? (
                <View
                  style={{
                    width: 45,
                    height: 45,
                    marginLeft: 10,
                    borderRadius: 45 / 2,
                    backgroundColor: Color.gray,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    size={18}
                    color={colorYiq(Color.gray)}
                    name="paper-plane"
                  />
                </View>
              ) : (
                <TouchableHighlight
                  style={{ borderRadius: 45 / 2 }}
                  activeOpacity={0.85}
                  underlayColor="#fff"
                  onPress={this._onSendChat}
                >
                  <View
                    style={{
                      width: 45,
                      height: 45,
                      marginLeft: 10,
                      borderRadius: 45 / 2,
                      backgroundColor: Color.secondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Fa
                      iconStyle="solid"
                      size={18}
                      color={Color.white}
                      name="paper-plane"
                    />
                  </View>
                </TouchableHighlight>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default withSafeAreaInsets(Chat);
