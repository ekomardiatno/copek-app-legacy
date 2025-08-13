/* eslint-disable react-native/no-inline-styles */
/* =================================
 * Components by Eko Mardiatno
 * Instagram @komafx
 * ekomardiatno@gmail.com
 * ================================= */

import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image, TouchableOpacity,
  StatusBar,
  Dimensions,
  Keyboard,
  Linking,
  TouchableHighlight,
  Platform,
  TextInput,
  SafeAreaView
} from 'react-native';
import Color, { colorYiq } from './Color';
import Feather from '@react-native-vector-icons/feather';
import Fa from '@react-native-vector-icons/fontawesome5';
import Ion from '@react-native-vector-icons/ionicons';
import Currency from '../helpers/Currency';
import DistanceFormat from '../helpers/DistanceFormat';
import LinearGradient from 'react-native-linear-gradient';
import getImageThumb from '../helpers/getImageThumb';
import Dash from 'react-native-dash-2';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');

export class Input extends Component {
  render() {
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Color.grayLighter,
          borderRadius: 10,
          paddingHorizontal: 15,
          ...this.props.style,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: this.props.icon ? 15 : 0,
          }}
        >
          {this.props.feather && (
            <Feather name={this.props.icon} color={Color.textMuted} size={16} />
          )}
          {this.props.fa && (
            <Fa
              iconStyle="solid"
              name={this.props.icon}
              color={Color.textMuted}
              size={16}
            />
          )}
        </View>
        <TextInput
          autoFocus={this.props.autoFocus}
          maxLength={this.props.maxLength}
          keyboardType={this.props.keyboardType}
          returnKeyType={this.props.returnKeyType}
          multiline={this.props.multiline}
          onBlur={this.props.onBlur}
          onChange={this.props.onChange}
          value={this.props.value}
          onChangeText={this.props.onChangeText}
          onEndEditing={this.props.onEndEditing}
          onSubmitEditing={this.props.onSubmitEditing}
          onFocus={this.props.onFocus}
          onKeyPress={this.props.onKeyPress}
          placeholder={this.props.placeholder}
          placeholderTextColor={Color.gray}
          style={{
            color: Color.black,
            fontFamily: 'Yantramanav',
            flex: 1,
            height: 40,
            padding: 0,
            ...this.props.styleTextInput,
          }}
        />
      </View>
    );
  }
}

