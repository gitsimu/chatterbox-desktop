import React from 'react'
import * as script from '../js/script'

const ChatMessageImage = ({message, onLoadImage, ...props}) => {
  const {location, name, size} = JSON.parse(message)
  const images = ['jpg', 'png', 'gif', 'jpeg', 'bmp']
  const extension = location.split('.').pop()
  const expired = script.timestampToDay(props.timestamp, 1, 0)

  return (
    <div>
      {(extension && images.indexOf(extension) > -1) && (
        <div
          className="message-thumbnail"
          onClick={() => {
            props.onClick && props.onClick(location)
          }}>
          <img src={location}
               onLoad={()=> {
                 onLoadImage()
               }}
               alt="message-thumbnail"/>
        </div>
      )}
      <div className="message-file">
        <div className="message-file-name">{name}</div>
        <div className="message-file-size">파일크기 : {script.bytesToSize(size)}</div>
        <div className="message-file-expire">유효기간 : {expired} 까지</div>
        <a className="message-file-save" href={location} download={name}>저장하기</a>
      </div>
    </div>
  )
}

export default ChatMessageImage