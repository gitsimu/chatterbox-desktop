import React from 'react'
import { connect } from 'react-redux'
import { changeUserState, initUserState } from '../actions'
import * as script from '../js/script.js'
import * as smlog from '../js/smlog'

let _visitors = []
const Visitor = ({ users, settings, changeUserState, initUserState, ...props }) => {
  const [domains, setDomains] = React.useState([])
  const [visitors, setVisitors] = React.useState([])
  const [selectedDomain, selectDomain] = React.useState(null)
  const [connectedUser, setConnectedUser] = React.useState(null)  

  const screenState = props.screenState
  const setScreenState = props.setScreenState
  const setTabState = props.setTabState
  const selectedUser = props.selectedUser

  const realtimeVisitors = React.useCallback(() => {
    if (selectedDomain && screenState === 1) {
      smlog.API({
        method: 'get_live_feed2',
        sid: selectedDomain,
        svid : selectedDomain,
      })
      .then((data) => {
        console.log('visitors', data)
        
        try {
          const inflowData = data.filter(comparer(_visitors))
          const outflowData = _visitors.filter(comparer(data))

          console.log('inflowData', inflowData)
          console.log('outflowData', outflowData)

          outflowData.forEach(item => {
            document.getElementById(item.livid).className = "visitor-item to-be-deleted"          
          })

          setTimeout(() => {
            setVisitors(data)
          }, 500)
          
          _visitors = data
        }
        catch (err) {
          console.log(err)
        }
      })
    }
  }, [screenState, selectedDomain])

  React.useEffect(() => {
    smlog.API({
      method: 'domains_data',
      username: settings.userName
    })
    .then(({data}) => {
      setDomains(data)      
    })

    return () => {
      setDomains([])
      setVisitors([])
      selectDomain(null)
      setConnectedUser(null)
    }
  }, [settings.userName])

  React.useEffect(() => {
    realtimeVisitors()
    const interval = setInterval(() => {        
        realtimeVisitors()
      }
    , 5000)

    return () => {      
      clearInterval(interval)
    }
  }, [realtimeVisitors])

  const comparer = (otherArray) => {
    return function(current){
        return otherArray.filter(function(other){
            return other.livid === current.livid && other.liv_ck === current.liv_ck
        }).length === 0
    }
  }

  return (
    <div className="visitor-container">
      <div className="visitor-title">내 사이트 실시간 방문자</div>
      <div className="visitor">        
        <div className="domain-list">
          <div className="domain-list-title">도메인 목록</div>
          {domains.length > 0 ?
            (
              domains.map((item, index) => {
                if (item.sid !== null) {
                  return (
                    <div key={index}
                      className={(selectedDomain === item.sid) ? "domains active" : "domains"} 
                      onClick={() => {
                        selectDomain(item.sid)
                      }}>
                      <div className="domain-icon"></div>
                      <div className="domain-text">{item.s_domain}</div>
                    </div>
                  )
                }
              })
            ) : (
              <div className="domains-empty" style={{fontSize: 14, paddingLeft: 28}}>사용 중인 도메인이 없습니다.</div>
            )
          }
        </div>
        <div className="visitor-list">
          {visitors.length > 1 && (
            <div className="visitor-item visitor-item-head">
              <div className="os">OS</div>
              <div className="bs">BS</div>
              <div style={{flex: 2}}>세션 ID</div>
              <div style={{flex: 1}}>IP</div>            
              <div style={{flex: 1}}>광고클릭수</div>
              <div style={{flex: 1}}>유입종류</div>
              <div style={{flex: 1}}>키워드</div>
              <div style={{flex: 1}}>체류시간</div>
              <div style={{flex: 1}}>최근방문시간</div>
              <div style={{flex: 1}}>채팅내역</div>
            </div>
          )}
          {visitors.length > 1 && (
            visitors.map((item, index) => {
              if (item.livid !== 99999999) {
                const osIcon = item.os_icon.replace(/\/img/g, 'http://smlog.co.kr/img')
                const bsIcon = item.bs_icon.replace(/\/img/g, 'http://smlog.co.kr/img')
                const itype = item.liv_itype.replace(/\/img/g, 'http://smlog.co.kr/img').replace(/<br>/g, '')                
                const longIP = String(script.dot2num(item.liv_ip_text))                
                const user = users.filter(u => {
                  return u.value.ip === longIP
                })                

                return (
                  <>
                  <div className="visitor-item" key={item.livid} id={item.livid}
                    onClick={() => {
                      if (user.length === 0) { 
                        return
                      } else if (!connectedUser || connectedUser.id !== item.livid) {
                        setConnectedUser({id: item.livid, user: user})
                      } else {
                        setConnectedUser(null)
                      }
                    }}>
                    <div className="os" dangerouslySetInnerHTML={{__html: osIcon}}></div>
                    <div className="bs" dangerouslySetInnerHTML={{__html: bsIcon}}></div>
                    <div style={{flex: 2}}>{item.liv_ck}</div>
                    <div style={{flex: 1}}>{item.liv_ip_text}</div>                    
                    <div style={{flex: 1}}>{item.liv_click}</div>
                    <div style={{flex: 1}} dangerouslySetInnerHTML={{__html: itype}} className="itype"></div>
                    <div style={{flex: 1}}>{item.liv_keyword}</div>
                    <div style={{flex: 1}}>{item.liv_visit_time}</div>
                    <div style={{flex: 1}}>{item.liv_up_date}</div>
                    <div className="history">{user.length > 0 ? user.length : '-'}</div>
                  </div>
                  
                  {connectedUser && connectedUser.id === item.livid && (
                    <div className="connected-user-container">
                      {connectedUser.user.length > 0 && 
                      connectedUser.user.map((item, index) => {
                        const state = ['대기', '진행 중', '종료']
                        const userState = item.value.state ? item.value.state : 0

                        return (
                          <div className="connected-user" key={item.key}
                            onClick={() => {
                              setScreenState(0)
                              setTabState(item.value.state)
                              selectedUser(item)
                            }}>
                            <div className="connected-user-icon" style={{backgroundColor: item.colorCode}}>
                              <div className="bubble"></div>
                            </div>
                            <div className="connected-user-name">{item.guestCode}</div>                            
                            <div className="connected-user-message">{item.value.lastMessage}</div>
                            <div className="connected-user-datetime">{script.getNiceTime(item.value.timestamp, new Date(), 1, true)}</div>
                            <div className="connected-user-state">{state[userState]}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  </>
                )
              }
            })
          )}
          {visitors.length <= 1 && (
            <div className="visitor-empty">접속 중인 사용자가 없습니다</div>
          )}
        </div>
      </div>
    </div>    
  )
}

const mapStateToProps = state => ({
  users: state.users,
  settings: state.settings
})
const mapDispatchToProps = dispatch => ({
  changeUserState: u => dispatch(changeUserState(u)),
  initUserState: () => dispatch(initUserState())
})

// export default UserList
export default connect(mapStateToProps, mapDispatchToProps)(Visitor)
