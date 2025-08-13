import { FETCH_USERS } from '../actions/users.actions'

let initialState = []

const userReducer = (state = initialState, action) => {
  switch(action.type) {
    case FETCH_USERS:
      return action.payload
    default:
      return state
  }
}

export default userReducer