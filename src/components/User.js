import React from 'react';
import { connect } from 'react-redux';
import { selectedUser, addMessages } from '../actions'
import * as script from '../js/script.js';

const User = ({ messages, settings, addMessages, selectedUser, ...props }) => {
  const userInfo = props.data.value;
  const lastMessage = (userInfo && userInfo.lastMessage) ? userInfo.lastMessage : '';
  const dateTime = (userInfo && userInfo.timestamp) ? userInfo.timestamp : null;

  const guestCode = props.data.guestCode;
  const colorCode = props.data.colorCode;

  // console.log('user', props.data)

  React.useEffect(() => {

  }, [])

  // const firebaseConnect = (userid) => {
  //   console.log('firebase connect', userid);
  //   if (userid && !messages[userid]) {
  //     const database = props.database;
  //     const databaseRef = '/' + settings.key + '/messages/' + userid;
  //
  //     const chat = database.ref(databaseRef).orderByChild('timestamp');
  //     chat.on('child_added', function(snapshot) {
  //       addMessages({ key: userid, value: snapshot.val() });
  //     });
  //   }
  // }

  return (
    <div
      className={settings.selectedUser.key === props.data.key ? 'chat-user active' : 'chat-user'}
      onClick={() => {
        selectedUser(props.data);
        // firebaseConnect(props.data.key);
      }}>

      <div className="chat-user-icon">
        <div style={{ backgroundColor: colorCode }}>
          <div className="bubble"></div>
        </div>
      </div>
      <div className="chat-user-info">
        <div className="chat-user-name">{ guestCode }</div>
        <div className="chat-user-detail">
          <div className="chat-user-message">{ lastMessage }</div>
          { dateTime && (
            <>            
            <div className="chat-user-datetime">{ script.getNiceTime(dateTime, new Date(), 1, true) }</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  messages: state.messages,
  settings: state.settings,
})
const mapDispatchToProps = dispatch => ({
  addMessages: m => dispatch(addMessages(m)),
  selectedUser: u => dispatch(selectedUser(u)),
})

// export default User
export default connect(mapStateToProps, mapDispatchToProps)(User);
