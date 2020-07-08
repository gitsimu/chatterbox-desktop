import React, { useEffect } from 'react'
import ChatMessage from './ChatMessage'
import EmojiContainer from './EmojiContainer'
import axios from 'axios'
import { connect } from 'react-redux'
import { addMessages, clearMessages, deleteMessages, selectedUser } from '../actions'
import PreviewContainer from './PreviewContainer'
import useImageFile from '../hooks/useImageFile'
import useInputByUser from '../hooks/useInputByUser'

const CONNECTIONS = {}
const Chat = ({ users, messages, settings, addMessages, deleteMessages, clearMessages, selectedUser, ...props }) => {
  const key = settings.key
  const userid = settings.selectedUser.key
  const database = props.database
  const setTabState = props.setTabState
  const target = settings.selectedUser
  const Alert = props.Alert

  const [optionDialog, showOptionDialog] = React.useState(false)
  const [infoDialog, showInfoDialog] = React.useState(false)
  const [emojiContainer, showEmojiContainer] = React.useState(false)
  const [selectedEmoji, selectEmoji] = React.useState(null)
  const [loading, isLoading] = React.useState(false)
  // const [refresh, doRefresh] = React.useState(null)
  const [fileDropLayer, showFileDropLayer] = React.useState(false)
  const [imageSrc, imageFile, setImageFile] = useImageFile()
  const [input, setInputUser] = useInputByUser()
  const body = React.useRef(null)

  let form

  const scrollToBottom = () => {
    body.current.scrollTop = body.current.scrollHeight
  }

  const firebaseConnect = React.useCallback((userid) => {
    // 최초 1회만 연결
    if (!userid || messages[userid]) { return }

    isLoading(true)
    const database = props.database
    const chat = database.ref(`/${settings.key}/messages/${userid}`)
      .orderByChild('timestamp')
      .limitToLast(50)
    chat.on('child_added', (snapshot) => {
      const value = snapshot.val()
      addMessages({ key: userid, value: value })

      setTimeout(() => {
        scrollToBottom()
        isLoading(false)
      }, 10)
    })
    CONNECTIONS[userid] = chat
  }, [messages, props.database, settings.key, addMessages])

  const sendMessage = React.useCallback((key, id, message, type, database) => {
    const messageId = Math.random().toString(36).substr(2, 9)
    const lastMessage = (type === 2) ? JSON.parse(message).name : message.trim()

    database.ref(`/${key}/users/${id}`).update({
      state:1,
      lastMessage: lastMessage,
      timestamp: new Date().getTime()
    })
    database.ref(`/${key}/messages/${id}/${messageId}`).update({
      id: messageId,
      userId: key,
      message: message.trim(),
      type: type,
      timestamp: new Date().getTime()
    })
    setTabState(1)
    showInfoDialog(false)
  }, [setTabState])

  const handleEmojiContainer = () => {
    showEmojiContainer(!emojiContainer)
  }

  const checkFile = React.useCallback((target) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOW_FILE_EXTENSIONS = [
      'jpg', 'jpeg', 'gif', 'bmp', 'png', 'tif', 'tiff', 'tga', 'psd', 'ai', // 이미지
      'mp4', 'm4v', 'avi', 'asf', 'wmv', 'mkv', 'ts', 'mpg', 'mpeg', 'mov',
      'flv', 'ogv', // 동영상
      'mp3', 'wav', 'flac', 'tta', 'tak', 'aac', 'wma', 'ogg', 'm4a', // 음성
      'doc', 'docx', 'hwp', 'txt', 'rtf', 'xml', 'pdf', 'wks', 'wps', 'xps',
      'md', 'odf', 'odt', 'ods', 'odp', 'csv', 'tsv', 'xls', 'xlsx', 'ppt',
      'pptx', 'pages', 'key', 'numbers', 'show', 'ce', // 문서
      'zip', 'gz', 'bz2', 'rar', '7z', 'lzh', 'alz']

    const fileSize = target.size
    const fileExtension = target.name.split('.').pop().toLowerCase()

    if (MAX_FILE_SIZE < fileSize) {
      Alert('한 번에 업로드 할 수 있는 최대 파일 크기는 5MB 입니다.')
      return false
    }

    if (ALLOW_FILE_EXTENSIONS.indexOf(fileExtension) === -1) {
      Alert('지원하지 않는 파일 형식입니다.')
      return false
    }

    return true
  }, [Alert])

  const handleFileInput = React.useCallback((e, file) => {
    const target = file || e.target.files[0]
    if (!checkFile(target)) return

    isLoading(true)
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    const formData = new FormData()

    formData.append('file', target)
    formData.append('key', key)

    return axios.post(`${global.serverAddress}/api/upload`, formData, config)
      .then(res => {
        if (res.data.result === 'success') {
          sendMessage(key, userid, JSON.stringify(res.data.file), 2, database)
          console.log('upload-success', res)
        }
      })
      .catch(err => {
        if (err) {
          console.log('upload-failure', err)
          throw err
        }
      })
      .finally(()=> {isLoading(false)})
  }, [checkFile, database, key, sendMessage, userid])

  // 채팅방 변경 init
  React.useEffect(() => {
    setInputUser(userid)
    input.current.focus()
    showEmojiContainer(false)
    setImageFile(null)
  }, [input, userid, showEmojiContainer, setImageFile, setInputUser])

  // select emoji
  React.useEffect(() => {
    if (selectedEmoji) {
      input.current.value = input.current.value + selectedEmoji.emoji
      input.current.focus()
    }
  }, [input, selectedEmoji])

  // connect fire
  React.useEffect(() => {
    firebaseConnect(userid)

    showInfoDialog((target && target.key === userid) && target.value.state === 2)
    showOptionDialog(false)

    setTimeout(() => {
      scrollToBottom()
    }, 10)
  }, [userid, target, firebaseConnect])

  // file drag&drop
  React.useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDragEnter = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer && e.dataTransfer.types[0] === 'Files') {
        showFileDropLayer(true)
      }
    }

    const handleDragLeave = (e) => {
      e.preventDefault()
      e.stopPropagation()
      showFileDropLayer(false)
    }

    const handleDrop = (e) => {
      e.preventDefault()
      e.stopPropagation()

      showFileDropLayer(false)
      for (let f of e.dataTransfer.files) {
        handleFileInput(e, f)
      }
    }

    /* 파일 드래그&드랍 지원 이벤트
     * dragover
     * dragenter
     * dragleave
     * drop
     */
    if (key) {
      const chatBody = body.current

      /* 이벤트 할당 */
      chatBody.addEventListener('dragenter', handleDragEnter)
      document.getElementById('file-drop-layer').addEventListener('dragover', handleDragOver)
      document.getElementById('file-drop-layer').addEventListener('dragleave', handleDragLeave)
      document.getElementById('file-drop-layer').addEventListener('drop', handleDrop)

      /* 이벤트 해제 */
      return () => {
        chatBody.removeEventListener('dragenter', handleDragEnter)
        document.getElementById('file-drop-layer').removeEventListener('dragover', handleDragOver)
        document.getElementById('file-drop-layer').removeEventListener('dragleave', handleDragLeave)
        document.getElementById('file-drop-layer').removeEventListener('drop', handleDrop)
      }
    }
  }, [key, handleFileInput])

  // chat off
  React.useEffect(() => {
    /* Sign out 등의 이유로 Chat 객체를 내릴 때
     * 연결되어있는 firebase connection을 모두 off 처리한다
     */
    return () => {
      clearMessages()
      Object.keys(CONNECTIONS).forEach((u, i) => {
        console.log('[Connection off]', CONNECTIONS[u])
        if (CONNECTIONS[u]) {
          CONNECTIONS[u].off()
          delete CONNECTIONS[u]
        }
      })
    }
  }, [clearMessages])

  return (
    <>
      <div className='messages card' ref={body}>
        {messages[userid] // 중복호출 예외처리
         && messages[userid].map((m, i) => {
          scrollToBottom()
          return <ChatMessage
            opponent={userid}
            target={target}
            key={m.id}
            prev={messages[userid][i - 1]}
            next={messages[userid][i + 1]}
            {...m}
            {...props}/>
        })
        }

        <div id='file-drop-layer' className={fileDropLayer
          ? 'file-drop-layer active'
          : 'file-drop-layer'}>
          <div>
            <i className='icon-cloud-upload'></i>
            <div>여기에 파일을 드래그하면</div>
            <div>바로 업로드됩니다.</div>
          </div>
        </div>
      </div>
      <div className='message-form'>
        <EmojiContainer
          getState={emojiContainer}
          setState={showEmojiContainer}
          selectEmoji={selectEmoji}/>
        <PreviewContainer
          image={imageSrc}/>
        <form ref={node => form = node} onSubmit={e => {
          e.preventDefault()
          e.stopPropagation()

          if (imageFile) {
            handleFileInput(null, imageFile)
            setImageFile(null)
          }

          if (input.current.value.trim()) {
            sendMessage(key, userid, input.current.value, 1, database)
            input.current.value = ''
          }
        }}>
          <div className='message-addon'>
            <label>
              <i className='icon-paper-clip'></i>
              <input type='file'
                onChange={e => handleFileInput(e)}/>
            </label>
            <label>
              <i className='icon-emotsmile'
                 onClick={e => handleEmojiContainer(e)}></i>
            </label>
          </div>
          <textarea
            ref={input}
            className='message-input'
            placeholder='메세지를 입력해주세요.'
            onBlur={() => {
              setImageFile(null)
            }}
            onPaste={(e) => {
              let item = e.clipboardData.items[0]
              if (!item || !item.type || item.type.indexOf('image') !== 0) return

              const imageFile = item.getAsFile()
              if (checkFile(imageFile)) {
                setImageFile(imageFile)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && imageFile) {
                setImageFile(null)
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                form.dispatchEvent(new Event('submit'))
              }
            }}/>
          <button className='message-button-send' type='submit'>
            <i className='icon-paper-plane'></i>
          </button>
          <div className='message-button-more'
            onClick={() => {
              showOptionDialog(!optionDialog)
            }}>
            <i className='icon-options-vertical'></i>
          </div>
        </form>

        <div className={optionDialog ? 'message-option-dialog' : 'message-option-dialog hide'}>
          <div className='message-option-complete'
            onClick={() => {
              database.ref(`/${key}/users/${userid}`).update({ state: 2 })
              setTabState(2)
              showOptionDialog(false)
              showInfoDialog(true)
              Alert('이 대화가 종료처리 되었습니다.')
            }}>
            <i className='icon-power'></i>대화 종료하기
          </div>
          <div className='message-option-delete'
            onClick={() => {
              /* firebase */
              database.ref(`/${key}/messages/${userid}`).remove()
              database.ref(`/${key}/users/${userid}`).remove()
              /* redux store */
              deleteMessages({ key: userid })
              selectedUser({})
              /* connections */
              CONNECTIONS[userid].off()
              delete CONNECTIONS[userid]

              Alert('이 대화가 삭제처리 되었습니다.')
            }}>
            <i className='icon-trash'></i>대화 삭제하기
          </div>
        </div>

        { infoDialog && (
          <div className='dialog info'>
            <div className='dialog-header'>
              <i className='icon-exclamation'></i>
              <span>Infomation</span>
            </div>
            <div className='dialog-body'>
              <div>이 대화는 이미 종료된 대화입니다.</div>
              <div>메세지를 보내면 다시 활성화됩니다.</div>
            </div>
          </div>
        )}
      </div>

      { loading && (
        <div id='loading'><div></div></div>
      )}
    </>
  )
}

const mapStateToProps = state => ({
  users: state.users,
  messages: state.messages,
  settings: state.settings
})

const mapDispatchToProps = dispatch => ({
  addMessages: m => dispatch(addMessages(m)),
  deleteMessages: m => dispatch(deleteMessages(m)),
  clearMessages: () => dispatch(clearMessages()),
  selectedUser: u => dispatch(selectedUser(u))
})

// export default Chat
export default connect(mapStateToProps, mapDispatchToProps)(Chat)
