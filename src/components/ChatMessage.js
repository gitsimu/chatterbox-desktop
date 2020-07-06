import React from 'react'
import { connect } from 'react-redux'
import * as script from '../js/script.js'

const {ipcRenderer, shell} = require('electron')

const ChatMessage = ({users, settings, ...props}) => {
  const isMyself = props.opponent !== props.userId
  const isSameUser = (props.prev && (props.prev.userId === props.userId))
  const showImageViewer = props.showImageViewer

  // React.useEffect(() => {
  //   ipcRenderer.on("download-progress", (event, progress) => {
  //     console.log(progress.progress); // Progress in fraction, between 0 and 1      
  //     setDownloadProgress((parseInt(progress.progress.percent * 100)) + '%')
  //   })
  // }, [])

  const skipDate = () => {
    if (!props.prev) {
      return false
    }

    const prevDate = script.timestampToDay(props.prev.timestamp)
    const curDate = script.timestampToDay(props.timestamp)

    return (prevDate === curDate)
  }

  const skipTime = () => {
    if (!props.next) {
      return false
    }

    const nextTime = script.timestampToTime(props.next.timestamp, true)
    const curTime = script.timestampToTime(props.timestamp, true)

    return (nextTime === curTime)
  }

  let messageInner
  if (props.type === 1) {
    const URL_PATTERN = /(https?:\/\/)?([ㄱ-힣-a-zA-Z0-9_.]{2,256})\.([a-z]{2,4})\b([-a-zA-Z0-9@:%_+.~#?&/=]*)?/

    if (!URL_PATTERN.test(props.message)) {
      messageInner = (<div className="message-inner">{props.message}</div>)
    } else {
      const messageArr = []
      let messageText = props.message
      let matched
      while ((matched = messageText.match(URL_PATTERN))) {
        if(matched.index) messageArr.push(messageText.slice(0, matched.index))

        messageArr.push({ text : matched[0]})
        messageText = messageText.slice(matched.index + matched[0].length)
      }
      if (messageText.length) messageArr.push(messageText)

      messageInner = (
        <div className="message-inner">
          {messageArr.map((m, i) => (
            typeof m === 'object'
              ? <a key={i} href={m.text} className="message-url" onClick={(event) => {
                let url = !m.text.startsWith('http')
                  ? `https://${m.text}`
                  : m.text
                event.preventDefault()
                shell.openExternal(url)
              }}>{m.text}</a>
              : m
          ))}
        </div>
      )
    }
  } else {
    const images = ['jpg', 'png', 'gif', 'jpeg', 'bmp']
    const extension = JSON.parse(props.message).location.split('.').pop()
    const expired = script.timestampToDay(props.timestamp, 1, 0)

    messageInner =
      <div>
        {(extension && images.indexOf(extension) > -1) && (
          <div
            className="message-thumbnail"
            onClick={() => {
              // window.parent.postMessage({ method: 'image', url: JSON.parse(props.message).location })
              showImageViewer(JSON.parse(props.message).location)
            }}>
            <img src={JSON.parse(props.message).location}
                 alt="message-thumbnail"/>
          </div>
        )}
        <div className="message-file">
          <div className="message-file-name">{JSON.parse(
            props.message).name}</div>
          <div className="message-file-size">파일크기 : {script.bytesToSize(
            JSON.parse(props.message).size)}</div>
          <div className="message-file-expire">유효기간 : {expired} 까지</div>
          <div
            className="message-file-save"
            onClick={() => {
              // setTimeout(() => {
              //   window.open(JSON.parse(props.message).location)
              // }, 100)

              // const directory = process.platform === 'darwin' ? 'Downloads' : 'C:\\Downloads'
              ipcRenderer.send('download', {
                url: JSON.parse(props.message).location
              })
            }}>
            저장하기
          </div>

        </div>
      </div>
  }

  return (
    <>
      {!skipDate() && (
        <div className="message-date">
          <span>{script.timestampToDay(props.timestamp)}</span>
        </div>
      )}

      {(!isSameUser || !skipDate()) && (
        <div className="margin-top-15"></div>
      )}

      { isMyself ? (
        <div className="message myself">
          { !skipTime() && (
            <div className="message-time">{ script.timestampToTime(props.timestamp, true) }</div>
          )}
          { messageInner }
        </div>
      ) : (
        <div className="message opponent">
          <div className="message-profile">
            { (!isSameUser || !skipDate()) && (
              <div className="message-profile-icon"
                style={{ backgroundColor: settings.selectedUser.colorCode }}>
                <div className="bubble"></div>
              </div>
            )}
          </div>
          <div className="message-body">
            { (!isSameUser || !skipDate()) && (
              <div className="message-top">
                <div className="message-name">{ settings.selectedUser.guestCode }</div>
              </div>
            )}
            <div className="message-bottom">
              { messageInner }
              { !skipTime() && (
                <div className="message-time">{ script.timestampToTime(props.timestamp, true) }</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings
})

// export default ChatMessage
export default connect(mapStateToProps)(ChatMessage)
