import {store} from '../index'
import {sessionRestore} from '../actions'
import axios from 'axios'
import './global.js'

export const AUTH = async req => {
  let body = ''
  Object.keys(req).forEach((o, i) => {
    body += `${o}=${Object.values(req)[i]}&`
  })

  const postResponse = await fetch(`${global.server.auth}`, {
    method: 'POST',
    dataType: 'json',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: body
  })

  const postData = await postResponse.json()
  return postData
}

let RESTORE_COUNT = 0
export const API = async (req, isLoading) => {
  const user = store.getState().settings
  
  if (!user || !user.sessionKey || !user.sessionToken || !user.userName) {
    return
  } else {
    isLoading && isLoading(true)
    
    const request = req
    request.sskey = user.sessionKey
    request.member_token = user.sessionToken
    request.member_id = user.userName

    const formData = new FormData()
    for ( var key in request ) {
      formData.append(key, request[key])
    }

    const config = {headers: {'content-type': 'multipart/form-data'}}
        
    const postResponse = await axios.post(global.server.api, formData, config)
    const postData = postResponse.data

    if (postData.code === 1337 && RESTORE_COUNT < 3) {
      RESTORE_COUNT++;
      console.log('API Request rejected[1337] : retry count ', RESTORE_COUNT, user);
      
      // session expired
      return Promise.resolve()
        .then(() => {
          return AUTH({
            method: 'login_pc_by_token',
            login_member_id: user.userName,
            login_token: user.userToken
          })
        })
        .then((data) => {
          console.log('API session restore ', data)
          return store.dispatch(
            sessionRestore({
              sessionKey: data.sskey,
              sessionToken: data.member_token
            })
          )
        })
        .then(() => {
          return API(req, isLoading)
        })
    } else {
      return postData
    }    
  }
}
