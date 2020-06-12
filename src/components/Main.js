import React from 'react';
import FirebaseConfig from '../firebase.config';
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import axios from 'axios';

import UserList from './UserList';
import Chat from './Chat';
import Memo from './Memo';
import Info from './Info';
import Setting from './Setting';
import '../css/style.css';
import '../js/global.js'

const USERS = [];
const initialState = {users: []};

function reducer(state, action) {
    switch (action.type) {
      case 'addUser':
        return {users: [...state.users, action.users]}
      case 'clearUser':
        return {users: []}
      default:
        throw new Error();
    }
}

function Main(props) {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [selectedUser, setSelectedUser] = React.useState('');
  const [screenState, setScreenState] = React.useState(0);
  const [tabState, setTabState] = React.useState(0);
  const key = props.userToken;
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

    // firebase
    getFirebaseAuthToken(key)
      .then(res => {
        const data = res.data;
        if (data.result === 'success') {
          firebase.auth().signInWithCustomToken(data.token)
            .then(success => {
              const chat = database.ref(databaseUserRef).orderByChild('timestamp');
              chat.on('value', function(snapshot) {
                dispatch({ type: 'clearUser' })

                let items = [];
                snapshot.forEach(function (childSnapshot) {
                  items.push(childSnapshot);
                });

                items.reverse().forEach(function (childSnapshot) { // order by desc
                  dispatch({
                    type: 'addUser',
                    users: {
                      key: childSnapshot.key,
                      value: childSnapshot.val(),
                    }
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
                    setSelectedUser(target[0].key);
                  }
                }
              })
            })
            .catch(error => {
              alert('인증에 실패하였습니다.');
            });
        }
      })
      .catch(error => {
        alert('인증 서버가 동작하지 않습니다.');
      })
  }, [])

  return (
    <div className="App">
      <div className="main">
        <div className="container-menu card">
          <div
            className={screenState === 0 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(0); }}>
            <i className="icon-bubble"></i>
          </div>
          <div
            className={screenState === 1 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(1); }}>
            <i className="icon-user"></i>
          </div>
          <div
            className={screenState === 2 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(2); }}>
            <i className="icon-settings"></i>
          </div>
        </div>

        <div className={ screenState === 0 ? "container-screen-0" : "container-screen-0 hide" }>
          <div className="container-center">
            <div className="chat-list card">
              <UserList
                users={state.users}
                tabState={tabState}
                setTabState={setTabState}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}/>
            </div>
            <div className="chat-body">
              {(selectedUser && selectedUser != '') && (
                <Chat
                  keycode={key}
                  userid={selectedUser}
                  database={database}
                  databaseRef={databaseMessageRef}
                  tabState={tabState}
                  setTabState={setTabState}
                  users={state.users}
                  isLoading={isLoading}/>
              )}
            </div>
            <div className="chat-options">
            </div>
          </div>
          <div className="container-right">
            <Memo
              users={state.users}
              keycode={key}
              userid={selectedUser}
              database={database}/>
            <Info
              users={state.users}
              keycode={key}
              userid={selectedUser}
              database={database}/>
          </div>
        </div>

        <div className={ screenState === 1 ? "container-screen-1" : "container-screen-1 hide" }>
        </div>
        <div className={ screenState === 2 ? "container-screen-2" : "container-screen-2 hide" }>
          <Setting
            keycode={key}
            userid={selectedUser}
            database={database}/>
        </div>
      </div>
    </div>
  );
}

const getFirebaseAuthToken = async (uuid) => {
  const res = await axios.post(global.serverAddress + '/api/auth', { uuid: uuid })
  return await res;
}

export default Main;