export class Button extends Component {
  render() {
    let backgroundColor = Color.primary,
      textColor = Color.white,
      borderColor = Color.primary,
      borderWidth = 0,
      elevation = 3,
      shadow = {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      };
    if (this.props.secondary) {
      backgroundColor = Color.grayLighter;
      textColor = Color.white;
      borderColor = Color.grayLighter;
    } else if (this.props.tertiary) {
      backgroundColor = Color.white;
      textColor = Color.black;
      borderColor = 'transparent';
      elevation = 0;
      shadow = {};
    } else if (this.props.blue) {
      backgroundColor = Color.blue;
      textColor = Color.white;
      borderColor = Color.blue;
    } else if (this.props.red) {
      backgroundColor = Color.red;
      textColor = Color.white;
      borderColor = Color.red;
    } else if (this.props.green) {
      backgroundColor = Color.green;
      textColor = Color.white;
      borderColor = Color.green;
    }

    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        underlayColor="rgba(0,0,0,1)"
        style={{
          ...shadow,
        }}
      >
        <View
          style={{
            backgroundColor: backgroundColor,
            borderWidth: borderWidth,
            borderColor: borderColor,
            borderRadius: 5,
            paddingVertical: this.props.small ? 3.6 : 6,
            paddingHorizontal: this.props.small ? 7.2 : 12,
            minHeight: this.props.small ? 24 : 40,
            justifyContent: 'center',
            ...this.props.style,
          }}
        >
          {this.props.component && this.props.component}
          {this.props.title && (
            <Text
              style={{
                color: textColor,
                textAlign: 'center',
                ...this.props.textStyle,
              }}
            >
              {this.props.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
}

export class SliderCard extends Component {
  scrollRef = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      selectedIndex: 0,
    };
    this.width = width - 100;
    this.height = (this.width / 16) * 9;
  }

  scrolling = event => {
    let offsetX = event.nativeEvent.contentOffset.x;
    let range = this.width + 10;
    let wCard = this.width;
    let selectedIndex = Math.floor(offsetX / wCard);

    offsetX >= wCard / 2 + 15 + range * selectedIndex
      ? (selectedIndex = selectedIndex + 1)
      : (selectedIndex = selectedIndex);

    this.setState(
      {
        selectedIndex,
      },
      () => {
        this.scrollRef.current.scrollTo({
          animated: true,
          y: 0,
          x: range * this.state.selectedIndex,
        });
        this.autoScroll = setInterval(() => {
          this.setState(
            prev => ({
              selectedIndex:
                prev.selectedIndex === this.props.data.length - 1
                  ? 0
                  : prev.selectedIndex + 1,
            }),
            () => {
              this.scrollRef.current.scrollTo({
                animated: true,
                y: 0,
                x: (this.width + 10) * this.state.selectedIndex,
              });
            },
          );
        }, 3000);
      },
    );
  };

  autoScroll = setInterval(() => {
    this.setState(
      prev => ({
        selectedIndex:
          prev.selectedIndex === this.props.data.length - 1
            ? 0
            : prev.selectedIndex + 1,
      }),
      () => {
        this.scrollRef.current.scrollTo({
          animated: true,
          y: 0,
          x: (this.width + 10) * this.state.selectedIndex,
        });
      },
    );
  }, 3000);

  componentDidMount() {
    this.autoScroll;
  }

  componentWillUnmount() {
    clearInterval(this.autoScroll);
  }

  render() {
    return (
      <View
        style={{
          paddingTop: 10,
          marginBottom: 15,
        }}
      >
        <ScrollView
          horizontal
          ref={this.scrollRef}
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => clearInterval(this.autoScroll)}
          onScrollEndDrag={this.scrolling}
        >
          {this.props.data.map((item, index) => {
            let margin = null;
            let trigger = null;
            if (index === 0) {
              margin = {
                marginLeft: 15,
              };
            } else if (index === this.props.data.length - 1) {
              margin = {
                marginRight: 15,
              };
            }
            if (item.adFoodSlideCardCategory === 'web') {
              trigger = () => {
                Linking.openURL(item.adFoodSlideCardPlain);
              };
            } else if (item.adFoodSlideCardCategory === 'food') {
              let plain = item.adFoodSlideCardPlain;
              plain = plain.split('|');
              trigger = () => {
                this.props.navigate('Merchant', {
                  merchantId: plain[0],
                  foodId: plain[1],
                });
              };
            } else if (item.adFoodSlideCardCategory === 'merchant') {
              trigger = () => {
                this.props.navigate('Merchant', {
                  merchantId: item.adFoodSlideCardPlain,
                });
              };
            }

            return (
              <TouchableHighlight
                key={(index + 1) * Math.random()}
                onPress={trigger}
                underlayColor="rgba(0,0,0,.25)"
                style={{ borderRadius: 8 }}
              >
                <View
                  style={{
                    width: this.width,
                    marginHorizontal: 5,
                    height: this.height,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: Color.grayLighter,
                    ...margin,
                  }}
                >
                  <Image
                    style={{
                      height: '100%',
                      width: '100%',
                    }}
                    resizeMode="cover"
                    source={{ uri: item.adFoodSlideCardPicture }}
                  />
                </View>
              </TouchableHighlight>
            );
          })}
        </ScrollView>
        <View
          style={{
            marginHorizontal: 15,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              marginTop: 15,
            }}
          >
            {this.props.data.map((img, i) => (
              <View
                key={(i + 1) * Math.random()}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  marginLeft: i === 0 ? 0 : 5,
                  borderWidth: 2,
                  borderColor:
                    this.state.selectedIndex === i
                      ? Color.primary
                      : Color.grayLighter,
                  marginHorizontal: 5,
                  backgroundColor:
                    this.state.selectedIndex === i
                      ? Color.primary
                      : Color.grayLight,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }
}

export class Items extends Component {
  render() {
    return (
      <View style={{ marginBottom: 15 }}>
        {!this.props.headless && (
          <View
            style={{
              marginBottom: this.props.style === 'sliding' ? 15 : 10,
              paddingHorizontal: 15,
            }}
          >
            <View style={{ flexDirection: 'row', paddingTop: 10 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontWeight: 'bold', marginBottom: 3 }}
                >
                  {this.props.title}
                </Text>
                <Text numberOfLines={1}>{this.props.subTitle}</Text>
              </View>
              {this.props.more && (
                <View>
                  <TouchableOpacity onPress={this.props.more} activeOpacity={1}>
                    <Text style={{ color: Color.secondary }}>Lihat semua</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        {this.props.style === 'sliding' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {this.props.product.map((item, i) => {
              let margin = null;
              if (i === 0) {
                margin = {
                  marginLeft: 15,
                };
              } else if (i === this.props.product.length - 1) {
                margin = {
                  marginRight: 15,
                };
              }
              return (
                <View
                  key={(i + 1) * Math.random()}
                  style={{ marginHorizontal: 6, ...margin }}
                >
                  <ItemVertical
                    category={this.props.category}
                    navigate={this.props.navigate}
                    item={item}
                  />
                  {this.props.category === 'food' && item.foodDiscount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: -6,
                        width: 80,
                        height: 35,
                      }}
                    >
                      <Image
                        resizeMode="contain"
                        style={{ width: '100%', height: '100%' }}
                        source={require('../images/ribbon.png')}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          this.props.product.map((item, i) => {
            return (
              <ItemHorizontal
                category={this.props.category}
                navigate={this.props.navigate}
                key={(i + 1) * Math.random()}
                item={item}
              />
            );
          })
        )}
      </View>
    );
  }
}

export class ItemVertical extends Component {
  render() {
    return (
      <TouchableHighlight
        activeOpacity={0.85}
        underlayColor="#fff"
        onPress={() =>
          this.props.navigate('Merchant', {
            foodId:
              this.props.category === 'food'
                ? this.props.item.foodId
                : undefined,
            merchantId: this.props.item.merchantId,
          })
        }
        style={{ borderRadius: 10 }}
      >
        <View
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            width: 140,
            height: 205,
            backgroundColor: Color.white,
          }}
        >
          <View
            style={{
              width: '100%',
              height: 120,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Color.grayLighter,
            }}
          >
            <Image
              style={{
                width: '100%',
                height: '100%',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
              }}
              resizeMode="cover"
              source={{
                uri: getImageThumb(
                  this.props.category === 'food'
                    ? this.props.item.foodPicture
                    : this.props.item.merchantPicture,
                  'sm',
                ),
              }}
            />
          </View>
          <View
            style={{
              padding: 8,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              borderWidth: 1,
              borderColor: Color.borderColor,
              borderTopWidth: 0,
              flex: 1,
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                fontWeight: 'bold',
                marginBottom: 6,
                color: Color.grayDark,
              }}
            >
              {this.props.category === 'food'
                ? this.props.item.foodName
                : this.props.item.merchantName}
            </Text>
            {this.props.category === 'food' ? (
              <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    marginHorizontal: 5,
                  }}
                >
                  {Currency(
                    this.props.item.foodPrice -
                      (this.props.item.foodDiscount / 100) *
                        this.props.item.foodPrice,
                  )}
                </Text>
                {this.props.item.foodDiscount > 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 'bold',
                      marginHorizontal: 5,
                      textDecorationLine: 'line-through',
                      textDecorationStyle: 'solid',
                      color: Color.gray,
                    }}
                  >
                    {Currency(this.props.item.foodPrice)}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    marginHorizontal: 5,
                  }}
                >
                  {DistanceFormat(parseInt(this.props.item.merchantDistance))}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

export class ItemHorizontal extends Component {
  render() {
    const Pressed = () => {
      this.props.navigate('Merchant', {
        foodId:
          this.props.category === 'food' ? this.props.item.foodId : undefined,
        merchantId: this.props.item.merchantId,
      });
    };
    return (
      <TouchableHighlight
        activeOpacity={0.85}
        underlayColor="#fff"
        onPress={Pressed}
      >
        <View
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            flexDirection: 'row',
            position: 'relative',
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Color.grayLighter,
            }}
          >
            <Image
              style={{ width: '100%', height: '100%', borderRadius: 5 }}
              resizeMode="cover"
              source={{
                uri: getImageThumb(
                  this.props.category === 'food'
                    ? this.props.item.foodPicture
                    : this.props.item.merchantPicture,
                  'xs',
                ),
              }}
            />
          </View>
          {this.props.category === 'food' &&
            this.props.item.foodDiscount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 15,
                  left: 10.5,
                  width: 55,
                  height: 24,
                }}
              >
                <Image
                  resizeMode="contain"
                  style={{ width: '100%', height: '100%' }}
                  source={require('../images/ribbon.png')}
                />
              </View>
            )}
          <View style={{ paddingLeft: 10, flex: 1 }}>
            <Text
              style={{
                fontWeight: 'bold',
                color: Color.grayDark,
                fontSize: 15,
                marginBottom: 2,
              }}
            >
              {this.props.category === 'food'
                ? this.props.item.foodName
                : this.props.item.merchantName}
            </Text>
            {this.props.category === 'food' ? (
              <Text
                numberOfLines={1}
                style={{
                  marginBottom: 8,
                  fontSize: 13,
                  color: Color.grayDark,
                }}
              >
                {this.props.item.merchantName}
              </Text>
            ) : (
              <Text
                numberOfLines={1}
                style={{
                  marginBottom: 8,
                  fontSize: 13,
                  color: Color.grayDark,
                }}
              >
                {this.props.item.merchantAddress}
              </Text>
            )}
            {this.props.category === 'food' ? (
              <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    marginHorizontal: 5,
                  }}
                >
                  {Currency(
                    this.props.item.foodPrice -
                      (this.props.item.foodDiscount / 100) *
                        this.props.item.foodPrice,
                  )}
                </Text>
                {this.props.item.foodDiscount > 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 'bold',
                      marginHorizontal: 5,
                      textDecorationLine: 'line-through',
                      textDecorationStyle: 'solid',
                      color: Color.gray,
                    }}
                  >
                    {Currency(this.props.item.foodPrice)}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    marginHorizontal: 5,
                  }}
                >
                  {DistanceFormat(parseInt(this.props.item.merchantDistance))}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

class PopUpRaw extends Component {
  scrollRef = React.createRef();
  overlay = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      contentWrap: 0,
      opacityOverlay: 0,
      opened: false,
    };
  }

  componentDidUpdate() {
    if (!this.props.opened) {
      this.slideDown();
      setTimeout(() => {
        if (this.props.close) this.props.close();
      }, 300);
    }
  }

  componentDidMount() {
    Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount() {
    Keyboard.removeAllListeners('keyboardDidShow', this._keyboardDidShow);
    Keyboard.removeAllListeners('keyboardDidHide', this._keyboardDidHide);
  }

  _layout = event => {
    let heightLay = event.nativeEvent.layout.height;
    heightLay = heightLay > height - 50 ? height - 50 : heightLay;
    this.setState(
      {
        contentWrap: heightLay,
        opacityOverlay: 1,
      },
      () => {
        this.scrollRef.current.scrollTo({
          y: heightLay,
          animated: true,
        });
      },
    );
  };

  _keyboardDidShow = e => {
    this.viewRef.setNativeProps({
      paddingBottom: e.endCoordinates.height,
    });
  };

  _keyboardDidHide = e => {
    this.viewRef.setNativeProps({
      paddingBottom: 0,
    });
  };

  scrolled = event => {
    let offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY <= this.state.contentWrap / 2) {
      this.slideDown();
      if (this.props.close) this.props.close();
    } else {
      this.scrollRef.current.scrollTo({
        y: this.state.contentWrap,
        animated: true,
      });
    }
  };

  slideDown = () => {
    this.scrollRef.current.scrollTo({
      y: 0,
      animated: true,
    });
  };

  btnPrimaryPress = () => {
    typeof this.props.btnPrimary === 'function'
      ? this.props.btnPrimary()
      : null;
    this.props.btnPrimaryAction();
  };

  btnSecondaryPress = () => {
    typeof this.props.btnSecondary === 'function'
      ? this.props.btnSecondary()
      : null;
    this.props.btnSecondaryAction();
  };

  render() {
    return (
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          zIndex: 9999,
          ...this.props.style,
        }}
      >
        <ScrollView
          ref={this.scrollRef}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScrollEndDrag={this.scrolled}
        >
          <TouchableOpacity
            onPress={() => {
              this.slideDown();
              setTimeout(() => {
                if (this.props.close) this.props.close();
              }, 300);
            }}
            activeOpacity={1}
          >
            <View
              style={{
                height: height + 10,
                backgroundColor: 'rgba(0,0,0,.5)',
                opacity: 1,
              }}
            />
          </TouchableOpacity>
          <View
            onLayout={this._layout}
            style={{
              backgroundColor: Color.white,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              marginTop: -10,
              elevation: 20,
              paddingBottom: this.props.insets.bottom,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 5,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: Color.grayLight,
                }}
              />
            </View>
            <View
              style={{
                padding: 15,
                paddingTop: 10,
                ...this.props.styleContent,
              }}
            >
              <View ref={view => (this.viewRef = view)}>
                {this.props.content}
              </View>
              <View style={{ marginHorizontal: -5 }}>
                {this.props.btnSecondaryTitle && (
                  <Button
                    secondary
                    onPress={this.btnSecondaryPress}
                    title={this.props.btnSecondaryTitle}
                    style={{ flex: 1, marginHorizontal: 5 }}
                  />
                )}
                {this.props.btnPrimaryTitle && (
                  <Button
                    onPress={this.btnPrimaryPress}
                    title={this.props.btnPrimaryTitle}
                    style={{ flex: 1, marginHorizontal: 5 }}
                  />
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }
}

export const PopUp = withSafeAreaInsets(PopUpRaw);

export class FoodMerchant extends Component {
  render() {
    return (
      <SafeAreaView
        style={{
          backgroundColor: Color.white,
          marginBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: Color.borderColor,
        }}
      >
        <View
          style={{
            paddingVertical: 15,
            marginHorizontal: 15,
            borderBottomColor: Color.borderColor,
            borderBottomWidth: 1,
          }}
        >
          <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            Menu Spesial
          </Text>
        </View>
        <View>
          {this.props.data.map((item, i) => {
            let filtercart = this.props.carts.filter(function (a) {
              return a.foodId === item.foodId;
            });

            let view = (
              <TouchableHighlight
                style={{ borderRadius: 3 }}
                activeOpacity={0.85}
                underlayColor="#fff"
                onPress={() => {
                  this.props.addCartAction(item);
                }}
              >
                <View
                  style={{
                    height: 24,
                    elevation: 1,
                    borderRadius: 3,
                    overflow: 'hidden',
                    paddingHorizontal: 10,
                    backgroundColor: Color.primary,
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{ color: colorYiq(Color.primary), fontSize: 11 }}
                  >
                    Tambah
                  </Text>
                </View>
              </TouchableHighlight>
            );

            if (filtercart.length > 0) {
              view = (
                <View style={{ marginHorizontal: -5, flexDirection: 'row' }}>
                  <TouchableHighlight
                    onPress={() => {
                      this.props.openPopUpCatatan(item.foodId);
                    }}
                    underlayColor="#fff"
                    activeOpacity={0.85}
                  >
                    <View
                      style={{
                        marginHorizontal: 5,
                        height: 24,
                        borderRadius: 3,
                        overflow: 'hidden',
                        elevation: 1,
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Color.white,
                        shadowColor: '#000',
                        shadowOffset: {
                          width: 0,
                          height: 1,
                        },
                        shadowOpacity: 0.18,
                        shadowRadius: 1.0,
                      }}
                    >
                      {filtercart[0].note != '' ? (
                        <Feather
                          style={{ color: Color.green, fontSize: 11 }}
                          name="check-circle"
                        />
                      ) : (
                        <Feather
                          style={{ color: Color.secondary, fontSize: 11 }}
                          name="edit-3"
                        />
                      )}
                    </View>
                  </TouchableHighlight>
                  <View
                    style={{
                      marginHorizontal: 5,
                      height: 24,
                      flexDirection: 'row',
                      borderRadius: 3,
                      overflow: 'hidden',
                      elevation: 1,
                      shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 1,
                      },
                      shadowOpacity: 0.18,
                      shadowRadius: 1.0,
                      backgroundColor: Color.white,
                    }}
                  >
                    <TouchableHighlight
                      activeOpacity={0.85}
                      underlayColor="#fff"
                      onPress={() => {
                        this.props.removeCartAction(item.foodId);
                      }}
                      style={{
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather
                        style={{ color: Color.secondary, fontSize: 11 }}
                        name="minus"
                      />
                    </TouchableHighlight>
                    <View
                      style={{
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold' }}>
                        {filtercart[0].qty}
                      </Text>
                    </View>
                    <TouchableHighlight
                      activeOpacity={0.85}
                      underlayColor="#fff"
                      onPress={() => {
                        this.props.addCartAction(item);
                      }}
                      style={{
                        width: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather
                        style={{ color: Color.secondary, fontSize: 11 }}
                        name="plus"
                      />
                    </TouchableHighlight>
                  </View>
                </View>
              );
            }
            return (
              <TouchableHighlight
                key={item.foodId}
                onPress={() => {
                  this.props.openPopUpFood({
                    foodId: item.foodId,
                    merchantId: item.merchantId,
                    foodName: item.foodName,
                    foodPicture: item.foodPicture,
                    foodPrice: item.foodPrice,
                    foodDiscount: item.foodDiscount,
                    foodDetails: item.foodDetails,
                  });
                }}
                activeOpacity={0.85}
                underlayColor="#fff"
              >
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      position: 'relative',
                      margin: 15,
                    }}
                  >
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        overflow: 'hidden',
                        borderRadius: 3,
                        backgroundColor: Color.grayLighter,
                      }}
                    >
                      <Image
                        style={{ width: '100%', height: '100%' }}
                        source={{
                          uri: getImageThumb(item.foodPicture, 'xs'),
                        }}
                      />
                    </View>
                    {item.foodDiscount > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 5,
                          left: -4.5,
                          width: 55,
                          height: 24,
                        }}
                      >
                        <Image
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                          source={require('../images/ribbon.png')}
                        />
                      </View>
                    )}
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <Text
                        style={{ fontWeight: 'bold', marginBottom: 6 }}
                        numberOfLines={2}
                      >
                        {item.foodName}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          marginHorizontal: -5,
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            marginHorizontal: 5,
                          }}
                        >
                          {Currency(
                            item.foodPrice -
                              (item.foodDiscount / 100) * item.foodPrice,
                          )}
                        </Text>
                        {item.foodDiscount > 0 && (
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: 'bold',
                              marginHorizontal: 5,
                              color: Color.textMuted,
                              textDecorationLine: 'line-through',
                              textDecorationStyle: 'solid',
                            }}
                          >
                            {Currency(item.foodPrice)}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {view}
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableHighlight>
            );
          })}
        </View>
      </SafeAreaView>
    );
  }
}

