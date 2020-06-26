import React from 'react'
// import axios from 'axios'

import { connect } from 'react-redux'
import { signIn } from '../actions'

import Main from './Main'
import '../css/App.css'

/* 내부 스토리지 관리 */
const storage = require('electron-json-storage')

/* URL을 OS 기본 브라우저로 열기위한 shell
 * https://github.com/electron/electron/blob/master/docs/api/shell.md#shellopenexternalurl
 */
const { shell } = require('electron')

function App({ settings, signIn }) {  
  const [id, setId] = React.useState('')
  const [pw, setPw] = React.useState('')
  const [loading, isLoading] = React.useState(false)
  const [mainTheme, setMainTheme] = React.useState('chatterbox-theme-light')

  /* simpleline icons */
  React.useEffect(() => {
    let simmplelineLink = document.createElement("link")
    simmplelineLink.href = "https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.min.css"
    simmplelineLink.rel = "stylesheet"
    simmplelineLink.type = "text/css"
    document.querySelector('body').appendChild(simmplelineLink)

    /* Main theme */
    storage.get('mainTheme', (err, data) => {           
      if (data.type) {
        setMainTheme(data.type)
      }
    })
  }, [])

  const signInProcess = React.useCallback((id, pw) => {
    if (!id || id === '') {
      alert('아이디를 입력해주세요.')
      return
    } else if (!pw || pw === '') {
      alert('비밀번호를 입력해주세요.')
      return
    }

    const token = 'c1cd7759-9784-4fac-a667-3685d6b2e4a0'
    storage.set('userData', { token: token, id: id, pw: pw }, () => {
      signIn({ key: token })
    })
  }, [signIn])

  /* 첫 렌더링 시 local storage를 확인
   * id/pw/token 값이 존자해면 바로 로그인한다
   */
  React.useEffect(() => {
    storage.getMany(['userData', 'autoSignin'], (err, data) => {      
      if (!data.autoSignin.allowed) return
      else if (data.userData && data.userData.id && data.userData.pw) {
        signInProcess(data.userData.id, data.userData.pw)
        console.log('storage data', data)
      }
    })
  }, [signInProcess])

  return (
    <div id="container" className={mainTheme}>
    { !settings.key ? (
      <div className="app">
        <div className="app-container card">
          <div className="app-title">
            실시간채팅 로그인
          </div>

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
    ) : (
      <Main isLoading={isLoading}/>
    )}

    { loading && (
      <div id="loading"><div></div></div>
    )}
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
