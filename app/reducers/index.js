import { combineReducers } from 'redux'

import userReducer from './user.reducer'
import locationReducer from './location.reducer'
import { persistReducer } from 'redux-persist'
import persistConfig from '../persistConfig'

const appReducer = combineReducers({
  userReducer,
  locationReducer
})

const rootReducer = persistReducer(persistConfig, appReducer)

export default rootReducer