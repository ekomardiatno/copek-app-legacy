import {
  DATA_PLACES
} from '../actions/locations.actions'
 
const initialState = {
  places: []
}

const locationReducer = (state = initialState, action) => {
  switch(action.type) {
    case DATA_PLACES:
      return {
        ...state,
        places: action.payload
      }
    default:
      return state
  }
}

export default locationReducer