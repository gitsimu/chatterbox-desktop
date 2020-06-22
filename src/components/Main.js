import React from 'react'
import FirebaseConfig from '../firebase.config'
import * as firebase from "firebase/app"
import "firebase/auth"
import "firebase/database"
import axios from 'axios'

import { connect } from 'react-redux'
import { addUsers, clearUsers, selectedUser, signOut } from '../actions'

import UserList from './UserList'
import Chat from './Chat'
import Memo from './Memo'
import Info from './Info'
import Setting from './Setting'
import '../css/style.css'
import '../js/global.js'
import * as script from '../js/script.js'

const storage = require('electron-json-storage')
const USERS = []

function Main({ users, messages, settings, addUsers, clearUsers, selectedUser, signOut, ...props }) {
  const [screenState, setScreenState] = React.useState(0)
  const [tabState, setTabState] = React.useState(0)
  const [imageViewer, showImageViewer] = React.useState(null)
  const key = 'c1cd7759-9784-4fac-a667-3685d6b2e4a0'
  const isLoading = props.isLoading

  if (!firebase.apps.length) {
    firebase.initializeApp(FirebaseConfig)
  }
  const database = firebase.database()

  React.useEffect(() => {
    // simpleline icons
    let simplelineLink = document.createElement("link")
    simplelineLink.href = "https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.min.css"
    simplelineLink.rel = "stylesheet"
    simplelineLink.type = "text/css"
    document.querySelector('body').appendChild(simplelineLink)

    isLoading(true)

    // firebase
    getFirebaseAuthToken(key)
      .then(res => {
        const data = res.data
        if (data.result === 'success') {
          firebase.auth().signInWithCustomToken(data.token)
            .then(success => {
              isLoading(false)

              const chat = database.ref('/' + key + '/users').orderByChild('timestamp')
              chat.on('value', (snapshot) => {
                clearUsers()

                let items = []
                snapshot.forEach((childSnapshot) => {
                  items.push(childSnapshot)
                })

                items.reverse().forEach((childSnapshot) => { // order by desc
                  const k = childSnapshot.key
                  const v = childSnapshot.val()
                  const code = script.guestCodeGenerator(k)
                  addUsers({
                    key: k,
                    value: v,
                    guestCode: (v && v.nickname) ? v.nickname : code.guestCode,
                    colorCode: code.colorCode,
                  })

                  /* notification onClick 시 redux store에 있는 객체 접근을 하면 빈 값으로 나옴
                   * USERS 라는 전역변수를 별도로 두어 onClick 시 해당 유저를 찾을 수 있도록 함
                   */
                  USERS.push({
                    key: k,
                    value: v,
                    guestCode: (v && v.nickname) ? v.nickname : code.guestCode,
                    colorCode: code.colorCode,
                  })
                })
              })

              // https://www.electronjs.org/docs/tutorial/notifications?q=Notification
              // https://www.electronjs.org/docs/api/notification
              // https://snutiise.github.io/html5-desktop-api/
              const recent = database.ref('/' + key + '/recents')
              recent.on('value', (snapshot) => {
                const recentsData = snapshot.val()
                const notification = new Notification('새 메세지', {
                  body: recentsData.message,
                })

                notification.onclick = () => {
                  const target = USERS.filter((u) => { return u.key === recentsData.userId})
                  if (target.length > 0) {
                    setScreenState(0)
                    setTabState(target[0].value.state || 0)
                    selectedUser(target[0])
                  }
                }
              })
            })
            .catch(error => {
              isLoading(false)
              alert('인증에 실패하였습니다.')
            })
        }
      })
      .catch(error => {
        isLoading(false)
        alert('인증 서버에서 연결을 거부하였습니다.')
      })
  }, [])


  // React.useEffect(() => {
  // }, [users])

  return (
    <div className="App">
      <div className="main">
        <div className="container-menu card">
          <div
            className={screenState === 0 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(0) }}>
            <i className="icon-bubble"></i>
            <div className="tooltip">채팅 목록</div>
          </div>
          { false && (
          <div
            className={screenState === 1 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(1) }}>
            <i className="icon-user"></i>
            <div className="tooltip">유저 목록</div>
          </div>
          )}
          <div
            className={screenState === 2 ? "chat-lnb-item active" : "chat-lnb-item"}
            onClick={() => { setScreenState(2) }}>
            <i className="icon-settings"></i>
            <div className="tooltip">설정</div>
          </div>
          <div className="chat-lnb-item sign-out"
            onClick={() => {
              /* local storage*/
              storage.remove('userData', (err) => {
                if (err) throw err
                console.log('[ERROR] Local storage remove failure', err)
              })
              signOut()
            }}>
            <i className="icon-power"></i>
            <div className="tooltip">로그아웃</div>
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
                  tabState={tabState}
                  setTabState={setTabState}
                  showImageViewer={showImageViewer}/>
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
          <div></div>
        </div>
        <div className={ screenState === 2 ? "container-screen-2" : "container-screen-2 hide" }>
          <Setting
            database={database}
            isLoading={isLoading}/>
        </div>
      </div>

      { imageViewer !== null && (
        <div className="image-viewer">
          <div className="image-viewer-close"
            onClick={() => showImageViewer(null)}></div>
          <img src={imageViewer}/>
        </div>
      )}
    </div>
  )
}

const getFirebaseAuthToken = async (uuid) => {
  const res = await axios.post(global.serverAddress + '/api/auth', { uuid: uuid })
  return await res
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
  signOut: () => dispatch(signOut()),
})

// export default Main
export default connect(mapStateToProps, mapDispatchToProps)(Main)