export class Card extends Component {
  render() {
    return (
      <View
        style={{
          borderTopWidth: 10,
          borderTopColor: Color.grayLighter,
          backgroundColor: Color.white,
          borderBottomWidth: 1,
          borderBottomColor: Color.borderColor,
          ...this.props.style,
        }}
      >
        {this.props.headerTitle && (
          <View style={{ paddingHorizontal: 15 }}>
            <View
              style={[
                {
                  flexDirection: 'row',
                  paddingVertical: 15,
                  borderBottomColor: Color.borderColor,
                  borderBottomWidth: this.props.headerDashLine ? 0 : 1,
                },
                this.props.headerStyleGray && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    { fontWeight: 'bold' },
                    this.props.headerStyleGray && {
                      color: Color.textMuted,
                      textTransform: 'uppercase',
                      fontSize: 13,
                      letterSpacing: 0.5,
                    },
                  ]}
                >
                  {this.props.headerTitle}
                </Text>
              </View>
              {this.props.btnTitle && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={this.props.btnAction}
                >
                  <Text style={{ fontWeight: 'bold', color: Color.secondary }}>
                    {this.props.btnTitle}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {this.props.headerDashLine && <DashLine />}
          </View>
        )}
        <View style={this.props.bodyStyle}>{this.props.body}</View>
      </View>
    );
  }
}

export class DashLine extends Component {
  render() {
    return (
      <Dash
        dashThickness={1}
        dashLength={2}
        dashGap={2}
        dashColor={Color.borderColor}
        style={{ width: '100%', height: 1, transform: [{ translateY: -1.5 }] }}
      />
    );
  }
}
export class SimpleHeader extends Component {
  render() {
    return (
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 15,
          paddingVertical: 10,
          marginHorizontal: -5,
          paddingTop:
            Platform.OS === 'android' ? 10 + StatusBar.currentHeight : 50,
          backgroundColor: Color.white,
          ...this.props.style,
        }}
      >
        {this.props.goBack && (
          <View>
            <TouchableHighlight
              onPress={() => this.props.navigation.goBack()}
              underlayColor="#fff"
              activeOpacity={0.85}
              style={{
                height: 40,
                marginHorizontal: 5,
                width: 40,
                borderRadius: 40 / 2,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                ...this.props.backBtnStyle,
              }}
            >
              <Fa iconStyle="solid" size={18} name="chevron-left" />
            </TouchableHighlight>
          </View>
        )}
        {this.props.mainComponent ? (
          <View style={{ flex: 1, marginHorizontal: 5 }}>
            {this.props.mainComponent}
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              marginHorizontal: 5,
              justifyContent: 'center',
              height: 40,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontWeight: 'bold',
                fontSize: 16,
                color: Color.grayDark,
              }}
            >
              {this.props.title}
            </Text>
          </View>
        )}
        {this.props.rightComponent}
      </View>
    );
  }
}

