import React from 'react';
import Mockup from './Mockup';


const Setting = (props) => {
  const database = props.database;
  const databaseRef = '/' + props.keycode + '/' + 'config';
  const info = database.ref(databaseRef);

  const [title, setTitle] = React.useState('');
  const [subTitle, setSubTitle] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [firstMessage, setFirstMessage] = React.useState('');

  React.useEffect(() => {
    info.once('value', function(snapshot) {
      const data = snapshot.val();
      if (!data) return;

      console.log('setting effect')
      setTitle(data.title);
      setSubTitle(data.subTitle);
      setNickname(data.nickname);
      setFirstMessage(data.firstMessage);
    })
  }, [])

  return (
    <div className="setting">
      <div className="setting-mockup">
        <Mockup
          title={title}
          subTitle={subTitle}
          nickname={nickname}
          firstMessage={firstMessage}/>
      </div>
      <div style={{ flex: 1, marginLeft: 20, padding: 30 }}>
        <div className="setting-input-item">
          <span>제목</span>
          <input value={title} onChange={(e) => { setTitle(e.target.value) }}/>
        </div>
        <div className="setting-input-item">
          <span>설명</span>
          <input value={subTitle} onChange={(e) => { setSubTitle(e.target.value) }}/>
        </div>
        <div className="setting-input-item">
          <span>프로필 이름</span>
          <input value={nickname} onChange={(e) => { setNickname(e.target.value) }}/>
        </div>
        <div className="setting-input-item">
          <span>첫 응대 메세지</span>
          <textarea value={firstMessage} onChange={(e) => { setFirstMessage(e.target.value) }}/>
        </div>
        <div style={{marginTop: 10}}>
          <div
            style={{ backgroundColor: '#00aaff', textAlign: 'center', padding: 10, fontSize: 14, color: '#fff', borderRadius: 3 }}
            onClick={() => {
              info.update({
                title: title,
                subTitle: subTitle,
                nickname: nickname,
                firstMessage: firstMessage,
              });
              alert('적용되었습니다.');
            }}>
            적용하기
          </div>
        </div>
      </div>
    </div>
  )
}

export default Setting
