/* users */
export const initUsers = users => ({
  type: 'INIT_USERS',
  users
})

export const addUsers = users => ({
  type: 'ADD_USERS',
  users
})

export const clearUsers = () => ({
  type: 'CLEAR_USERS'
})

export const changeUserState = users => ({
  type: 'CHANGE_USER_STATE',
  key: users.key,
  state: users.state
})

export const initUserState = () => ({
  type: 'INIT_USER_STATE',
})

/* messages */
export const pagingMessages = messagesList => ({
  type: 'PAGING_MESSAGES',
  key: messagesList.key,
  value: messagesList.value
})

export const initMessages = messagesList => ({
  type: 'INIT_MESSAGES',
  key: messagesList.key,
  value: messagesList.value
})

export const addMessages = messages => ({
  type: 'ADD_MESSAGES',
  key: messages.key,
  value: messages.value
})

export const deleteMessages = messages => ({
  type: 'DELETE_MESSAGES',
  key: messages.key
})

export const clearMessages = () => ({
  type: 'CLEAR_MESSAGES'
})

/* settings */
export const initSettings = settings => ({
  type: 'INIT_SETTINGS',
  key: settings.key
})

export const signIn = settings => ({
  type: 'SIGN_IN',
  key: settings.key,
  userName: settings.userName,
  userToken: settings.userToken,
  sessionToken: settings.sessionToken,
  sessionKey: settings.sessionKey
})

export const signOut = () => ({
  type: 'SIGN_OUT'
})

export const sessionRestore = settings => ({
  type: 'SESSION_RESTORE',
  sessionToken: settings.sessionToken,
  sessionKey: settings.sessionKey
})

export const selectedUser = user => ({
  type: 'SELECTED_USER',
  user
})
