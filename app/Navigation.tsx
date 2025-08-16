/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Scr Main
import SearchPlacesScreen from './screen/SearchPlaces';
import MapSelectingScreen from './screen/MapSelecting';
import SoonScreen from './screen/Soon';
import LoginScreen from './screen/Login';
import RegisterScreen from './screen/Register';
import ForgotScreen from './screen/ForgotPassword';
import BookingScreen from './screen/Booking';
import ChatScreen from './screen/Chat';
import OrderDetailsScreen from './screen/OrderDetails';

// Scr Food
import FoodScreen from './screen/food/Home';
import MerchantScreen from './screen/food/Merchant';
import OrderScreen from './screen/food/Order';
import ListMenuScreen from './screen/food/ListMenu';
import ListMerchantScreen from './screen/food/ListMerchant';
import SearchMenuScreen from './screen/food/SearchMenu';

// Scr Ride
import RideScreen from './screen/ride/Home';
import OverviewScreen from './screen/ride/Overview';

// Tab
import MainTab from './screen/Main';
import AccountTab from './screen/Account';
import HistoryTab from './screen/History';
import { JSX } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Color from './components/Color';
import CustomTabBar from './components/CustomTabBar';

const Tab = createBottomTabNavigator();

// Define the bottom tab navigation (used for Main)
function MainScreen() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={MainTab} />
      <Tab.Screen name="History" component={HistoryTab} />
      <Tab.Screen name="Settings" component={AccountTab} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export default function Navigation(): JSX.Element {
  
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Color.white,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Forgot" component={ForgotScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Ride" component={RideScreen} />
          <Stack.Screen name="SearchMenu" component={SearchMenuScreen} />
          <Stack.Screen name="Overview" component={OverviewScreen} />
          <Stack.Screen name="Food" component={FoodScreen} />
          <Stack.Screen name="Merchant" component={MerchantScreen} />
          <Stack.Screen name="Order" component={OrderScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          <Stack.Screen name="ListMenu" component={ListMenuScreen} />
          <Stack.Screen name="ListMerchant" component={ListMerchantScreen} />
          <Stack.Screen name="MapSelecting" component={MapSelectingScreen} />
          <Stack.Screen name="SearchPlaces" component={SearchPlacesScreen} />
          <Stack.Screen name="Soon" component={SoonScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
