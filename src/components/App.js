import React from 'react'
import axios from 'axios'

import { connect } from 'react-redux'
import { signIn } from '../actions'

import Main from './Main'
import '../css/App.css'

// 내부 스토리지 관리
const storage = require('electron-json-storage')

// URL을 OS 기본 브라우저로 열기위한 shell
// https://github.com/electron/electron/blob/master/docs/api/shell.md#shellopenexternalurl
const { shell } = require('electron')

function App({ settings, signIn }) {
  //
  let id, pw
  const [loading, isLoading] = React.useState(false)

  React.useEffect(() => {
    // simpleline icons
    let simmplelineLink = document.createElement("link")
    simmplelineLink.href = "https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.min.css"
    simmplelineLink.rel = "stylesheet"
    simmplelineLink.type = "text/css"
    document.querySelector('body').appendChild(simmplelineLink)

    storage.get('userData', (err, data) => {
      if (data && data.id && data.pw) {
        signInProcess(data.id, data.pw)
        console.log('storage data', data)
      }
    })
  }, [])

  const signInProcess = (id, pw) => {
    if (!id || id === '') { alert('아이디를 입력해주세요.'); return }
    if (!pw || pw === '') { alert('비밀번호를 입력해주세요.'); return }

    const token = 'c1cd7759-9784-4fac-a667-3685d6b2e4a0'
    storage.set('userData', { token: token, id: id, pw: pw }, () => {
      signIn({ key: token })
    })
    // signIn({ key: token })
  }

  return (
    <>
    { !settings.key ? (
      <div className="app">
        <div className="app-container card">
          <div className="app-title">
            실시간채팅 로그인
          </div>

          <div className="app-input">
            <div className="app-input-item">
              <span>아이디</span>
              <input type="text" ref={node => id = node}/>
            </div>
            <div className="app-input-item">
              <span>비밀번호</span>
              <input type="password"
                ref={node => pw = node}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    signInProcess(id.value, pw.value)
                  }
                }}/>
            </div>
          </div>
          <div
            className="app-button-login"
            onClick={() => {
              signInProcess(id.value, pw.value)
            }}>
            <div>로그인</div>
          </div>
          <div className="app-options">
            <a onClick={() => {
              if (typeof(shell) === "object") {
                shell.openExternal('https://smlog.co.kr/member/member_join_check.htm')
              }
            }}>회원가입</a>
            <a onClick={() => {
              if (typeof(shell) === "object") {
                shell.openExternal('https://smlog.co.kr/member/id_pass.htm')
              }
            }}>아이디/비밀번호 찾기</a>
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
    </>
  )
}

// shell을 사용하여 새 브라우저창에 띄움
// <a onClick={() => {
//   if (typeof(shell) === "object") {
//     shell.openExternal('https://smlog.co.kr/member/member_join_check.htm')
//   }
// }}>회원가입</a>
// <a onClick={() => {
//   if (typeof(shell) === "object") {
//     shell.openExternal('https://smlog.co.kr/member/id_pass.htm')
//   }
// }}>아이디/비밀번호 찾기</a>

const mapStateToProps = state => ({
  settings: state.settings,
})

const mapDispatchToProps = dispatch => ({
  signIn: s => dispatch(signIn(s)),
})

// export default App
export default connect(mapStateToProps, mapDispatchToProps)(App)
