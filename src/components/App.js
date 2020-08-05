import React from 'react'
import { connect } from 'react-redux'
import { signIn } from '../actions'
import Main from './Main'
import '../css/App.css'
import '../css/alert.scss'
import '../js/global.js'
import * as smlog from '../js/smlog'

/* 내부 스토리지 관리 */
import storage from 'electron-json-storage'

/* URL을 OS 기본 브라우저로 열기위한 shell
 * https://github.com/electron/electron/blob/master/docs/api/shell.md#shellopenexternalurl
 */
import { shell, ipcRenderer } from 'electron'
const os = require('os')

function App({ settings, signIn }) {  
  const [id, setId] = React.useState('')
  const [pw, setPw] = React.useState('')
  const [loading, isLoading] = React.useState(false)
  const [mainTheme, setMainTheme] = React.useState('chatterbox-theme-light')
  const [deviceId, setDeviceId] = React.useState('')
  const [alertDialog, showAlertDialog] = React.useState(null)
  const [signInRequired, isSignInRequired] = React.useState(null)
  
  React.useEffect(() => {
    /* Main theme / device */
    storage.getMany(['mainTheme', 'device'], (err, data) => {           
      if (data.mainTheme.type) {
        setMainTheme(data.mainTheme.type)
      }
      if (data.device.id) {
        setDeviceId(data.device.id)
      } else {
        const newId = uuidv4()
        storage.set('device', {id: newId}, () => {              
          setDeviceId(newId)
        })
      }
    })

    ipcRenderer.on('download_complete', (event, file) => {
      ipcRenderer.removeAllListeners('download_complete')
      console.log('download_complete', file); // Full file path
    })

    ipcRenderer.on("download progress", (event, progress) => {
      console.log(progress); // Progress in fraction, between 0 and 1
      const progressInPercentages = progress * 100; // With decimal point and a bunch of numbers
      const cleanProgressInPercentages = Math.floor(progress * 100); // Without decimal point
      console.log('progressInPercentages', progressInPercentages) 
      console.log('cleanProgressInPercentages', cleanProgressInPercentages) 
    })
  }, [])

  const Alert = React.useCallback((message) => {
    const alertHtml = 
      <div id="Alert">
        <div id="AlertBody" className="alert-dialog">
          <div className="alert-top">
            <div id="AlertMessage" className="alert-message">{message}</div>
          </div>
          <div className="alert-bottom">
            <div className="alert-buttons">
              <div onClick={() => showAlertDialog(null)}>OK</div>
            </div>
          </div>
        </div>
      </div>
    showAlertDialog(alertHtml)
  }, [])

  const signInProcessByToken = React.useCallback(async (userName, userToken, key) => {
    isLoading(true)
    const req = {
      method: 'login_pc_by_token',
      login_member_id: userName,
      login_token: userToken
    }
    smlog.AUTH(req)
      .then(async data => {
        console.log('signInProcessByToken', req, data)
        if (data.code === '1') {      
          const response = {
            pc_id: deviceId,
            userName: data.member_id,
            userToken: userToken,
            sessionToken: data.member_token,
            sessionKey: data.sskey,
            key: data.chat_id
          }    
          signIn(response)
        } else {
          initSignin()
        }
        isLoading(false)
      })
  }, [deviceId, signIn])

  const signInProcess = React.useCallback(async (id, pw) => {
    if (!id || id === '') {
      initSignin()
      Alert('아이디를 입력해주세요.')
      return
    } else if (!pw || pw === '') {
      initSignin()
      Alert('비밀번호를 입력해주세요.')
      return
    }    

    isLoading(true)

    const req = {
      method: 'login_app',
      member_id: id,
      password: pw
    }
    smlog.AUTH(req)
      .then(async data => {
        if (data.code === '1') {
          const device = `${os.type()} ${os.release()} ${os.platform()}`
          const userToken = await initUserInfo(deviceId, data.chat_id, device, data.sskey, data.member_token, data.member_id)
          const response = {
            pc_id: deviceId,
            userName: data.member_id,            
            userToken: userToken,
            sessionToken: data.member_token,
            sessionKey: data.sskey,
            key: data.chat_id
          }
          storage.set('userData', response, () => {     
            console.log('set userData', response)         
            signIn(response)
            isLoading(false)
          })
        } else {
          Alert('사용자 정보가 없습니다.\n관리자에게 문의해주세요.')
          initSignin()
          isLoading(false)
        }
      })
      .catch(err => {
        Alert('로그인에 실패하였습니다.\n관리자에게 문의해주세요.')
        initSignin()
        isLoading(false)
      })
  }, [Alert, signIn, deviceId])

  const initUserInfo = async (pc_id, chat_id, os, sskey, member_token, member_id) => {
    let body = ''
    const req = {
      method: 'insert_user_pc_info',
      pc_id: pc_id,
      chat_id: chat_id,
      os: os,
      sskey: sskey,
      member_token: member_token,
      member_id: member_id,
    }
    Object.keys(req).forEach((o, i) => {
      body += `${o}=${Object.values(req)[i]}&`
    })

    const postResponse = await fetch(`${global.server.api}`, {
      method: 'POST',
      dataType: 'json',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: body.slice(0, -1)
    })
  
    const postData = await postResponse.text()
    return postData
  }

  const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      // eslint-disable-next-line no-mixed-operators
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 3 | 8);
      return v.toString(16);
    });
  }

  const initSignin = () => {
    storage.remove('userData')
    isLoading(false)
    isSignInRequired(true)
  }

  /* 첫 렌더링 시 local storage를 확인
   * id/pw/token 값이 존자해면 바로 로그인한다
   */
  React.useEffect(() => {    
    storage.getMany(['userData', 'autoSignin'], async (err, data) => {    
      const d = data.userData
      if (data.autoSignin.allowed && d && d.userName && d.userToken) {                
        await signInProcessByToken(d.userName, d.userToken, d.key)
      } else {
        isSignInRequired(true)
      }
    })
  }, [signInProcessByToken])

  // React.useEffect(() => {
  //   isSignInRequired(!settings.key || settings.key === '')
  // }, [settings.key])

  return (
    <div id="container" className={mainTheme}>
    
    { (!settings.key && signInRequired) && (
      <div className="app">
        {/* <div className="app-logo">
          <img src="/logo_smlog.png" alt="logo_smlog"></img>
        </div> */}
        <div className="app-container card">
          {/* <div className="app-title">
            로그인
          </div> */}
          <img src="./logo_smlog.png" alt="logo_smlog" style={{height: 50, marginTop: 20, marginBottom: 20}}></img>
          <div className="app-input">
            <div className="app-input-item">
              <span>아이디</span>
              <input type="text" value={id} onChange={e => setId(e.target.value)}/>
            </div>
            <div className="app-input-item">
              <span>비밀번호</span>
              <input type="password"
                value={pw} 
                onChange={e => setPw(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    signInProcess(id, pw)
                  }
                }}/>
            </div>
          </div>
          <div
            className={(id !== '' && pw !== '') ? "app-button-login active" : "app-button-login"}
            onClick={() => {
              signInProcess(id, pw)
            }}>
            <div>로그인</div>
          </div>
          <div className="app-options">
            <div onClick={() => {
              if (typeof(shell) === "object") {
                shell.openExternal('https://smlog.co.kr/member/member_join_check.htm')
              }
            }}>회원가입</div>
            <div onClick={() => {
              if (typeof(shell) === "object") {
                shell.openExternal('https://smlog.co.kr/member/id_pass.htm')
              }
            }}>아이디/비밀번호 찾기</div>
          </div>
        </div>
        <div className="app-copyright">
          COPYRIGHT (C) Creative Soft. All Rights reserved.
        </div>
      </div>    
    )}

    {(settings.key) && (
      <Main isLoading={isLoading} Alert={Alert} isSignInRequired={isSignInRequired} setMainTheme={setMainTheme}/>
    )}

    { loading && (
      <div id="loading"><div></div></div>
    )}

    { alertDialog && (alertDialog)}
      
    </div>
  )
}

const mapStateToProps = state => ({
  settings: state.settings
})

const mapDispatchToProps = dispatch => ({
  signIn: s => dispatch(signIn(s))
})

// export default App
export default connect(mapStateToProps, mapDispatchToProps)(App)
