import {store} from '../index'
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

export const API = async (req, isLoading) => {
  const user = store.getState().settings

  if (!user || !user.sessionKey || !user.sessionToken || !user.userName) {
    return
  } else {
    isLoading && isLoading(true)

    let body = ''
    Object.keys(req).forEach((o, i) => {
      body += `${o}=${Object.values(req)[i]}&`
    })

    if (user) {
      body += `sskey=${user.sessionKey}&`
      body += `member_token=${user.sessionToken}&`
      body += `member_id=${user.userName}`
    }

    const postResponse = await fetch(`${global.server.api}`, {
      method: 'POST',
      dataType: 'json',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: body
    })

    isLoading && isLoading(false)
    const postData = await postResponse.json()
    return postData
  }
}