export class BookingStatus extends Component {
  render() {
    let { status, orderType } = this.props;
    let title = '';
    let subtitle = '';
    if (orderType === 'FOOD') {
      switch (status) {
        case 'finded':
          title = 'Driver ditemukan';
          subtitle = 'Driver telah menerima pesanan';
          break;
        case 'towards_resto':
          title = 'Menuju restoran';
          subtitle = 'Driver dalam perjalanan ke restoran';
          break;
        case 'bought_order':
          title = 'Membeli pesanan';
          subtitle = 'Driver sedang membelikan pesanan';
          break;
        case 'towards_customer':
          title = 'Mengantar pesanan';
          subtitle = 'Driver dalam perjalanan ke lokasi anda';
          break;
        case 'completed':
          title = 'Pesanan selesai';
          subtitle = 'Pesanan telah sampai ke lokasi pengiriman';
          break;
        case 'cancelled_by_user':
          title = 'Dibatalkan';
          subtitle = 'Pesanan telah dibatalkan';
          break;
        case 'cancelled_by_driver':
          title = 'Dibatalkan';
          subtitle = 'Pesanan telah dibatalkan oleh driver';
          break;
      }
    } else if (orderType === 'RIDE') {
      switch (status) {
        case 'finded':
          title = 'Driver ditemukan';
          subtitle = 'Driver telah menerima permintaan';
          break;
        case 'towards_customer':
          title = 'Menjemput anda';
          subtitle = 'Driver dalam perjalanan ke lokasi penjemputan';
          break;
        case 'drop_off':
          title = 'Mengantar anda';
          subtitle = 'Dalam perjalanan ke lokasi tujuan anda';
          break;
        case 'completed':
          title = 'Permintaan selesai';
          subtitle = 'Permintaan mengantar telah selesai';
          break;
        case 'cancelled_by_user':
          title = 'Dibatalkan';
          subtitle = 'Pesanan telah dibatalkan';
          break;
        case 'cancelled_by_driver':
          title = 'Dibatalkan';
          subtitle = 'Pesanan telah dibatalkan oleh driver';
          break;
      }
    }
    return (
      <View style={this.props.style}>
        {this.props.navigateOrderDetail ? (
          <TouchableHighlight
            onPress={this.props.navigateOrderDetail}
            activeOpacity={0.85}
            underlayColor="#fff"
          >
            <View style={{ paddingHorizontal: 15 }}>
              <View
                style={{
                  borderBottomWidth: 1,
                  paddingVertical: 15,
                  borderBottomColor: Color.borderColor,
                  marginHorizontal: -5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    height: 65,
                    width: 65,
                    padding: 10,
                    marginHorizontal: 5,
                  }}
                >
                  {orderType === 'FOOD' && (
                    <Image
                      style={{ height: '100%', width: '100%' }}
                      source={require('../images/icons/dish.png')}
                    />
                  )}
                  {orderType === 'RIDE' && (
                    <Image
                      style={{ height: '100%', width: '100%' }}
                      source={require('../images/icons/scooter.png')}
                    />
                  )}
                </View>
                <View style={{ marginHorizontal: 5, flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontWeight: 'bold',
                      fontSize: 16,
                      marginBottom: 5,
                    }}
                  >
                    {title}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 13 }}>
                    {subtitle}
                  </Text>
                </View>
                <View
                  style={{
                    marginHorizontal: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    color={Color.gray}
                    name="chevron-right"
                  />
                </View>
              </View>
            </View>
          </TouchableHighlight>
        ) : (
          <View style={{ paddingHorizontal: 15 }}>
            <View
              style={{
                borderBottomWidth: 1,
                paddingVertical: 15,
                borderBottomColor: Color.borderColor,
                marginHorizontal: -5,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  height: 65,
                  width: 65,
                  padding: 10,
                  marginHorizontal: 5,
                }}
              >
                {this.props.orderType === 'FOOD' && (
                  <Image
                    style={{ height: '100%', width: '100%' }}
                    source={require('../images/icons/dish.png')}
                  />
                )}
                {this.props.orderType === 'RIDE' && (
                  <Image
                    style={{ height: '100%', width: '100%' }}
                    source={require('../images/icons/scooter.png')}
                  />
                )}
              </View>
              <View style={{ marginHorizontal: 5, flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 5 }}
                >
                  {title}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 13 }}>
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
}

export class MainMenu extends Component {
  render() {
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        activeOpacity={1}
        style={{ flexBasis: width / 3 - 10, padding: 15 }}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 60 / 2,
              backgroundColor: this.props.color,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              borderColor: Color.grayLighter,
              borderWidth: 4,
            }}
          >
            {this.props.fa && (
              <Fa
                iconStyle="solid"
                size={18}
                color={colorYiq(this.props.color)}
                name={this.props.fa}
              />
            )}
            {this.props.ion && (
              <Ion
                size={18}
                color={colorYiq(this.props.color)}
                name={this.props.ion}
              />
            )}
          </View>
          <Text
            style={{
              letterSpacing: 0.75,
              color: Color.textMuted,
              textTransform: 'uppercase',
              fontSize: 11,
            }}
            numberOfLines={1}
          >
            Co
            <Text style={{ color: Color.grayDark, fontWeight: 'bold' }}>
              {this.props.title}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

export class DummyMainMenu extends Component {
  render() {
    return (
      <View style={{ flexBasis: width / 3 - 10, padding: 15 }}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 60 / 2,
              backgroundColor: Color.grayLighter,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              borderColor: Color.grayLighter,
              borderWidth: 4,
            }}
          />
          <View
            style={{
              height: 11,
              width: 50,
              backgroundColor: Color.grayLighter,
              borderRadius: 20,
              marginTop: 0.5,
              marginBottom: 4,
            }}
          />
        </View>
      </View>
    );
  }
}

