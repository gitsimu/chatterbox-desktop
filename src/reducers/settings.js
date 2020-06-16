const initialState = {
  key: '',
  selectedUser: {},
};

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
      };
    default:
      return state
  }
}

export default settings
