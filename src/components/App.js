import React from 'react';
import axios from 'axios';

import Main from './Main';
import '../css/App.css';

// import UserList from './UserList';
// import Chat from './Chat';
// import '../js/global.js'

// const storage = require('electron-json-storage');

function App() {
  //
  let id, pw
  const [userToken, setUserToken] = React.useState(null);
  const [loading, isLoading] = React.useState(false);

  React.useEffect(() => {
    // simpleline icons
    let simmplelineLink = document.createElement("link");
    simmplelineLink.href = "https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.min.css";
    simmplelineLink.rel = "stylesheet";
    simmplelineLink.type = "text/css";
    document.querySelector('body').appendChild(simmplelineLink);

    //   storage.get('userData', (err, data) => {
    //     if (data && data.id && data.pw) {
    //       signInProcess(data.id, data.pw);
    //     }
    //   });
  }, [])

  const signInProcess = (id, pw) => {
    const token = 'c1cd7759-9784-4fac-a667-3685d6b2e4a0';
    // storage.set('userData', { token: token, id: id, pw: pw }, () => {
    //   setUserToken(token)
    // })
    setUserToken(token)
  }

  return (
    <>
    { !userToken ? (
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
              <input type="password" ref={node => pw = node}/>
            </div>
          </div>
          <div
            className="app-button-login"
            onClick={() => {
              if (!id.value || id.value === '') { alert('아이디를 입력해주세요.'); return; }
              if (!pw.value || pw.value === '') { alert('비밀번호를 입력해주세요.'); return; }
              signInProcess(id.value, pw.value);
            }}>
            <div>로그인</div>
          </div>
          <div className="app-options">
            <a>회원가입</a>
            <a>아이디 찾기</a>
            <a>비밀번호 찾기</a>
          </div>
        </div>
      </div>
    ) : (
      <Main
        userToken={userToken}
        isLoading={isLoading}/>
    )}

    { loading && (
      <div id="loading"><div></div></div>
    )}
    </>
  );
}


export default App;