export class OrderHistoryItem extends Component {
  render() {
    let statusText = 'on-progress';
    let statusColor = Color.primary;
    let iconName = 'user';
    let iconColor = Color.blue;
    switch (this.props.status) {
      case 'cancelled_by_user':
        statusText = 'cancelled';
        statusColor = Color.red;
        break;
      case 'cancelled_by_driver':
        statusText = 'cancelled';
        statusColor = Color.red;
        break;
      case 'completed':
        statusText = 'completed';
        statusColor = Color.green;
        break;
      default:
        statusText = 'on-progress';
        statusColor = Color.primary;
    }

    switch (this.props.type) {
      case 'RIDE':
        iconName = 'user';
        iconColor = Color.blue;
        break;
      case 'FOOD':
        iconName = 'utensils';
        iconColor = Color.red;
        break;
    }

    return (
      <TouchableHighlight
        underlayColor="#fff"
        activeOpacity={0.85}
        onPress={this.props.onPress}
      >
        <View style={{ paddingHorizontal: 15 }}>
          <View
            style={{
              paddingVertical: 15,
              borderBottomWidth: this.props.last ? 0 : 1,
              borderBottomColor: Color.grayLight,
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <View>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    backgroundColor: iconColor,
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    color={colorYiq(iconColor)}
                    size={20}
                    name={iconName}
                  />
                </View>
              </View>
              <View style={{ flex: 1, paddingLeft: 15, paddingVertical: 2 }}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: Color.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      {this.props.dateTime}
                    </Text>
                    <View style={{ position: 'relative', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            marginRight: 8,
                            marginTop: 6,
                            borderWidth: 2,
                            borderColor: Color.grayLight,
                          }}
                        />
                        <View>
                          <Text style={{ fontWeight: 'bold' }}>
                            {this.props.origin.geocode.title}
                          </Text>
                          <Text numberOfLines={1} style={{ fontSize: 11 }}>
                            {this.props.origin.geocode.address}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            marginRight: 8,
                            marginTop: 6,
                            backgroundColor: Color.primary,
                          }}
                        />
                        <View>
                          <Text style={{ fontWeight: 'bold' }}>
                            {this.props.destination.geocode.title}
                          </Text>
                          <Text numberOfLines={1} style={{ fontSize: 11 }}>
                            {this.props.destination.geocode.address}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontWeight: 'bold' }}>{this.props.fare}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: 'bold',
                      backgroundColor: statusColor,
                      color: colorYiq(statusColor),
                      borderRadius: 3,
                      paddingHorizontal: 3,
                      paddingVertical: 1.5,
                    }}
                  >
                    <Fa name="hashtag" />
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

