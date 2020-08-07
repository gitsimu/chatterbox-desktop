import React from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import Mockup from './Mockup'
import PrettoSlider from './PrettoSlider'
import { ChromePicker } from 'react-color'
import * as smlog from '../js/smlog'

/* URL을 OS 기본 브라우저로 열기위한 shell
 * https://github.com/electron/electron/blob/master/docs/api/shell.md#shellopenexternalurl
 */
const { shell, ipcRenderer } = require('electron')
const storage = require('electron-json-storage')
const initWorkingDay = {
  isInit: true,
  use: false,
  state : [],
  week: ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'], 
  allday: true,
  startWork: '0000', 
  endWork: '0000',
  breaktime: false,
  startBreak: '0000',
  endBreak: '0000',
  message: '',
}
const initConfig = {
  title: '채팅 상담',
  subTitle: '보통 몇 분 내에 응답합니다',
  nickname: 'Manager',
  firstMessage: '방문해주셔서 감사합니다.\n궁금한 내용을 편하게 남겨주세요.'
}
const iconConfig = {
  position: 'rb',
  pc: {
    displayed: true,
    axisX: 15,
    axisY: 15,
    size: 70
  },
  mobile: {
    displayed: true,
    axisX: 15,
    axisY: 15,
    size: 70
  }
}


