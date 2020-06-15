import React from 'react';

const Info = (props) => {
  const users = props.users;
  const key = props.keycode;
  const userid = props.userid;
  const database = props.database;
  const userInfo = users.filter((f) => { return f.key === userid });

  const i = (userInfo.length > 0 &&
            userInfo[0]) ?
            userInfo[0] : '';
  const [info, setInfo] = React.useState(i);

  const initNickname = (i && i.value.nickname) ? i.value.nickname : '';
  const initMobile = (i && i.value.mobile) ? i.value.mobile : '';
  const initEmail = (i && i.value.email) ? i.value.email : '';

  const [nickname, setNickname] = React.useState(initNickname);
  const [mobile, setMobile] = React.useState(initMobile);
  const [email, setEmail] = React.useState(initEmail);

  React.useEffect(() => {
    setInfo(i);
  }, [props]);

  React.useEffect(() => {
    setNickname((i && i.value.nickname) ? i.value.nickname : '');
    setMobile((i && i.value.mobile) ? i.value.mobile : '');
    setEmail((i && i.value.email) ? i.value.email : '');
  }, [i]);

  return (
    <div className="chat-info card">
      <div className="chat-info-header">사용자 정보</div>
      <div className="chat-info-body">
        {(userid && userid !== '') && (
          <>
          <div className="chat-info-item">
            <span>사용자 닉네임</span>
            <div className="chat-info-item-input">
              <input type="text" placeholder="데이터가 없습니다" value={nickname} onChange={(e) => { setNickname(e.target.value); }}/>
              <div className="chat-info-item-save"
                onClick={() => {
                  database.ref('/' + key + '/users/' + userid).update({ nickname: nickname })
                  alert('닉네임을 저장하였습니다.');
                }}>저장
              </div>
            </div>
          </div>
          <div className="chat-info-item">
            <span>사용자 고유 ID</span>
            <div className="chat-info-item-text">{info.key}</div>
          </div>
          <div className="chat-info-item">
            <span>연락처</span>
            <div className="chat-info-item-input">
              <input type="text" placeholder="데이터가 없습니다" value={mobile} onChange={(e) => { setMobile(e.target.value); }}/>
              <div className="chat-info-item-save"
                onClick={() => {
                  database.ref('/' + key + '/users/' + userid).update({ mobile: mobile })
                  alert('연락처를 저장하였습니다.');
                }}>저장
              </div>
            </div>
          </div>
          <div className="chat-info-item">
            <span>이메일</span>
            <div className="chat-info-item-input">
              <input type="text" placeholder="데이터가 없습니다" value={email} onChange={(e) => setEmail(e.target.value)}/>
              <div className="chat-info-item-save"
                onClick={() => {
                  database.ref('/' + key + '/users/' + userid).update({ email: email })
                  alert('이메일을 저장하였습니다.');
                }}>저장
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Info;
