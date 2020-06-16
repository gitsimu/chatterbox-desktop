import { combineReducers } from 'redux'
import users from './users'
import messages from './messages'
import settings from './settings'

export default combineReducers({
  users,
  messages,
  settings,
})
