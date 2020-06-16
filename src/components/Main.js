import React from 'react';
import FirebaseConfig from '../firebase.config';
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import axios from 'axios';

import { connect } from 'react-redux'
import { addUsers, clearUsers, selectedUser } from '../actions'

import UserList from './UserList';
import Chat from './Chat';
import Memo from './Memo';
import Info from './Info';
import Setting from './Setting';
import '../css/style.css';
import '../js/global.js'
import * as script from '../js/script.js';

const USERS = [];

function Main({ users, messages, settings, addUsers, clearUsers, selectedUser, ...props }) {
  const [screenState, setScreenState] = React.useState(0);
  const [tabState, setTabState] = React.useState(0);
  const key = 'c1cd7759-9784-4fac-a667-3685d6b2e4a0';
  const isLoading = props.isLoading;

  if (!firebase.apps.length) {
    firebase.initializeApp(FirebaseConfig);
  }
  const database = firebase.database();
  const databaseUserRef = '/' + key + '/users';
  const databaseMessageRef = '/' + key + '/messages';
  const databaseRecentRef = '/' + key + '/recents';

  React.useEffect(() => {
    // simpleline icons
    let simmplelineLink = document.createElement("link");
    simmplelineLink.href = "https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.min.css";
    simmplelineLink.rel = "stylesheet";
    simmplelineLink.type = "text/css";
    document.querySelector('body').appendChild(simmplelineLink);

    isLoading(true);

    // firebase
    getFirebaseAuthToken(key)
      .then(res => {
        const data = res.data;
        if (data.result === 'success') {
          firebase.auth().signInWithCustomToken(data.token)
            .then(success => {
              isLoading(false);

              const chat = database.ref(databaseUserRef).orderByChild('timestamp');
              chat.on('value', function(snapshot) {
                clearUsers();

                let items = [];
                snapshot.forEach((childSnapshot) => {
                  items.push(childSnapshot);
                });

                items.reverse().forEach((childSnapshot) => { // order by desc
                  const k = childSnapshot.key;
                  const v = childSnapshot.val();
                  const code = script.guestCodeGenerator(k);
                  addUsers({
                    key: k,
                    value: v,
                    guestCode: (v && v.nickname) ? v.nickname : code.guestCode,
                    colorCode: code.colorCode,
                  })

                  // global
                  USERS.push({
                    key: childSnapshot.key,
                    value: childSnapshot.val(),
                  })
                });
              })

              // https://www.electronjs.org/docs/tutorial/notifications?q=Notification
              // https://www.electronjs.org/docs/api/notification
              // https://snutiise.github.io/html5-desktop-api/
              const recent = database.ref(databaseRecentRef);
              recent.on('value', function(snapshot) {
                const recentsData = snapshot.val();
                const notification = new Notification('새 메세지', {
                  body: recentsData.message,
                })

                notification.onclick = () => {
                  const target = USERS.filter((u) => { return u.key === recentsData.userId})
                  if (target.length > 0) {
                    setScreenState(0);
                    setTabState(target[0].value.state ? target[0].value.state : 0);
                    selectedUser(target[0])
                  }
                }
              })
            })
            .catch(error => {
              isLoading(false);
              alert('인증에 실패하였습니다.');
            });
        }
      })
      .catch(error => {
        isLoading(false);
        alert('인증 서버가 동작하지 않습니다.');
      })
  }, [])

  React.useEffect(() => {

  }, [users]);

  return (
    <div className="App">
      <div className="main">
        <div className="container-menu card">
          <div
            className={screenState === 0 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(0); }}>
            <i className="icon-bubble"></i>
            <tooltip>채팅 목록</tooltip>
          </div>
          <div
            className={screenState === 1 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(1); }}>
            <i className="icon-user"></i>
            <tooltip>유저 목록</tooltip>
          </div>
          <div
            className={screenState === 2 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(2); }}>
            <i className="icon-settings"></i>
            <tooltip>설정</tooltip>
          </div>
          <div className="chat-lnb-item sign-out">
            <i className="icon-power"></i>
            <tooltip>로그아웃</tooltip>
          </div>
        </div>

        <div className={ screenState === 0 ? "container-screen-0" : "container-screen-0 hide" }>
          <div className="container-center">
            <div className="chat-list card">
              <UserList
                database={database}
                tabState={tabState}
                setTabState={setTabState}/>
            </div>
            <div className="chat-body">
              {(settings.selectedUser && settings.selectedUser.key) && (
                <Chat
                  database={database}
                  databaseRef={databaseMessageRef}
                  tabState={tabState}
                  setTabState={setTabState}
                  isLoading={isLoading}/>
              )}
            </div>
            <div className="chat-options">
            </div>
          </div>
          <div className="container-right">
            <Memo database={database}/>
            <Info database={database}/>
          </div>
        </div>

        <div className={ screenState === 1 ? "container-screen-1" : "container-screen-1 hide" }>
        </div>
        <div className={ screenState === 2 ? "container-screen-2" : "container-screen-2 hide" }>
          <Setting database={database}/>
        </div>
      </div>
    </div>
  );
}

const getFirebaseAuthToken = async (uuid) => {
  const res = await axios.post(global.serverAddress + '/api/auth', { uuid: uuid })
  return await res;
}

const mapStateToProps = state => ({
  users: state.users,
  messages: state.messages,
  settings: state.settings,
})

const mapDispatchToProps = dispatch => ({
  addUsers: u => dispatch(addUsers(u)),
  clearUsers: () => dispatch(clearUsers()),
  selectedUser: u => dispatch(selectedUser(u)),
})

// export default Main;
export default connect(mapStateToProps, mapDispatchToProps)(Main);
