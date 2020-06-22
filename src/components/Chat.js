import React from 'react';
import ChatMessage from './ChatMessage';
import EmojiContainer from './EmojiContainer';
import axios from 'axios';
import { connect } from 'react-redux';
import { addMessages, deleteMessages, selectedUser } from '../actions'

// const initialState = {messages: []};
// function reducer(state, action) {
//     switch (action.type) {
//       case 'addMessage':
//         return {
//           messages: [...state.messages, action.messages],
//           userid: action.userid,
//         }
//       case 'clearMessage':
//         return {messages: []}
//       default:
//         throw new Error();
//     }
// }

const CONNECTIONS = {};
const Chat = ({ users, messages, settings, addMessages, deleteMessages, selectedUser, ...props }) => {
  const key = settings.key;
  const userid = settings.selectedUser.key;
  const database = props.database;
  const tabState = props.tabState;
  const setTabState = props.setTabState;
  const target = settings.selectedUser;
  // const isLoading = props.isLoading;

  // const [state, dispatch] = React.useReducer(reducer, initialState);
  const [optionDialog, showOptionDialog] = React.useState(false);
  const [infoDialog, showInfoDialog] = React.useState(false);
  const [emojiContainer, showEmojiContainer] = React.useState(false);
  const [selectedEmoji, selectEmoji] = React.useState(null);
  const [loading, isLoading] = React.useState(false);

  const [searchResult, setSearchResult] = React.useState({});
  const [messageId, refresh] = React.useState(null);

  const [fileDropLayer, showFileDropLayer] = React.useState(false);
  const body = React.useRef(null);
  let form, input;

  // React.useEffect(() => {
  //   dispatch({ type: 'clearMessage' });
  //   const chat = database.ref(databaseRef).orderByChild('timestamp');
  //
  //   // 구독
  //   chat.on('child_added', function(snapshot) {
  //     if (snapshot.key === 'userinfo'
  //      || snapshot.key === 'timestamp') return; // ignore userinfo, timestamp
  //
  //     dispatch({
  //       type: 'addMessage',
  //       messages: snapshot.val(),
  //       userid: userid
  //     })
  //     console.log('addMessage', snapshot.val());
  //
  //     setTimeout(() => {
  //       if (body && body.current) {
  //         body.current.scrollTop = body.current.scrollHeight;
  //       }
  //     }, 100)
  //   })
  //
  //   // info dialog
  //   showInfoDialog((target && target.key === userid) && target.value.state === 2)
  //   showOptionDialog(false);
  //
  //   // 구독해제
  //   return () => {
  //     chat.off();
  //   }
  // }, [userid])

  React.useEffect(() => {
    console.log(selectedEmoji);
    if (input && selectedEmoji) {
      input.value = input.value + selectedEmoji.emoji;
    }
  }, [selectedEmoji]);


  React.useEffect(() => {
    firebaseConnect(userid);

    showInfoDialog((target && target.key === userid) && target.value.state === 2)
    showOptionDialog(false);

    setTimeout(() => {
      if (body && body.current) {
        body.current.scrollTop = body.current.scrollHeight;
      }
    }, 10)
  }, [userid])

  React.useEffect(() => {
    if (body && body.current && key) {
      /* 파일 드래그&드랍 지원 이벤트
       * dragover
       * dragenter
       * dragleave
       * drop
       */
      document.getElementById('file-drop-layer').addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })

      body.current.addEventListener('dragenter', (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('enter', e.dataTransfer)
        if (e.dataTransfer) {
          showFileDropLayer(true)
        }
      })

      document.getElementById('file-drop-layer').addEventListener('dragleave', (e) => {
        e.preventDefault()
        e.stopPropagation()
        showFileDropLayer(false)
      })

      document.getElementById('file-drop-layer').addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation();
        showFileDropLayer(false)
        for (let f of e.dataTransfer.files) {
          handleFileInput(e, f);
        }
      })
      /* file upload drag&drop event end */
    }
  }, [])

  const firebaseConnect = (userid) => {
    // 최초 1회만 연결
    if (userid && !messages[userid]) {
      isLoading(true);
      const database = props.database;
      const databaseRef = '/' + settings.key + '/messages/' + userid;

      const chat = database.ref(databaseRef).orderByChild('timestamp').limitToLast(100);
      chat.on('child_added', (snapshot) => {
        addMessages({ key: userid, value: snapshot.val() });
        refresh(snapshot.val().id);

        setTimeout(() => {
          if (body && body.current) {
            body.current.scrollTop = body.current.scrollHeight;
          }
          isLoading(false);
        }, 10)
      })

      CONNECTIONS[userid] = chat;
    }
  }

  const sendMessage = (key, id, message, type, database) => {
    const messageId = Math.random().toString(36).substr(2, 9)
    const lastMessage = (type === 2) ? JSON.parse(message).name : message
    database.ref('/' + key + '/users/' + id).update({
      state:1,
      lastMessage: lastMessage,
      timestamp: new Date().getTime(),
    })
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

  const handleFileInput = (e, file) => {
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData();
    console.log(e.target.files);
    formData.append('file', file ? file : e.target.files[0]);
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
    showEmojiContainer(!emojiContainer)
  }

  return (
    <>
      <div className="messages card" ref={body}>
        { (messages[userid]) &&  // 중복호출 예외처리
           (messages[userid].map((m, i) => (
           <ChatMessage
             opponent={userid}
             target={target}
             key={m.id}
             prev={messages[userid][i - 1]}
             {...m}
             {...props}
             />
           )))
        }

        <div className={ fileDropLayer ? "file-drop-layer active" : "file-drop-layer" }
          id="file-drop-layer">
          <div>
            <i className="icon-cloud-upload"></i>
            <div>여기에 파일을 드래그하면</div>
            <div>바로 업로드됩니다.</div>
          </div>
        </div>
      </div>
      <div className="message-form">
        <EmojiContainer
          getState={emojiContainer}
          setState={showEmojiContainer}
          selectEmoji={selectEmoji}/>
        <form ref={node => form = node} onSubmit={e => {
          e.preventDefault()
          if (!input.value.trim()) return

          sendMessage(key, userid, input.value, 1, database);
          input.value = ''
        }}>
          <div className="message-addon">
            <label>
              <i className="icon-paper-clip"></i>
              <input type="file"
                onChange={e => handleFileInput(e)}/>
            </label>
            <label>
              <i className="icon-emotsmile"
                onClick={e => handleEmojiContainer(e)}></i>
            </label>
          </div>
          <textarea
            ref={node => input = node}
            className="message-input"
            placeholder="메세지를 입력해주세요."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                form.dispatchEvent(new Event('submit'))
              }
            }}/>
          <button className="message-button-send" type="submit">
            <i className="icon-paper-plane"></i>
          </button>
          <div className="message-button-more"
            onClick={() => {
              showOptionDialog(!optionDialog);

              // search test
              // const search = database.ref('/' + key + '/messages/' + userid).orderByChild('message').startAt(input.value).endAt(input.value + "\uf8ff");
              // const search = database.ref('/' + key + '/messages').orderByChild('message').startAt("[a-zA-Z0-9]*").endAt(input.value)
              // search.once('value').then(c => console.log(input.value, c.val()));
              // searchMessage();
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
            onClick={() => {
              /* firebase */
              database.ref('/' + key + '/messages/' + userid).remove();
              database.ref('/' + key + '/users/' + userid).remove();
              /* redux store */
              deleteMessages({ key: userid });
              selectedUser({});
              /* connections */
              CONNECTIONS[userid].off();
              delete CONNECTIONS[userid];

              alert('이 대화가 삭제처리 되었습니다.')
            }}>
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

      { loading && (
        <div id="loading"><div></div></div>
      )}
    </>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  messages: state.messages,
  settings: state.settings,
})

const mapDispatchToProps = dispatch => ({
  addMessages: m => dispatch(addMessages(m)),
  deleteMessages: m => dispatch(deleteMessages(m)),
  selectedUser: u => dispatch(selectedUser(u)),
})

// export default Chat
export default connect(mapStateToProps, mapDispatchToProps)(Chat);