export class DummyItems extends Component {
  render() {
    return (
      <View
        style={{
          marginBottom: 15,
        }}
      >
        {!this.props.headless && (
          <View
            style={{
              marginBottom: this.props.horizontal ? 15 : 10,
              paddingHorizontal: 15,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                paddingTop: 10,
              }}
            >
              <View
                style={{
                  flex: 1,
                  paddingRight: 10,
                }}
              >
                <View
                  style={{
                    width: 70,
                    height: 15,
                    marginTop: 1,
                    marginBottom: 4,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: 80,
                    height: 14,
                    marginTop: 1,
                    marginBottom: 4,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
              </View>
              <View>
                <View
                  style={{
                    width: 70,
                    height: 13,
                    marginTop: 1,
                    marginBottom: 4,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </View>
        )}
        <View style={{ overflow: 'hidden' }}>
          {this.props.horizontal ? (
            <View>
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
              <DummyItemHorizontal />
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                overflow: 'hidden',
              }}
            >
              <DummyItemVertical
                margin={{
                  marginLeft: 15,
                }}
              />
              <DummyItemVertical
                margin={{
                  marginRight: 15,
                }}
              />
              <DummyItemVertical
                margin={{
                  marginRight: 15,
                }}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
}

export class DummyItemVertical extends Component {
  render() {
    return (
      <View
        style={[
          {
            marginHorizontal: 5,
            borderColor: Color.borderColor,
            borderRadius: 10,
            overflow: 'hidden',
            width: 140,
            height: 200,
            borderWidth: 1,
            backgroundColor: Color.white,
          },
          this.props.margin,
        ]}
      >
        <View
          style={{
            width: '100%',
            height: 120,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Color.grayLighter,
          }}
        />
        <View style={{ padding: 8 }}>
          <View
            style={{
              width: 80,
              height: 13,
              marginTop: 1,
              marginBottom: 4,
              backgroundColor: Color.grayLighter,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: 50,
              height: 13,
              marginTop: 1,
              marginBottom: 4,
              backgroundColor: Color.grayLighter,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    );
  }
}

export class DummyItemHorizontal extends Component {
  render() {
    return (
      <View
        style={{
          paddingHorizontal: 15,
          paddingVertical: 10,
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            width: 70,
            height: 70,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            backgroundColor: Color.grayLighter,
          }}
        />
        <View style={{ paddingTop: 2, paddingLeft: 10 }}>
          <View
            style={{
              width: 80,
              height: 14,
              marginTop: 1,
              marginBottom: 4 + 6,
              backgroundColor: Color.grayLighter,
              borderRadius: 4,
            }}
          />
          <View
            style={{
              width: 50,
              height: 14,
              marginTop: 1,
              marginBottom: 4,
              backgroundColor: Color.grayLighter,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    );
  }
}

export class DummySliderCard extends Component {
  constructor(props) {
    super(props);
    this.width = width - 100;
    this.height = (this.width / 16) * 9;
  }
  render() {
    return (
      <View style={{ paddingTop: 10, marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', overflow: 'hidden' }}>
          <View
            style={{
              width: this.width,
              marginHorizontal: 5,
              height: this.height,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginLeft: 15,
              backgroundColor: Color.grayLighter,
            }}
          />
          <View
            style={{
              width: this.width,
              marginHorizontal: 5,
              height: this.height,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: Color.grayLighter,
            }}
          />
        </View>
        <View style={{ marginHorizontal: 15 }}>
          <View style={{ flexDirection: 'row', marginTop: 15 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                marginLeft: 0,
                borderWidth: 2,
                borderColor: Color.grayLighter,
                marginHorizontal: 5,
                backgroundColor: Color.grayLight,
              }}
            />
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                marginLeft: 0,
                borderWidth: 2,
                borderColor: Color.grayLighter,
                marginHorizontal: 5,
                backgroundColor: Color.grayLight,
              }}
            />
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                marginLeft: 0,
                borderWidth: 2,
                borderColor: Color.grayLighter,
                marginHorizontal: 5,
                backgroundColor: Color.grayLight,
              }}
            />
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                marginLeft: 0,
                borderWidth: 2,
                borderColor: Color.grayLighter,
                marginHorizontal: 5,
                backgroundColor: Color.grayLight,
              }}
            />
          </View>
        </View>
      </View>
    );
  }
}

export class DummyMerchantInfo extends Component {
  render() {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <View style={{ backgroundColor: Color.grayLighter, height: 220 }}>
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                height:
                  Platform.OS === 'android' ? StatusBar.currentHeight : 40,
                left: 0,
                right: 0,
                zIndex: 1,
              }}
            >
              <LinearGradient
                style={{ flex: 1 }}
                colors={['rgba(0,0,0,.75)', 'rgba(0,0,0,.25)', 'transparent']}
              />
            </View>
            <View
              style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            />
          </View>
        </View>
        <View
          style={{
            backgroundColor: Color.white,
            borderBottomColor: Color.borderColor,
            borderBottomWidth: 1,
            marginBottom: 10,
          }}
        >
          <View style={{ paddingHorizontal: 15, position: 'relative' }}>
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: Color.borderColor,
                marginTop: 20,
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 18,
                  marginTop: 1,
                  marginBottom: 10,
                  backgroundColor: Color.grayLighter,
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  width: 140,
                  height: 14,
                  marginTop: 1,
                  marginBottom: 15,
                  backgroundColor: Color.grayLighter,
                  borderRadius: 4,
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 15,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 17,
                    marginTop: 1,
                    marginBottom: 4,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
            {/* <View style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'center' }}>
              <View style={{ width: 120, height: 15, marginTop: 1, marginBottom: 4, backgroundColor: Color.grayLighter, borderRadius: 4 }}></View>
            </View> */}
          </View>
        </View>
        <View
          style={{
            backgroundColor: Color.white,
            marginBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: Color.borderColor,
          }}
        >
          <View
            style={{
              paddingVertical: 15,
              marginHorizontal: 15,
              borderBottomColor: Color.borderColor,
              borderBottomWidth: 1,
            }}
          >
            <View
              style={{
                width: 70,
                height: 15,
                marginTop: 1,
                marginBottom: 4,
                backgroundColor: Color.grayLighter,
                borderRadius: 4,
              }}
            />
          </View>
          <View>
            <View style={{ paddingHorizontal: 15, paddingVertical: 15 }}>
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    width: 70,
                    height: 70,
                    overflow: 'hidden',
                    borderRadius: 3,
                    backgroundColor: Color.grayLighter,
                  }}
                />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View
                    style={{
                      width: 80,
                      height: 15,
                      marginTop: 1,
                      marginBottom: 13,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 50,
                      height: 12,
                      marginTop: 1,
                      marginBottom: 4 + 6,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 24,
                        backgroundColor: Color.grayLighter,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 15, paddingVertical: 15 }}>
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    width: 70,
                    height: 70,
                    overflow: 'hidden',
                    borderRadius: 3,
                    backgroundColor: Color.grayLighter,
                  }}
                />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View
                    style={{
                      width: 80,
                      height: 15,
                      marginTop: 1,
                      marginBottom: 13,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 50,
                      height: 12,
                      marginTop: 1,
                      marginBottom: 4 + 6,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 24,
                        backgroundColor: Color.grayLighter,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 15, paddingVertical: 15 }}>
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    width: 70,
                    height: 70,
                    overflow: 'hidden',
                    borderRadius: 3,
                    backgroundColor: Color.grayLighter,
                  }}
                />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View
                    style={{
                      width: 80,
                      height: 15,
                      marginTop: 1,
                      marginBottom: 13,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 50,
                      height: 12,
                      marginTop: 1,
                      marginBottom: 4 + 6,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 24,
                        backgroundColor: Color.grayLighter,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export class DummyFareRide extends Component {
  render() {
    return (
      <SafeAreaView
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: Color.white,
          elevation: 5,
        }}
      >
        <View style={{ paddingTop: 10, paddingBottom: 15 }}>
          <View
            style={{
              borderBottomWidth: 5,
              borderBottomColor: Color.grayLighter,
            }}
          >
            <View style={{ marginBottom: 8 }}>
              <View
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  flexDirection: 'row',
                }}
              >
                <View>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 45 / 2,
                      backgroundColor: Color.grayLighter,
                    }}
                  />
                </View>
                <View style={{ paddingHorizontal: 10, flex: 1 }}>
                  <View
                    style={{
                      width: 60,
                      height: 10,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 100,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  {/* <Text numberOfLines={2} style={{ fontSize: 13, color: Color.textMuted }}>Jl. Nusa Indah, Sungai Dawu, Rengat Bar., Kabupaten Indragiri Hulu, Riau 29351, Indonesia</Text> */}
                </View>
                <View
                  style={{
                    paddingHorizontal: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    color={Color.grayLighter}
                    name="chevron-right"
                  />
                </View>
              </View>
              <View
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  flexDirection: 'row',
                }}
              >
                <View>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 45 / 2,
                      backgroundColor: Color.grayLighter,
                    }}
                  />
                </View>
                <View style={{ paddingHorizontal: 10, flex: 1 }}>
                  <View
                    style={{
                      width: 60,
                      height: 10,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 100,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  {/* <Text numberOfLines={2} style={{ fontSize: 13, color: Color.textMuted }}>Pematang Reba, Rengat Barat, Pematang Reba, Rengat Bar, Kabupaten Indragiri Hulu, Riau 29351, Indonesia</Text> */}
                </View>
                <View
                  style={{
                    paddingHorizontal: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    color={Color.grayLighter}
                    name="chevron-right"
                  />
                </View>
              </View>
              <View style={{ position: 'absolute', left: 28.5, top: 46 }}>
                <View>
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: Color.grayLight,
                      marginVertical: 2,
                    }}
                  />
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: Color.grayLight,
                      marginVertical: 2,
                    }}
                  />
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: Color.grayLight,
                      marginVertical: 2,
                    }}
                  />
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 15, marginBottom: 15 }}>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: Color.grayLighter,
                  borderRadius: 10,
                  paddingHorizontal: 15,
                }}
              >
                <View
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: Color.grayLight,
                    }}
                  />
                </View>
                <View style={{ flex: 1, height: 40, padding: 0 }} />
              </View>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 15,
              paddingTop: 10,
              borderTopColor: Color.borderColor,
              borderTopWidth: 1,
            }}
          >
            {/* <View style={{ flex: 1, flexDirection: 'row', marginBottom: 6, marginHorizontal: -3, justifyContent: 'space-between' }}>
              <View style={{ width: 50, height: 13, marginBottom: 4, marginTop: 1, marginHorizontal: 3, backgroundColor: Color.grayLighter, borderRadius: 4 }}></View>
              <View style={{ width: 80, height: 13, marginBottom: 4, marginTop: 1, marginHorizontal: 3, backgroundColor: Color.grayLighter, borderRadius: 4 }}></View>
            </View> */}
            <Button
              title=" "
              style={{
                flex: 1,
                backgroundColor: Color.grayLighter,
                elevation: 0,
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

export class DummyReviewFoodOrder extends Component {
  render() {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <View style={{ backgroundColor: Color.white }}>
          <View style={{ padding: 15 }}>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 15,
                alignItems: 'center',
              }}
            >
              <View>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 45 / 2,
                    backgroundColor: Color.grayLighter,
                  }}
                />
              </View>
              <View style={{ paddingHorizontal: 10, flex: 1 }}>
                <View
                  style={{
                    width: 90,
                    height: 12,
                    marginBottom: 4,
                    marginTop: 1,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: 180,
                    height: 13,
                    marginBottom: 4,
                    marginTop: 1,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
              </View>
              <View>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Fa
                    iconStyle="solid"
                    name="ellipsis-v"
                    color={Color.grayLighter}
                  />
                </View>
              </View>
            </View>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: Color.grayLighter,
                  borderRadius: 10,
                  paddingHorizontal: 15,
                }}
              >
                <View style={{ flex: 1, height: 40 }} />
              </View>
            </View>
          </View>
        </View>
        {/*  */}
        <View style={{ backgroundColor: Color.white }}>
          <View style={{ paddingHorizontal: 15 }}>
            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    width: 75,
                    height: 13,
                    marginBottom: 4,
                    marginTop: 1,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
            <DashLine />
          </View>
          <View>
            {/*  */}
            <View style={{ paddingHorizontal: 15, paddingVertical: 15 }}>
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 3,
                    backgroundColor: Color.grayLighter,
                  }}
                />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View
                    style={{
                      width: 100,
                      height: 15,
                      marginBottom: 10,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 75,
                      height: 15,
                      marginBottom: 4 + 6,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                  >
                    <View
                      style={{ marginHorizontal: -5, flexDirection: 'row' }}
                    >
                      <View
                        style={{
                          marginHorizontal: 5,
                          height: 30,
                          borderRadius: 3,
                          width: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: Color.grayLighter,
                        }}
                      />
                      <View
                        style={{
                          marginHorizontal: 5,
                          height: 30,
                          width: 90,
                          backgroundColor: Color.grayLighter,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 15, paddingVertical: 15 }}>
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 3,
                    backgroundColor: Color.grayLighter,
                  }}
                />
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <View
                    style={{
                      width: 100,
                      height: 15,
                      marginBottom: 10,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 75,
                      height: 15,
                      marginBottom: 4 + 6,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                  >
                    <View
                      style={{ marginHorizontal: -5, flexDirection: 'row' }}
                    >
                      <View
                        style={{
                          marginHorizontal: 5,
                          height: 30,
                          borderRadius: 3,
                          width: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: Color.grayLighter,
                        }}
                      />
                      <View
                        style={{
                          marginHorizontal: 5,
                          height: 30,
                          width: 90,
                          backgroundColor: Color.grayLighter,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {/*  */}
          </View>
        </View>
        {/*  */}
        <View style={{ backgroundColor: Color.white }}>
          <View style={{ paddingHorizontal: 15 }}>
            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    width: 85,
                    height: 13,
                    marginBottom: 4,
                    marginTop: 1,
                    backgroundColor: Color.grayLighter,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
            <DashLine />
          </View>
          <View style={{ paddingHorizontal: 15 }}>
            <View>
              <View style={{ paddingVertical: 15, paddingBottom: 9 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 6,
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      width: 85,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 55,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    marginBottom: 6,
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      width: 75,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 55,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
              <DashLine />
              <View style={{ paddingVertical: 15 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      width: 85,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                  <View
                    style={{
                      width: 55,
                      height: 15,
                      marginBottom: 4,
                      marginTop: 1,
                      backgroundColor: Color.grayLighter,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
}