const Setting = ({ settings, ...props }) => {
  const database = props.database
  const Alert = props.Alert

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
  const [mainTheme, setMainTheme] = React.useState('light')
  const [workingDay, setWorkingDay] = React.useState(initWorkingDay)
  const [missedMessage, setMissedMessage] = React.useState('')
  const [settingMenuState, setSettingMenuState] = React.useState(0)
  const [version, setVersion] = React.useState('0.0.0')

  const [domains, setDomains] = React.useState([])

  const [selectDevice, setSelectDevice] = React.useState(0)
  const [iconDisplayed, setIconDisplayed] = React.useState(iconConfig.pc.displayed)
  const [iconPosition, setIconPosition] = React.useState(iconConfig.position)
  const [iconAxisX, setIconAxisX] = React.useState(iconConfig.pc.axisX)
  const [iconAxisY, setIconAxisY] = React.useState(iconConfig.pc.axisY)
  const [iconSize, setIconSize] = React.useState(iconConfig.pc.size)

  const isLoading = props.isLoading
  
  React.useEffect(() => {
    /* by firebase */
    database.ref(`/${settings.key}/config`).once('value', function(snapshot) {
      const data = snapshot.val()
      let _message = ''
      if (data) {
        setTitle(data.title)
        setSubTitle(data.subTitle)
        setNickname(data.nickname)
        setFirstMessage(data.firstMessage)
        setThemeColor(data.themeColor)
        setProfileImage(data.profileImage || null)
        setMissedMessage(data.workingDay.message)
        _message = data.workingDay.message
      } else {
        setTitle(initConfig.title)
        setSubTitle(initConfig.subTitle)
        setNickname(initConfig.nickname)
        setFirstMessage(initConfig.firstMessage)
      }

      smlog.API({
        method: 'get_chat_workingday_desktop'
      }).then((data) => {
        if(data){
          setWorkingDay({
            isInit : true,
            message : _message,
            ...data,
          })
        }
      })
    })

    /* use chat */
    smlog.API({
      method: 'domains_data',
      username: settings.userName
    }).then(({data}) => {
      console.log('domains', data)
      setDomains(data)
    })
  }, [database, settings.key, settings.userName])

  /* by storage */
  React.useEffect(() => {
    /* GET BASIC SETTINGS
     * PUSH ALARM / AUDIO BEEP / AUTO SIGNIN
     */
    storage.getMany(['pushAlram', 'audioBeep', 'autoSignin', 'mainTheme'], (err, data) => {
      console.log('[Basic settings]', data)
      allowPushAlram(typeof(data.pushAlram.allowed) === "undefined" ? true : data.pushAlram.allowed)
      allowAudioBeep(typeof(data.audioBeep.allowed) === "undefined" ? true : data.audioBeep.allowed)
      allowAutoSignin(typeof(data.autoSignin.allowed) === "undefined" ? true : data.autoSignin.allowed)
      setMainTheme(typeof(data.mainTheme.type) === "undefined" ? 'light' : data.mainTheme.type)
    })

    ipcRenderer.send('app_version')
    ipcRenderer.on('app_version', (event, arg) => {
      ipcRenderer.removeAllListeners('app_version')
      setVersion(arg.version)
    })
  }, [])

  /* file upload handler */
  const handleFileInput = (e) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOW_FILE_EXTENSIONS = ['jpg', 'jpeg', 'gif', 'bmp', 'png']

    const target = e.target.files[0]
    const fileSize = target.size
    const fileExtension = target.name.split('.').pop().toLowerCase()

    if (MAX_FILE_SIZE < fileSize) {
      Alert('한 번에 업로드 할 수 있는 최대 파일 크기는 5MB 입니다.')
      return
    } else if (ALLOW_FILE_EXTENSIONS.indexOf(fileExtension) === -1) {
      Alert('지원하지 않는 파일 형식입니다.')
      return
    }

    isLoading(true)
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    formData.append('key', settings.key)

    return axios.post(`${global.server.chat}/api/upload`, formData, config)
      .then(res => {
        console.log('upload-success', res)
        isLoading(false)

        if (res.data.result === 'success') {
          const path = JSON.stringify(res.data.file)
          database.ref(`/${settings.key}/config`).update({ profileImage: path })
          setProfileImage(path)
        }
      })
      .catch(err => {
        console.log('upload-failure', err)
        isLoading(false)
      })
  }

  /* file remove handler */
  const handleFileRemove = () => {
    if (profileImage === null) return

    database.ref(`/${settings.key}/config`).update({ profileImage: null })
    setProfileImage(null)

    // s3 file remove
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData()
    formData.append('filename', JSON.parse(profileImage).name)
    formData.append('key', settings.key)

    return axios.post(`${global.server.chat}/api/remove`, formData, config)
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
    database.ref(`/${settings.key}/config`).update({
      title: title.trim(),
      subTitle: subTitle.trim(),
      nickname: nickname.trim(),
      firstMessage: firstMessage.trim(),
      themeColor: themeColor
    })
  }

  const updateUseChat = (svid, use) => {
    smlog.API({
      method: 'update_chat_state',
      svid: svid,
      is_use_chat: use ? 1 : 0
    }).then(({code}) => {
      console.log('updateUseChat', code)
    })
  }

  let mo, tu, we, th, fr, sa, su,
      startWork, endWork, startBreak, endBreak,
      allday, breaktime, message
  const onChangeWorkingDay = (e) => {
    const week = []
    if (mo.checked) week.push('mo')
    if (tu.checked) week.push('tu')
    if (we.checked) week.push('we')
    if (th.checked) week.push('th')
    if (fr.checked) week.push('fr')
    if (sa.checked) week.push('sa')
    if (su.checked) week.push('su')

    setWorkingDay({
      ...workingDay,
      week: week,
      allday: allday.checked,
      startWork: startWork.value,
      endWork: endWork.value,
      breaktime: breaktime.checked,
      startBreak: startBreak.value,
      endBreak: endBreak.value,
      message: message.value.trim().substring(0, 200),
      isInit: null
    })    
  }

  let state = {}
  React.useEffect(() => {
    if (workingDay.isInit) return

    database.ref(`/${settings.key}/config`).update({
      workingDay: workingDay
    })

    smlog.API({
      method: 'update_chat_workingday_desktop',
      use: workingDay.use ? "1" : "0",
      allday: workingDay.allday ? "1" : "0",
      startWork: workingDay.startWork,
      endWork: workingDay.endWork,
      breaktime: workingDay.breaktime ? "1" : "0",
      startBreak: workingDay.startBreak,
      endBreak: workingDay.endBreak,
      week: workingDay.week.join(','),
      state: Object.keys(state).filter(sid=> state[sid].checked).join(',')
    })
  }, [database, settings.key, workingDay])

  return (
    <div className="setting">
      <div className="setting-list card">
        <div className="setting-list-title">Settings</div>
        <div
          className={ settingMenuState === 0 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(0) }}>
          <div>기본설정</div>
        </div>
        <div
          className={ settingMenuState === 1 ? "setting-list-tab active" : "setting-list-tab"}
          onClick={() => { setSettingMenuState(1) }}>
          <div>채팅설정</div>
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
          <div>서비스 정보</div>
        </div>
      </div>

      <div className="setting-body card">
        <div className={ settingMenuState === 0 ? "setting-menu-0" : "setting-menu-0 hide" }>
          <div className="setting-menu-header">
            기본 설정
          </div>
          <div className="setting-menu-body setting-basic">
            {/* Theme */}
            <div className="setting-checkbox-item">
              <div className="setting-checkbox-item-title">
                <span>테마</span>
                <select 
                  value={mainTheme} 
                  onChange={(e) => {
                    // SET MAIN THEME
                    setMainTheme(e.target.value)
                    props.setMainTheme(e.target.value)
                    storage.set('mainTheme', { type: e.target.value })
                    console.log('theme change', e.target.value)
                  }}>
                  <option value="chatterbox-theme-light">Light</option>
                  <option value="chatterbox-theme-dark">Dark</option>
                </select>
                {/* <div className="setting-checkbox-item-description">앱을 재시작하면 변경된 테마가 적용됩니다.</div> */}
              </div>              
            </div>
            {/* Use chat */}
            <div className="setting-checkbox-item">
              <div className="setting-checkbox-item-title">
                <span>채팅기능 사용</span>
              </div>
              <div 
                className="setting-checkbox-item-description" 
                style={{paddingTop: 5, paddingBottom: 10}}>
                  채팅기능을 사용할 도메인에 체크해주세요. 체크를 해제하면 채팅 아이콘이 나타나지 않습니다.
              </div>
              {domains.length > 0 ?
                (
                  domains.map((item, index) => {
                    return (
                      <div className="domains" key={index}>
                        <label>
                          <input
                            type="checkbox"
                            ref={node => state[item.sid] = node}
                            defaultChecked={workingDay.state[item.sid]}
                            onClick={(e) => {
                              setWorkingDay({...workingDay, isInit: null})
                              item.sid && updateUseChat(item.sid ,e.target.checked)
                            }}/>
                          <div className="domain-text">{item.s_domain}</div>
                        </label>
                      </div>
                    )
                  })
                ) : (
                  <div className="domains-empty">사용 중인 도메인이 없습니다.</div>
                )
              }
            </div>
            {/* Push */}
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
            {/* Audio */}
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
            {/* Auto login */}
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
            {/* Working day */}
            <div className="setting-checkbox-item">
              <div className="setting-checkbox-item-title">
                <label>
                  <input type="checkbox"
                    checked={workingDay.use}
                    onChange={(e) => {
                      // SET WORKING DATETIME
                      setWorkingDay({...workingDay, use: e.target.checked, isInit: null})                      
                    }}/>
                  <span>채팅시간 설정</span>
                </label>
              </div>
              <div className="setting-checkbox-item-description">채팅 가능 요일 및 시간을 지정하면 그 외의 시간대와 브레이크 타임에는 채팅창이 노출되지 않습니다.</div>
              <div className="setting-checkbox-item-description">해당 시간대 이전에 채팅창을 미리 띄워놓은 사용자에게는 부재중 메세지가 전송됩니다.</div>
              { workingDay.use && (
                <div className="setting-working-day">
                  <div className="setting-working-week">
                    <label><input type="checkbox" ref={node => mo = node} checked={workingDay.week.indexOf('mo') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>월</label>
                    <label><input type="checkbox" ref={node => tu = node} checked={workingDay.week.indexOf('tu') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>화</label>
                    <label><input type="checkbox" ref={node => we = node} checked={workingDay.week.indexOf('we') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>수</label>
                    <label><input type="checkbox" ref={node => th = node} checked={workingDay.week.indexOf('th') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>목</label>
                    <label><input type="checkbox" ref={node => fr = node} checked={workingDay.week.indexOf('fr') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>금</label>
                    <label><input type="checkbox" ref={node => sa = node} checked={workingDay.week.indexOf('sa') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>토</label>                  
                    <label><input type="checkbox" ref={node => su = node} checked={workingDay.week.indexOf('su') > -1} onChange={(e) => { onChangeWorkingDay(e) }}/>일</label>
                  </div>
                  <div className="setting-working-time">
                    <div className="setting-working-time-title">채팅가능 시간</div>
                    <div className={workingDay.allday ? 'hide' : ''}><div>
                      <select ref={node => startWork = node} value={workingDay.startWork} onChange={(e) => { onChangeWorkingDay(e) }}>
                        <option value="0000">00:00</option><option value="0030">00:30</option>                        
                        <option value="0100">01:00</option><option value="0130">01:30</option>
                        <option value="0200">02:00</option><option value="0230">02:30</option>
                        <option value="0300">03:00</option><option value="0330">03:30</option>
                        <option value="0400">04:00</option><option value="0430">04:30</option>
                        <option value="0500">05:00</option><option value="0530">05:30</option>
                        <option value="0600">06:00</option><option value="0630">06:30</option>
                        <option value="0700">07:00</option><option value="0730">07:30</option>
                        <option value="0800">08:00</option><option value="0830">08:30</option>
                        <option value="0900">09:00</option><option value="0930">09:30</option>
                        <option value="1000">10:00</option><option value="1030">10:30</option>
                        <option value="1100">11:00</option><option value="1130">11:30</option>
                        <option value="1200">12:00</option><option value="1230">12:30</option>
                        <option value="1300">13:00</option><option value="1330">13:30</option>
                        <option value="1400">14:00</option><option value="1430">14:30</option>
                        <option value="1500">15:00</option><option value="1530">15:30</option>
                        <option value="1600">16:00</option><option value="1630">16:30</option>
                        <option value="1700">17:00</option><option value="1730">17:30</option>
                        <option value="1800">18:00</option><option value="1830">18:30</option>
                        <option value="1900">19:00</option><option value="1930">19:30</option>
                        <option value="2000">20:00</option><option value="2030">20:30</option>
                        <option value="2100">21:00</option><option value="2130">21:30</option>
                        <option value="2200">22:00</option><option value="2230">22:30</option>
                        <option value="2300">23:00</option><option value="2330">23:30</option>
                      </select>
                    </div>
                    <div>~</div>
                    <div>
                      <select ref={node => endWork = node} value={workingDay.endWork} onChange={(e) => { onChangeWorkingDay(e) }}>
                        <option value="0000">00:00</option><option value="0030">00:30</option>                        
                        <option value="0100">01:00</option><option value="0130">01:30</option>
                        <option value="0200">02:00</option><option value="0230">02:30</option>
                        <option value="0300">03:00</option><option value="0330">03:30</option>
                        <option value="0400">04:00</option><option value="0430">04:30</option>
                        <option value="0500">05:00</option><option value="0530">05:30</option>
                        <option value="0600">06:00</option><option value="0630">06:30</option>
                        <option value="0700">07:00</option><option value="0730">07:30</option>
                        <option value="0800">08:00</option><option value="0830">08:30</option>
                        <option value="0900">09:00</option><option value="0930">09:30</option>
                        <option value="1000">10:00</option><option value="1030">10:30</option>
                        <option value="1100">11:00</option><option value="1130">11:30</option>
                        <option value="1200">12:00</option><option value="1230">12:30</option>
                        <option value="1300">13:00</option><option value="1330">13:30</option>
                        <option value="1400">14:00</option><option value="1430">14:30</option>
                        <option value="1500">15:00</option><option value="1530">15:30</option>
                        <option value="1600">16:00</option><option value="1630">16:30</option>
                        <option value="1700">17:00</option><option value="1730">17:30</option>
                        <option value="1800">18:00</option><option value="1830">18:30</option>
                        <option value="1900">19:00</option><option value="1930">19:30</option>
                        <option value="2000">20:00</option><option value="2030">20:30</option>
                        <option value="2100">21:00</option><option value="2130">21:30</option>
                        <option value="2200">22:00</option><option value="2230">22:30</option>
                        <option value="2300">23:00</option><option value="2330">23:30</option>
                      </select>
                    </div></div>
                    <div><label><input type="checkbox" ref={node => allday = node} checked={workingDay.allday} onChange={(e) => { onChangeWorkingDay(e) }}/>종일</label></div>
                  </div>
                  <div className="setting-working-time">
                    <div className="setting-working-time-title">브레이크 타임</div>
                    <div className={workingDay.breaktime ? '' : 'hide'}><div>
                      <select ref={node => startBreak = node} value={workingDay.startBreak} onChange={(e) => { onChangeWorkingDay(e) }}>
                        <option value="0000">00:00</option><option value="0030">00:30</option>                        
                        <option value="0100">01:00</option><option value="0130">01:30</option>
                        <option value="0200">02:00</option><option value="0230">02:30</option>
                        <option value="0300">03:00</option><option value="0330">03:30</option>
                        <option value="0400">04:00</option><option value="0430">04:30</option>
                        <option value="0500">05:00</option><option value="0530">05:30</option>
                        <option value="0600">06:00</option><option value="0630">06:30</option>
                        <option value="0700">07:00</option><option value="0730">07:30</option>
                        <option value="0800">08:00</option><option value="0830">08:30</option>
                        <option value="0900">09:00</option><option value="0930">09:30</option>
                        <option value="1000">10:00</option><option value="1030">10:30</option>
                        <option value="1100">11:00</option><option value="1130">11:30</option>
                        <option value="1200">12:00</option><option value="1230">12:30</option>
                        <option value="1300">13:00</option><option value="1330">13:30</option>
                        <option value="1400">14:00</option><option value="1430">14:30</option>
                        <option value="1500">15:00</option><option value="1530">15:30</option>
                        <option value="1600">16:00</option><option value="1630">16:30</option>
                        <option value="1700">17:00</option><option value="1730">17:30</option>
                        <option value="1800">18:00</option><option value="1830">18:30</option>
                        <option value="1900">19:00</option><option value="1930">19:30</option>
                        <option value="2000">20:00</option><option value="2030">20:30</option>
                        <option value="2100">21:00</option><option value="2130">21:30</option>
                        <option value="2200">22:00</option><option value="2230">22:30</option>
                        <option value="2300">23:00</option><option value="2330">23:30</option>
                      </select>
                    </div>
                    <div>~</div>
                    <div>
                      <select ref={node => endBreak = node} value={workingDay.endBreak} onChange={(e) => { onChangeWorkingDay(e) }}>
                        <option value="0000">00:00</option><option value="0030">00:30</option>                        
                        <option value="0100">01:00</option><option value="0130">01:30</option>
                        <option value="0200">02:00</option><option value="0230">02:30</option>
                        <option value="0300">03:00</option><option value="0330">03:30</option>
                        <option value="0400">04:00</option><option value="0430">04:30</option>
                        <option value="0500">05:00</option><option value="0530">05:30</option>
                        <option value="0600">06:00</option><option value="0630">06:30</option>
                        <option value="0700">07:00</option><option value="0730">07:30</option>
                        <option value="0800">08:00</option><option value="0830">08:30</option>
                        <option value="0900">09:00</option><option value="0930">09:30</option>
                        <option value="1000">10:00</option><option value="1030">10:30</option>
                        <option value="1100">11:00</option><option value="1130">11:30</option>
                        <option value="1200">12:00</option><option value="1230">12:30</option>
                        <option value="1300">13:00</option><option value="1330">13:30</option>
                        <option value="1400">14:00</option><option value="1430">14:30</option>
                        <option value="1500">15:00</option><option value="1530">15:30</option>
                        <option value="1600">16:00</option><option value="1630">16:30</option>
                        <option value="1700">17:00</option><option value="1730">17:30</option>
                        <option value="1800">18:00</option><option value="1830">18:30</option>
                        <option value="1900">19:00</option><option value="1930">19:30</option>
                        <option value="2000">20:00</option><option value="2030">20:30</option>
                        <option value="2100">21:00</option><option value="2130">21:30</option>
                        <option value="2200">22:00</option><option value="2230">22:30</option>
                        <option value="2300">23:00</option><option value="2330">23:30</option>
                      </select>
                    </div></div>
                    <div><label><input type="checkbox" ref={node => breaktime = node} checked={workingDay.breaktime} onChange={(e) => { onChangeWorkingDay(e) }}/>사용하기</label></div>
                  </div>
                  <div className="setting-working-message">
                    <div className="setting-working-message-title">부재중 메세지 (최대 200자)</div>
                    <textarea 
                      ref={node => message = node}
                      value={missedMessage}
                      onChange={(e) => {setMissedMessage(e.target.value)}}
                      onBlur={(e) => {onChangeWorkingDay(e)}}>
                    </textarea>
                  </div>
                </div>
              )}
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
                profileImage={profileImage}
                iconPosition={iconPosition}
                iconAxisX={iconAxisX}
                iconAxisY={iconAxisY}
                iconSize={iconSize}/>
            </div>
            <div style={{ flex: 1, marginLeft: 20, maxWidth: 400 }}>
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
                    onChange={(color) => { 
                      const _color = color.rgb.a === 1 ? color.hex : `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`
                      setThemeColor(_color) 
                    }}/>
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
                  { profileImage !== null && (
                    <div className="setting-profile-image-remove"
                    onClick={() => { handleFileRemove() }}>이미지 삭제</div>
                  )}                     
                </div>
              </div>
            </div>
          </div>
          <div className="setting-menu-column">
            <div className="setting-menu-tab">
              <div className={selectDevice === 0 ? 'active' : ''}
                onClick={() => {setSelectDevice(0)}}>PC</div>
              <div className={selectDevice === 1 ? 'active' : ''}
                onClick={() => {setSelectDevice(1)}}>Mobile</div>
            </div>
            <div className="setting-menu-device">
              <div>
                <div className="setting-menu-device-item">
                  <label>
                    <input type="checkbox"
                      checked={iconDisplayed}
                      onChange={(e) => {
                        setIconDisplayed(e.target.checked)
                      }}/>
                    <span>채팅 아이콘 숨기기</span>
                  </label>
                </div>
                <div className="setting-menu-device-item">
                  <div className="setting-menu-device-item-title">아이콘 위치</div>
                  <div className="row">
                    <div className="screen-axis">
                      <div className={iconPosition === 'lt' ? "screen-axis-lt active" : "screen-axis-lt"}
                        onClick={() => {setIconPosition('lt')}}></div>
                      <div className={iconPosition === 'rt' ? "screen-axis-rt active" : "screen-axis-rt"}
                        onClick={() => {setIconPosition('rt')}}></div>
                      <div className={iconPosition === 'lb' ? "screen-axis-lb active" : "screen-axis-lb"}
                        onClick={() => {setIconPosition('lb')}}></div>
                      <div className={iconPosition === 'rb' ? "screen-axis-rb active" : "screen-axis-rb"}
                        onClick={() => {setIconPosition('rb')}}></div>
                    </div>
                    <div style={{width: 300, marginLeft: 50}}>
                      <div className="row">
                        <div className="setting-menu-device-item-title">가로 여백</div>
                        <PrettoSlider
                          defaultValue={15}
                          step={1}
                          min={0}
                          max={100}
                          valueLabelDisplay="auto"
                          value={iconAxisX}
                          onChange={(event, value) => { 
                            setIconAxisX(value)
                          }}
                        />
                      </div>
                      <div className="row">
                        <div className="setting-menu-device-item-title">세로 여백</div>
                        <PrettoSlider
                          defaultValue={15}
                          step={1}
                          min={0}
                          max={100}
                          valueLabelDisplay="auto"
                          value={iconAxisY}
                          onChange={(event, value) => { 
                            setIconAxisY(value)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="setting-menu-device-item">
                  <div className="setting-menu-device-item-title">아이콘 크기</div>
                  <div style={{width: 250}}>
                    <PrettoSlider
                      defaultValue={60}
                      step={1}
                      min={50}
                      max={80}
                      valueLabelDisplay="auto"
                      value={iconSize}
                      onChange={(event, value) => { 
                        setIconSize(value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={ settingMenuState === 2 ? "setting-menu-2" : "setting-menu-2 hide" }>
          <div className="setting-service-info">
            <div>
              <img src="icon01_256.png" alt="setting-logo" />
              <div className="setting-service-info-title">Smartlog Desktop</div>
              <div 
                // onClick={() => {
                //   console.log('check update start')
                //   ipcRenderer.send('check_update')
                //   ipcRenderer.on('check_update', (event, arg) => {
                //     ipcRenderer.removeAllListeners('check_update')
                //     console.log('check update', arg)
                //   })
                // }}
                className="setting-service-info-text1">Version {version}</div>
              <div className="setting-service-info-text3">COPYRIGHT (C) Creative Soft. All Rights reserved.</div>
            </div>
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
