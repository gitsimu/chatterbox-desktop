const initialState = {
  key: '',
  userName: '',
  userToken: null, // 로그인용 토큰
  sessionToken: null, // api 통신용 세션 토큰
  sessionKey: null, // api 통신용 세션 키
  selectedUser: {},
}

const settings = (state = initialState, action) => {
  switch (action.type) {
    case 'INIT_SETTINGS':
      return {
        ...state,
        key: action.key,
      }
    case 'SELECTED_USER':
      return {
        ...state,
        selectedUser: action.user,
      }
    case 'SIGN_IN':
      return {
        ...state,
        key: action.key,
        userName: action.userName,
        userToken: action.userToken,
        sessionToken: action.sessionToken,
        sessionKey: action.sessionKey
      }
    case 'SIGN_OUT':
      return initialState
    case 'SESSION_RESTORE':
      return {
        ...state,
        sessionToken: action.sessionToken,
        sessionKey: action.sessionKey
      }
    default:
      return state
  }
}

export default settings
