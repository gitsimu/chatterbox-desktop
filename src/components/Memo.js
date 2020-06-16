import React from 'react';
import { connect } from 'react-redux';

const Memo = ({ users, settings, ...props }) => {
  const key = settings.key;
  const database = props.database;
  const userid = settings.selectedUser.key;

  const m = (settings.selectedUser.value &&
            settings.selectedUser.value.memo) ?
            settings.selectedUser.value.memo : '';
  const [memo, setMemo] = React.useState(m);

  React.useEffect(() => {
    setMemo(m);
  }, [settings.selectedUser]);

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
              if (memo.length > 200) {
                alert('메모는 200자를 넘길 수 없습니다.');
                return;
              }

              database.ref('/' + key + '/users/' + userid).update({ memo: memo })
              alert('메모를 저장하였습니다.');
            }}>메모 저장하기</div>
        )}
      </div>

    </div>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings,
})

// export default Memo;
export default connect(mapStateToProps)(Memo);
