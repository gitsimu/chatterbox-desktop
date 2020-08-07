import React from 'react'
import { connect } from 'react-redux'

const ChatManager = ({ settings, ...props }) => {
  const database = props.database
  const [managers, setManagers] = React.useState(null)

  React.useEffect(() => {
    const ref = database.ref()
    ref.on('value', (snapshot) => {
      console.log('ChatManager11', snapshot.val())

      let items = []
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.hasChild('messages')) {
          items.push({key: childSnapshot.key,value: childSnapshot.val()})
        }
      })

      console.log('items', items)
      setManagers(items)
    })

    return () => {ref.off()}
  }, [database, settings.key])

  return (
    <div>
      {managers && managers.map((m, i) => {
        return (
          <div key={i}>
            <div>{m.key}</div>
            <div>{Object.keys(m.value.messages).length}</div>
          </div>
        )
      })}
    </div>
  )
}

const mapStateToProps = state => ({
  settings: state.settings
})

// export default ChatMessage
export default connect(mapStateToProps)(ChatManager)
