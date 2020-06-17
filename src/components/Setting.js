import React from 'react';
import { connect } from 'react-redux';
import Mockup from './Mockup';
import { ChromePicker } from 'react-color';

const Setting = ({ settings, ...props }) => {
  const database = props.database;
  const databaseRef = '/' + settings.key + '/' + 'config';
  const info = database.ref(databaseRef);

  const [title, setTitle] = React.useState('');
  const [subTitle, setSubTitle] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [firstMessage, setFirstMessage] = React.useState('');

  const [tabState, setTabState] = React.useState(0);

  const [themeColor, setThemeColor] = React.useState('#444c5d');
  const [themeColorPicker, showThemeColorPicker] = React.useState(false);
  // const [profileImagePath, setProfileImagePath] = React.useState(null);

  React.useEffect(() => {
    info.once('value', function(snapshot) {
      const data = snapshot.val();
      if (!data) return;

      // console.log('setting effect')
      setTitle(data.title);
      setSubTitle(data.subTitle);
      setNickname(data.nickname);
      setFirstMessage(data.firstMessage);
    })
  }, [])

  const handleFileInput = (e) => {

  }

  const updateUserInfo = () => {
    info.update({
      title: title,
      subTitle: subTitle,
      nickname: nickname,
      firstMessage: firstMessage,
      themeColor: themeColor,
      // profileImagePath: profileImagePath,
    });
    // alert('적용되었습니다.');
  }

  return (
    <div className="setting">
      <div className="setting-list card">
        <div className="setting-list-title">Settings</div>
        <div
          className={ tabState === 0 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setTabState(0) }}>
          <div>채팅 설정</div>
        </div>
        <div className="setting-list-title">Etc</div>
        <div
          className="setting-list-tab"
          onClick={() => { window.open("https://smlog.co.kr/notice_list.htm", "_blank") }}>
          <div>새 소식</div>
        </div>
        <div
          className="setting-list-tab"
          onClick={() => { window.open("https://smlog.co.kr/faq_list.htm", "_blank") }}>
          <div>고객센터</div>
        </div>
        <div
          className={ tabState === 1 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setTabState(1) }}>
          <div>버전 정보</div>
        </div>
      </div>

      <div className="setting-body card">

        <div className={ tabState === 0 ? "setting-tab-0" : "setting-tab-0 hide" }>
          <div className="setting-tab-header">
            채팅 설정
          </div>
          <div className="setting-tab-body">
            <div className="setting-mockup">
              <Mockup
                title={title}
                subTitle={subTitle}
                nickname={nickname}
                firstMessage={firstMessage}
                themeColor={themeColor}/>

              <div className="setting-theme">
                <div className="setting-input-item">
                  <span>테마색상</span>
                  <input type="text"
                    value={themeColor}
                    onChange={() => {}}
                    onClick={() => {
                      showThemeColorPicker(!themeColorPicker);
                    }}/>
                  <div className={themeColorPicker ? "setting-color-picker active" : "setting-color-picker"}>
                    <ChromePicker
                      color={themeColor}
                      onChange={(color) => { setThemeColor(color.hex) }}/>
                    <div className="empty-background"
                      onClick={() => {
                        updateUserInfo()
                        showThemeColorPicker(false)
                      }}>
                    </div>
                  </div>
                </div>
                <div className="setting-input-item">
                  <span>프로필 이미지</span>
                  <div style={{ display: "flex" }}>
                    <label className="setting-profile-image-upload">
                      <div>새 이미지 업로드</div>
                      <input type="file" onChange={e => handleFileInput(e)}/>
                    </label>
                    <div className="setting-profile-image-remove">이미지 삭제</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, marginLeft: 20 }}>
              <div className="setting-input-item">
                <span>제목</span>
                <input value={title}
                  onBlur={() => updateUserInfo()}
                  onChange={(e) => { setTitle(e.target.value) }}/>
              </div>
              <div className="setting-input-item">
                <span>설명</span>
                <input value={subTitle}
                  onBlur={() => updateUserInfo()}
                  onChange={(e) => { setSubTitle(e.target.value) }}/>
              </div>
              <div className="setting-input-item">
                <span>프로필 이름</span>
                <input value={nickname}
                  onBlur={() => updateUserInfo()}
                  onChange={(e) => { setNickname(e.target.value) }}/>
              </div>
              <div className="setting-input-item">
                <span>첫 응대 메세지</span>
                <textarea value={firstMessage}
                  onBlur={() => updateUserInfo()}
                  onChange={(e) => { setFirstMessage(e.target.value) }}/>
              </div>
            </div>
          </div>
        </div>

        <div className={ tabState === 1 ? "setting-tab-1" : "setting-tab-1 hide" }>
          <div className="setting-tab-header">
            버전 정보
          </div>
          <div className="setting-tab-body">
          </div>
        </div>

        <div className={ tabState === 2 ? "setting-tab-2" : "setting-tab-2 hide" }>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings,
})

// export default Setting;
export default connect(mapStateToProps)(Setting);
