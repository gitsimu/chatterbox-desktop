import React from 'react'
import FirebaseConfig from '../firebase.config'
import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import axios from 'axios'
import { ipcRenderer } from 'electron'

import { connect } from 'react-redux'
import { clearUsers, initUsers, selectedUser, signOut } from '../actions'

import UserList from './UserList'
import Chat from './Chat'
import Memo from './Memo'
import Info from './Info'
import Setting from './Setting'
import '../css/style.css'
import '../css/theme.scss'
import '../js/global.js'
import * as script from '../js/script.js'

const storage = require('electron-json-storage')
const USERS = []

function Main({ users, settings, initUsers, clearUsers, selectedUser, signOut, ...props }) {
  const [screenState, setScreenState] = React.useState(0)
  const [tabState, setTabState] = React.useState(0)
  const [imageViewer, showImageViewer] = React.useState(null)

  const Alert = props.Alert
  const isLoading = props.isLoading

  if (!firebase.apps.length) {
    firebase.initializeApp(FirebaseConfig)
  }
  const database = firebase.database()


  React.useEffect(() => {
    const onImageViewKey = (event) => {
      if (event.code === 'KeyS' && event.ctrlKey) {
        ipcRenderer.send('download', {
          url: imageViewer
        })
        return
      }

      if (event.code === 'Escape') {
        showImageViewer(null)
      }
    }

    if (imageViewer !== null) {
      document.addEventListener('keydown', onImageViewKey)
    } else {
      document.removeEventListener('keydown', onImageViewKey)
    }

    return () => {
      document.removeEventListener('keydown', onImageViewKey)
    }
  }, [imageViewer, showImageViewer])

  React.useEffect(() => {
    ipcRenderer.on('download-complete', (event, file) => {
      Alert('다운로드가 완료되었습니다.')
    })

    return () => {
      ipcRenderer.removeAllListeners('download-complete')
    }
  }, [Alert])

  React.useEffect(() => {
    let chat
    // simpleline icons
    let simplelineLink = document.createElement('link')
    simplelineLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.min.css'
    simplelineLink.rel = 'stylesheet'
    simplelineLink.type = 'text/css'
    document.querySelector('body').appendChild(simplelineLink)

    // firebase
    Promise.resolve()
      .then(() => { isLoading(true) })
      .then(() => {
        return getFirebaseAuthToken(settings.key)
          .then(({data})=> {
            if(data.result !== 'success') throw new Error()
            return data
          })
          .catch(() => { throw new Error('인증 서버에서 연결을 거부하였습니다.')})
      })
      .then((data) => {
        return firebase.auth().signInWithCustomToken(data.token)
          .catch(() => { throw new Error('인증에 실패하였습니다.')})
      })
      .then(() => {
        chat = database.ref(`/${settings.key}/users`)
          .orderByChild('timestamp')
        chat.on('value', (snapshot) => {
          clearUsers()
          USERS.length = 0

          let items = []
          snapshot.forEach((childSnapshot) => {
            items.push(childSnapshot)
          })

          const users = items.reverse().map((childSnapshot) => { // order by desc
            const k = childSnapshot.key
            const v = childSnapshot.val()
            const code = script.guestCodeGenerator(k)

            return {
              key: k,
              value: v,
              guestCode: (v && v.nickname)
                ? v.nickname
                : code.guestCode,
              colorCode: code.colorCode
            }
          })

          initUsers(users)

          /* notification onClick 시 redux store에 있는 객체 접근을 하면 빈 값으로 나옴
           * USERS 라는 전역변수를 별도로 두어 onClick 시 해당 유저를 찾을 수 있도록 함
           */
          USERS.push(users)
        })

        // https://www.electronjs.org/docs/tutorial/notifications?q=Notification
        // https://www.electronjs.org/docs/api/notification
        // https://snutiise.github.io/html5-desktop-api/
        const recent = database.ref(`/${settings.key}/recents`)
        recent.on('value', (snapshot) => {
          // GET PUSH ALARM, AUDIO BEEP
          storage.getMany(['pushAlram', 'audioBeep'], (err, data) => {
            if (!data.pushAlram.allowed) { return }

            const recentsData = snapshot.val()
            const message = recentsData.type === 2
              ? JSON.parse(recentsData.message).name
              : recentsData.message
            const notification = new Notification('새 메세지', {
              body: message,
              silent: !data.audioBeep.allowed
            })
            notification.onclick = () => {
              const target = USERS.filter(
                (u) => { return u.key === recentsData.userId})
              if (target.length > 0) {
                setScreenState(0)
                setTabState(target[0].value.state || 0)
                selectedUser(target[0])
              }
            }
          })
        })
      })
      .catch((error) => error.messages && Alert(error.messages))
      .finally(() => isLoading(false))

  }, [initUsers, clearUsers, database, isLoading, selectedUser, settings.key, Alert])

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
              /* local storage */
              storage.remove('userData', (err) => {
                if (err) {
                  console.log('[ERROR] Local storage remove failure', err)
                  throw err
                }
              })
              signOut()
              props.isSignInRequired(true)
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
                  Alert={Alert}
                  setTabState={setTabState}
                  showImageViewer={showImageViewer}/>
              )}
            </div>
            <div className="chat-options">
            </div>
          </div>
          <div className="container-right">
            <Memo database={database} Alert={Alert}/>
            <Info database={database} Alert={Alert}/>
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
               onClick={() => showImageViewer(null)}>
          </div>
          <div className="image-viewer-save"
               onClick={() => ipcRenderer.send('download', {
                 url: imageViewer
               })}>
            <i className="icon-arrow-down-circle"></i>
          </div>
          <img src={imageViewer} alt="imageViewer"/>
        </div>
      )}
    </div>
  )
}

const getFirebaseAuthToken = async (uuid) => {
  return await axios.post(`${global.serverAddress}/api/auth`, { uuid: uuid })
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings
})

const mapDispatchToProps = dispatch => ({
  initUsers: u => dispatch(initUsers(u)),
  clearUsers: () => dispatch(clearUsers()),
  selectedUser: u => dispatch(selectedUser(u)),
  signOut: () => dispatch(signOut())
})

// export default Main
export default connect(mapStateToProps, mapDispatchToProps)(Main)
