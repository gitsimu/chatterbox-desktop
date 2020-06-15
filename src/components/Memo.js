import React from 'react';

const Memo = (props) => {
  const users = props.users;
  const key = props.keycode;
  const userid = props.userid;
  const database = props.database;
  const userInfo = users.filter((f) => { return f.key === userid });

  const m = (userInfo.length > 0 &&
            userInfo[0].value &&
            userInfo[0].value.memo) ?
            userInfo[0].value.memo : '';
  const [memo, setMemo] = React.useState(m);

  React.useEffect(() => {
    setMemo(m);    
  }, [props]);

  return (
    <div className="chat-memo card">
      <div className="chat-memo-header">사용자 메모</div>
      <div className="chat-memo-body">
        <textarea
          placeholder="메모를 입력해주세요."
          value={memo}
          onChange={(e) => { setMemo(e.target.value) }}>
        </textarea>
      </div>


      <div className="chat-memo-footer">
        {(userid && userid !== '') && (
          <div
            onClick={() => {
              database.ref('/' + key + '/users/' + userid).update({ memo: memo })
              alert('메모를 저장하였습니다.');
            }}>메모 저장하기</div>
        )}
      </div>

    </div>
  )
}

export default Memo;
