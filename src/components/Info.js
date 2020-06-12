import React from 'react';

const Info = (props) => {
  const userInfo = users.filter((f) => { return f.key == userid });

  const i = (userInfo.length > 0 &&
            userInfo[0]) ?
            userInfo[0] : '';
  const [info, setInfo] = React.useState(m);
  React.useEffect(() => {
    setMemo(i);
  }, [props]);

  return (
    <div className="chat-info card">
      <div className="chat-info-header">사용자 정보</div>
      <div className="chat-info-body">
      </div>
    </div>
  )
}

export default Info;
