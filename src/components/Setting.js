import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import Mockup from './Mockup'
import { ChromePicker } from 'react-color'

/* URL을 OS 기본 브라우저로 열기위한 shell
 * https://github.com/electron/electron/blob/master/docs/api/shell.md#shellopenexternalurl
 */
const { shell } = require('electron')
const storage = require('electron-json-storage')

const Setting = ({ settings, ...props }) => {
  const database = props.database
  const info = database.ref(`/${settings.key}/config`)

  const [title, setTitle] = React.useState('')
  const [subTitle, setSubTitle] = React.useState('')
  const [nickname, setNickname] = React.useState('')
  const [firstMessage, setFirstMessage] = React.useState('')
  const [profileImage, setProfileImage] = React.useState(null)
  const [themeColor, setThemeColor] = React.useState('#444c5d')
  const [themeColorPicker, showThemeColorPicker] = React.useState(false)

  const [pushAlram, allowPushAlram] = React.useState(true)
  const [audioBeep, allowAudioBeep] = React.useState(true)
  const [autoSignin, allowAutoSignin] = React.useState(true)

  const [settingMenuState, setSettingMenuState] = React.useState(0)
  const isLoading = props.isLoading

  React.useEffect(() => {
    info.once('value', function(snapshot) {
      const data = snapshot.val()
      if (!data) return

      setTitle(data.title)
      setSubTitle(data.subTitle)
      setNickname(data.nickname)
      setFirstMessage(data.firstMessage)
      setThemeColor(data.themeColor)
      setProfileImage(data.profileImage || null)
    })
  }, [info])

  React.useEffect(() => {    
    /* GET BASIC SETTINGS
     * PUSH ALARM / AUDIO BEEP / AUTO SIGNIN
     */
    storage.getMany(['pushAlram', 'audioBeep', 'autoSignin'], (err, data) => {      
      console.log('[Basic settings]', data)
      allowPushAlram(typeof(data.pushAlram.allowed) === "undefined" ? true : data.pushAlram.allowed)
      allowAudioBeep(typeof(data.audioBeep.allowed) === "undefined" ? true : data.audioBeep.allowed)
      allowAutoSignin(typeof(data.autoSignin.allowed) === "undefined" ? true : data.autoSignin.allowed)
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
      themeColor: themeColor
    })
  }

  return (
    <div className="setting">
      <div className="setting-list card">
        <div className="setting-list-title">Settings</div>
        <div
          className={ settingMenuState === 0 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(0) }}>
          <div>기본 설정</div>
        </div>
        <div
          className={ settingMenuState === 1 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(1) }}>
          <div>채팅 설정</div>
        </div>
        <div className="setting-list-title">Etc</div>
        <div className="setting-list-tab"
          onClick={() => {
            if (typeof(shell) === "object") {
              shell.openExternal('https://smlog.co.kr/member/member_join_check.htm')
            }
          }}>새 소식</div>
        <div className="setting-list-tab"
          onClick={() => {
            if (typeof(shell) === "object") {
              shell.openExternal('https://smlog.co.kr/member/id_pass.htm')
            }
          }}>고객센터</div>
        <div
          className={ settingMenuState === 2 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(2) }}>
          <div>버전 정보</div>
        </div>
      </div>

      <div className="setting-body card">
        <div className={ settingMenuState === 0 ? "setting-menu-0" : "setting-menu-0 hide" }>
          <div className="setting-menu-header">
            기본 설정
          </div>
          <div className="setting-menu-body setting-basic">
            <div className="setting-checkbox-item">
              <div className="setting-checkbox-item-title">
                <label>
                  <input type="checkbox"
                    checked={pushAlram}
                    onChange={(e) => {          
                      // SET PUSH ALARM
                      allowPushAlram(e.target.checked)
                      storage.set('pushAlram', { allowed: e.target.checked})
                    }}/>
                  <span>푸시알람 설정</span>
                </label>
              </div>
              <div className="setting-checkbox-item-description">새로운 메세지가 올 때 푸시알람을 띄워줍니다. 체크를 해제하면 알람이 오지 않습니다.</div>
            </div>
            <div className="setting-checkbox-item">
              <div className="setting-checkbox-item-title">
                <label>
                  <input type="checkbox"
                    checked={audioBeep}
                    onChange={(e) => {    
                      // SET AUDIO BEEP
                      allowAudioBeep(e.target.checked)
                      storage.set('audioBeep', { allowed: e.target.checked})                      
                    }}/>
                  <span>오디오 경고음</span>
                </label>
              </div>
              <div className="setting-checkbox-item-description">새 푸시알람이 오거나 특정 작업을 실행할 때 시스템 경고음을 울립니다.</div>
            </div>
            <div className="setting-checkbox-item">
              <div className="setting-checkbox-item-title">
                <label>
                  <input type="checkbox"
                    checked={autoSignin}
                    onChange={(e) => {    
                      // SET AUTO SIGNIN
                      allowAutoSignin(e.target.checked)
                      storage.set('autoSignin', { allowed: e.target.checked})                      
                    }}/>
                  <span>자동 로그인</span>
                </label>
              </div>
              <div className="setting-checkbox-item-description">첫 로그인 이후부터는 앱을 실행시킬 때 해당 계정으로 자동 로그인합니다.</div>
              <div className="setting-checkbox-item-description">개인정보 보호를 위해 개인 PC에서만 사용하세요.</div>
            </div>
          </div>          
        </div>
        <div className={ settingMenuState === 1 ? "setting-menu-1" : "setting-menu-1 hide" }>
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
                    onChange={() => {
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

        <div className={ settingMenuState === 2 ? "setting-menu-2" : "setting-menu-2 hide" }>
          <div className="setting-menu-header">
            버전 정보
          </div>
          <div className="setting-menu-body">
          </div>
        </div>

        <div className={ settingMenuState === 3 ? "setting-menu-3" : "setting-menu-3 hide" }>
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings
})

// export default Setting
export default connect(mapStateToProps)(Setting)
