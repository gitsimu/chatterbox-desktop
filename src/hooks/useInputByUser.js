import React, { useCallback } from 'react'

const useInputByUser = ()=>{
  const input = React.useRef()
  const lastUser = React.useRef()
  const editing = React.useRef({})

  const setInputUser = useCallback(userid => {
    if(lastUser.current) {
      editing.current[lastUser.current] = input.current.value
    }
    input.current.value = editing.current[userid] || ''

    lastUser.current = userid
  }, [])

  return [input, setInputUser]
}

export default useInputByUser