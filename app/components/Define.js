import { Dimensions } from 'react-native';
import Config from 'react-native-config';
const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
export const LATITUDE_DELTA = 0.02;
// export const LATITUDE_DELTA = 0.0922
export const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
export const NODE_APP_URL = Config.NODE_APP_URL;
export const HOST_REST_API = Config.WEB_API_URL;
export const GOOGLE_MAPS_API_KEY = Config.GOOGLE_MAPS_API_KEY;
export const WEB_APP_HOST = Config.WEB_APP_HOST