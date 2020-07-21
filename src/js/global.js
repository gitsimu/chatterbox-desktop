/* Local test server */
// global.serverAddress = 'http://localhost:3000'

/* JaeHeon's test server */
// global.serverAddress = 'http://13.124.219.39'

/* Prod server */
global.server = {
  auth: 'https://smlog.co.kr/api/app_auth.php',
  api: 'https://smlog.co.kr/api/app_api.php',
  chat: 'https://chat.smlog.co.kr'
}

global.smlog = {
  api: async (req, isLoading, userdata) => {
    isLoading && isLoading(true)

    let body = ''
    Object.keys(req).forEach((o, i) => {
      body += `${o}=${Object.values(req)[i]}&`
    })

    if (userdata) {
      body += `sskey=${userdata.sessionKey}&`
      body += `member_token=${userdata.userToken}&`
      body += `member_id=${userdata.userName}`
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
