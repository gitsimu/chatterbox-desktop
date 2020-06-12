import React from 'react';
import ChatMessage from './ChatMessage';
import axios from 'axios';

const initialState = {messages: []};

function reducer(state, action) {
    switch (action.type) {
      case 'addMessage':
        return {
          messages: [...state.messages, action.messages],
          userid: action.userid,
        }
      case 'clearMessage':
        return {messages: []}
      default:
        throw new Error();
    }
}

const Chat = (props) => {
  const key = props.keycode;
  const userid = props.userid;
  const database = props.database;
  const databaseRef = props.databaseRef + '/' + userid;
  const tabState = props.tabState;
  const setTabState = props.setTabState;
  const users = props.users;
  const isLoading = props.isLoading;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [optionDialog, showOptionDialog] = React.useState(false);
  const [infoDialog, showInfoDialog] = React.useState(false);
  const body = React.useRef(null)
  let input

  React.useEffect(() => {
    dispatch({ type: 'clearMessage' });
    const chat = database.ref(databaseRef).orderByChild('timestamp');

    // 구독
    chat.on('child_added', function(snapshot) {
      if (snapshot.key === 'userinfo'
       || snapshot.key === 'timestamp') return; // ignore userinfo, timestamp

      dispatch({
        type: 'addMessage',
        messages: snapshot.val(),
        userid: userid
      })

      setTimeout(() => {
        if (body && body.current) {
          body.current.scrollTop = body.current.scrollHeight;
        }
      }, 100)
    })

    // info dialog
    const target = users.filter((f) => { return f.key === userid })[0];
    if (target && target.key === userid && target.value.state === 2) {
      showInfoDialog(true);
    }
    else {
      showInfoDialog(false);
    }

    // 구독해제
    return () => {
      chat.off();
    }
  }, [userid])

  // useEffect(() => {
  //   return () => setLoading(false); // cleanup
  // }, []);

  const sendMessage = (key, id, message, type, database) => {
    const messageId = Math.random().toString(36).substr(2, 9)
    database.ref('/' + key + '/users/' + id).update({ state:1 })
    database.ref('/' + key + '/messages/' + id + '/' + messageId).update({
      id: messageId,
      userId: key,
      message: message,
      type: type,
      timestamp: new Date().getTime()
    })
    setTabState(1)
    showInfoDialog(false);
  }

  const handleFileInput = (e) => {
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('key', key);

    isLoading(true);

    return axios.post(global.serverAddress + '/api/upload', formData, config)
      .then(res => {
        console.log('upload-success', res);
        isLoading(false);

        if (res.data.result === 'success') {
          sendMessage(key, userid, JSON.stringify(res.data.file), 2, database);
        }
      })
      .catch(err => {
        console.log('upload-failure', err);
        isLoading(false);
      })
  }
  const handleEmojiContainer = (e) => {

  }

  return (
    <>
      <div className="messages card" ref={body}>
        { (state.userid === userid) &&  // 중복호출 예외처리
          (state.messages.map((m, i) => (
          <ChatMessage
            opponent={userid}
            key={m.id}
            prev={state.messages[i - 1]}
            {...m}
            />
        ))) }
      </div>
      <div className="message-form">
        <form onSubmit={e => {
          e.preventDefault()
          if (!input.value.trim()) return

          sendMessage(key, userid, input.value, 1, database);
          input.value = ''
        }}>
          <div className="message-addon">
            <label>
              <i className="icon-paper-clip"></i>
              <input type="file" onChange={e => handleFileInput(e)}/>
            </label>
            <label>
              <i className="icon-emotsmile"
                onClick={e => handleEmojiContainer(e)}></i>
            </label>
          </div>
          <input className="message-input" ref={node => input = node} placeholder="메세지를 입력해주세요."/>
          <button className="message-button-send" type="submit">
            <i className="icon-paper-plane"></i>
          </button>
          <div className="message-button-more"
            onClick={() => {
              showOptionDialog(!optionDialog);
            }}>
            <i className="icon-options-vertical"></i>
          </div>
        </form>

        <div className={optionDialog ? "message-option-dialog" : "message-option-dialog hide"}>
          <div className="message-option-complete"
            onClick={() => {
              database.ref('/' + key + '/users/' + userid).update({ state: 2 })
              setTabState(2)
              showOptionDialog(false)
              showInfoDialog(true)
              alert('이 대화가 종료처리 되었습니다.')
            }}>
            <i className="icon-power"></i>대화 종료하기
          </div>
          <div className="message-option-delete"
            onClick={() => {}}>
            <i className="icon-trash"></i>대화 삭제하기
          </div>
        </div>

        { infoDialog && (
          <div className="dialog info">
            <div className="dialog-header">
              <i className="icon-exclamation"></i>
              <span>Infomation</span>
            </div>
            <div className="dialog-body">
              <div>이 대화는 이미 종료된 대화입니다.</div>
              <div>메세지를 보내면 다시 활성화됩니다.</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Chat
