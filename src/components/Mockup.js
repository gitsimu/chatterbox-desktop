import React from 'react';

const Mockup = (props) => {

  return (
    <div className="chat-window">
      <div className="header" style={{ backgroundColor: props.themeColor}}>
        <div className="header-title">
          <div className="mainTitle">{props.title}</div>
          <div className="subTitle">{props.subTitle}</div>
        </div>
        <div className="header-close"></div>
      </div>
      <div className="chat-window-body">
        <div className="message opponent">
          <div className="message-profile">
            <div className="message-profile-icon">S</div>
          </div>
          <div className="message-body">
            <div className="message-top">
              <div className="message-name">{props.nickname}</div>
            </div>
            <div className="message-bottom">
              <div className="message-inner">{props.firstMessage}</div>
              <div className="message-time">오전 10:57</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Mockup;
