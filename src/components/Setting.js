import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import Mockup from './Mockup'
import { ChromePicker } from 'react-color'

const Setting = ({ settings, ...props }) => {
  const database = props.database
  const databaseRef = '/' + settings.key + '/' + 'config'
  const info = database.ref(databaseRef)

  const [title, setTitle] = React.useState('')
  const [subTitle, setSubTitle] = React.useState('')
  const [nickname, setNickname] = React.useState('')
  const [firstMessage, setFirstMessage] = React.useState('')
  const [profileImage, setProfileImage] = React.useState(null)
  const [themeColor, setThemeColor] = React.useState('#444c5d')
  const [themeColorPicker, showThemeColorPicker] = React.useState(false)

  const [settingMenuState, setSettingMenuState] = React.useState(0)
  const isLoading = props.isLoading

  React.useEffect(() => {
    info.once('value', function(snapshot) {
      const data = snapshot.val()
      if (!data) return

      // console.log('setting effect')
      setTitle(data.title)
      setSubTitle(data.subTitle)
      setNickname(data.nickname)
      setFirstMessage(data.firstMessage)
      setThemeColor(data.themeColor)
      setProfileImage(data.profileImage ? data.profileImage : null)
    })
  }, [])

  const handleFileInput = (e) => {
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    formData.append('key', settings.key)

    isLoading(true)

    return axios.post(global.serverAddress + '/api/upload', formData, config)
      .then(res => {
        console.log('upload-success', res)
        isLoading(false)

        if (res.data.result === 'success') {
          const path = JSON.stringify(res.data.file)
          info.update({ profileImage: path })
          setProfileImage(path)
        }
      })
      .catch(err => {
        console.log('upload-failure', err)
        isLoading(false)
      })
  }

  const handleFileRemove = () => {
    if (profileImage === null) return

    info.update({ profileImage: null })
    setProfileImage(null)

    // s3 file remove
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData()
    formData.append('filename', JSON.parse(profileImage).name)
    formData.append('key', settings.key)

    return axios.post(global.serverAddress + '/api/remove', formData, config)
      .then(res => {
        console.log('upload-success', res)
        isLoading(false)

        if (res.data.result === 'success') {
          console.log(res)
        }
      })
      .catch(err => {
        console.log('upload-failure', err)
      })
  }

  const updateUserInfo = () => {
    info.update({
      title: title.trim(),
      subTitle: subTitle.trim(),
      nickname: nickname.trim(),
      firstMessage: firstMessage.trim(),
      themeColor: themeColor,
      // profileImagePath: profileImagePath,
    })
  }

  return (
    <div className="setting">
      <div className="setting-list card">
        <div className="setting-list-title">Settings</div>
        <div
          className={ settingMenuState === 0 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(0) }}>
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
          className={ settingMenuState === 1 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(1) }}>
          <div>버전 정보</div>
        </div>
      </div>

      <div className="setting-body card">
        <div className={ settingMenuState === 0 ? "setting-menu-0" : "setting-menu-0 hide" }>
          <div className="setting-menu-header">
            채팅 설정
          </div>
          <div className="setting-menu-body">
            <div className="setting-mockup">
              <Mockup
                title={title}
                subTitle={subTitle}
                nickname={nickname}
                firstMessage={firstMessage}
                themeColor={themeColor}
                profileImage={profileImage}/>

              <div className="setting-theme">
                <div className="setting-input-item">
                  <span>테마색상</span>
                  <input type="text"
                    value={themeColor}
                    onChange={() => {}}
                    onClick={() => {
                      showThemeColorPicker(!themeColorPicker)
                    }}/>
                  <div className="setting-color-sample" style={{ backgroundColor: themeColor }}></div>
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
                    <div
                      className="setting-profile-image-remove"
                      onClick={() => { handleFileRemove() }}>이미지 삭제</div>
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

        <div className={ settingMenuState === 1 ? "setting-menu-1" : "setting-menu-1 hide" }>
          <div className="setting-menu-header">
            버전 정보
          </div>
          <div className="setting-menu-body">
          </div>
        </div>

        <div className={ settingMenuState === 2 ? "setting-menu-2" : "setting-menu-2 hide" }>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings,
})

// export default Setting
export default connect(mapStateToProps)(Setting)
