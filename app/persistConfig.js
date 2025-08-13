import AsyncStorage from "@react-native-async-storage/async-storage"

export const REDUX_KEY_NAME = 'copekLegacyReduxKeyName'

const persistConfig = {
  key: REDUX_KEY_NAME,
  storage: AsyncStorage
}

export default persistConfig