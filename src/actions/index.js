export const addUsers = users => ({
  type: 'ADD_USERS',
  users
})

export const clearUsers = () => ({
  type: 'CLEAR_USERS',
})

export const addMessages = messages => ({
  type: 'ADD_MESSAGES',
  key: messages.key,
  value: messages.value,
})

export const initSettings = settings => ({
  type: 'INIT_SETTINGS',
  key: settings.key,
})

export const selectedUser = user => ({
  type: 'SELECTED_USER',
  user
})
