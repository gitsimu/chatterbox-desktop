import React from 'react'
import { connect } from 'react-redux'
import { changeUserState, initUserState } from '../actions'
import * as script from '../js/script.js'
import * as smlog from '../js/smlog'

let _dailyVisitor
let _visitors = []
const Visitor = ({ users, settings, changeUserState, initUserState, ...props }) => {
  const [domains, setDomains] = React.useState([])
  const [visitors, setVisitors] = React.useState([])  
  const [selectedDomain, selectDomain] = React.useState(null)
  const [connectedUser, setConnectedUser] = React.useState(null)

  const [visitPages, setVisitPages] = React.useState([])
  const [visitTimeAverage, setVisitTimeAverage] = React.useState(null)
  const [deviceRatio, setDeviceRatio] = React.useState({pc: 50, mobile: 50})
  const [visitorDetail, setVisitorDetail] = React.useState(null)
  const body = React.useRef(null)

  const screenState = props.screenState
  const setScreenState = props.setScreenState
  const setTabState = props.setTabState
  const selectedUser = props.selectedUser

  const realtimeVisitors = React.useCallback(() => {
    if (selectedDomain && screenState === 1) {
      smlog.API({
        method: 'daily_visitor'
      })
      .then(data => {
        const now = Math.floor(new Date(new Date().setMinutes(0, 0)) / 1000)
        const daily = []
        const timeArray = []
        const todayArray = []
        const yesterdayArray = []

        for (let i = 0; i < 24; i++) {
          const prev = i === 0
              ? Math.floor(new Date(new Date().setMinutes(59, 59)).getTime() / 1000)
              : now - ((i - 1) * 60 * 60)
          const time = now - (i * 60 * 60)
          const today = data.filter(function(d) {
              return parseInt(d.ipt_up_date) > time
                  && parseInt(d.ipt_up_date) < prev
          })
          const yesterday = data.filter(function(d) {
              return parseInt(d.ipt_up_date) > (time - 86400)
                  && parseInt(d.ipt_up_date) < (prev - 86400)
          })
          daily.push({time: time, arr: today})
          timeArray.push(timeConvert(time))
          todayArray.push(today.length)
          yesterdayArray.push(yesterday.length)
        }

        const todayTotal = todayArray.reduce(function(a, b) { return a + b }, 0)
        const yesterdayTotal = yesterdayArray.reduce(function(a, b) { return a + b }, 0)

      })

      smlog.API({
        method: 'get_live_feed2',
        sid: selectedDomain,
        svid : selectedDomain,
      })
      .then((data) => {
        if (typeof(data) !== 'object') return
        console.log('visitors', data)
        data = data.filter(f => { return f.livid !== 99999999})

        try {
          const inflowData = data.filter(comparer(_visitors))
          const outflowData = _visitors.filter(comparer(data))

          console.log('inflowData', inflowData)
          console.log('outflowData', outflowData)

          outflowData.forEach(item => {
            document.getElementById(item.livid).className = "visitor-item to-be-deleted"
          })
          
          _visitors = data

          /* VISIT PAGE GRAPH START */
          const arr = []
          let maxValue = 10
          let allCount = data.length
          let totalVisitTime = 0          
          
          data.forEach(d => {
            const r = /((ftp|http|https):\/\/)?/g
            const url = decodeURIComponent(d.liv_url_decode.replace(r, ''))
            const split = url.split('?')
            const origin = split[0]
            const path = origin.slice(origin.indexOf('/'))
            const search = split.length > 1 ? split[1] : ''
            const session = d.liv_ck
            const ip = d.liv_ip_text
            const itype = d.liv_itype_text
            const keyword = d.liv_keyword

            let second = ''
            if (origin.indexOf('www.') > -1) {
              second = 'www'
            } else if (origin.indexOf('m.') > -1) {
              second = 'm'
            }
            
            const target = arr.filter(a => { return a.url.split('?')[0] === origin })
            if (target.length === 0) {
              arr.push({url: url, value: 1, origin: origin, path: path, second: second, search: [search], session: [session], ip: [ip], itype: [itype], keyword: [keyword]})
            } else {
              const value = ++target[0].value
              target[0].search.push(search)
              target[0].session.push(session)
              target[0].ip.push(ip)
              target[0].itype.push(itype)
              target[0].keyword.push(keyword)
              maxValue = maxValue > value ? maxValue : value
            }

            totalVisitTime += parseInt(d.liv_visit_time_num)
          })

          /* SUMMARY DATA START */
          const _visitTimeAverage = () => {
            if (data.length === 0) {
              return '-'
            } else {
              const average = totalVisitTime / data.length
              let hours = Math.floor(average / 3600)
              let minutes = Math.floor(average / 60) - (hours * 60)
              let seconds = Math.floor(average % 60)
              hours = hours !== 0 ? hours + '시 ' : ''
              minutes = minutes !== 0 ? minutes + '분 ' : ''
              seconds += '초'

              return hours + minutes + seconds
            }
          }      
          const _deviceRatio = () => {
            const total = data.length
            if (total === 0) {
              return {pc: 50, mobile: 50}
            } else {
              const mobile = data.filter(function(d) { return d.liv_mobile && (d.liv_mobile.trim() !== '') }).length
              const pc = total - mobile

              return {pc: pc / total * 100, mobile: mobile / total * 100}
            }
          }    
          
          setTimeout(() => {
            setVisitors(data.reverse())
            setVisitPages(arr)
            setVisitTimeAverage(_visitTimeAverage())
            setDeviceRatio(_deviceRatio())
          }, 500)
          

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

  const colorSet = (alpha) => {
    return [
      'rgba(255, 99, 132, ' + alpha + ')',
      'rgba(255, 159, 64, ' + alpha + ')',
      'rgba(255, 205, 86, ' + alpha + ')',
      'rgba(75, 192, 192, ' + alpha + ')',
      'rgba(54, 162, 235, ' + alpha + ')',
      'rgba(153, 102, 255, ' + alpha + ')',
      'rgba(201, 203, 207, ' + alpha + ')',
    ]
  }

  const timeConvert = (time) => {
    let
        timestamp = time * 1000,
        month = new Date(timestamp).getMonth() + 1,
        date = new Date(timestamp).getDate(),
        hours = new Date(timestamp).getHours()

    month = month > 9 ? month : '0' + month
    date = date > 9 ? date : '0' + date
    hours = hours > 9 ? hours : '0' + hours

    // return `${month}/${date} ${hours}시`
    return hours + '시'
  }

  return (
    <div className="container">
      <div className="visitor-title">내 사이트 실시간 방문자</div>
      <div className="visitors">        
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
        {/* statistics */}
        <div className="visitor-container" ref={body} id="visitor-container">
          {visitors.length > 1 && visitPages.length > 1 && (
            <>
            <div className="statistics-container">
              <div>
                <div className="statistics">
                  <div className="statistics-body">
                    <div className="statistics-title">접속 중인 방문자</div>
                    <div className="statistics-value value1">{visitors.length}</div>
                  </div>
                </div>
                <div className="statistics">
                  <div className="statistics-body">
                    <div className="statistics-title">활성화된 페이지 수</div>
                    <div className="statistics-value value2">{visitPages.length}</div>
                  </div>
                </div>
                <div className="statistics">
                  <div className="statistics-body">
                    <div className="statistics-title">평균 체류시간</div>
                    <div className="statistics-value value3">{visitTimeAverage}</div>
                  </div>
                </div>
                <div className="statistics">
                  <div className="statistics-body">
                    <div className="statistics-title">PC/Mobile 비율</div>
                    <div className="statistics-value value4">
                      <div className="pc" data-value={`PC : ${deviceRatio.pc.toFixed(2)}%`} style={{width: `${deviceRatio.pc}%`}}></div>
                      <div className="mobile" data-value={`Mobile : ${deviceRatio.mobile.toFixed(2)}%`} style={{width: `${deviceRatio.mobile}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="statistics statistics-full">
                  <div className="statistics-body">
                    <div className="statistics-title">시간대별 고유세션 수 (최근 24시간)</div>
                    <div className="statistics-value"><canvas id="daily_visitor" height="140" width="700"></canvas></div>
                    <div className="statistics-status">
                      <div className="statistics-status-data"></div>
                      <div>전일 대비</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>            
            <div className="page-container">
              <div>
                {/* page */}
                <div className="page-list">
                  <div className="page-list-head">
                    <div className="address">URL</div>
                    <div className="count">방문자 수</div>
                    <div className="percent">비율</div>
                  </div>
                  <div className="page-list-body">
                    {visitPages.map((item, index) => {
                      let percent = (item.value/visitors.length * 100)
                      let setNumber

                      if (percent >= 50) { setNumber = 0 }
                      else if (percent >= 40) { setNumber = 1 }
                      else if (percent >= 30) { setNumber = 2 }
                      else if (percent >= 20) { setNumber = 3 }
                      else if (percent >= 10) { setNumber = 4 }
                      else { setNumber = 6 }
                      percent = percent.toFixed(2)

                      return (
                        <div className="page" onClick={() => {
                          const session = item.session
                          const ip = item.ip
                          const itype = item.itype
                          const keyword = item.keyword
                          let visitorArray = []

                          item.search.forEach((s, i) => {
                            let searchArray = []
                            s.split('&').forEach(ss => {
                              const v = ss.split('=')
                              if (v[0] && v[0] !== '' && v[1] && v[1] !== '') {
                                const key = decodeURIComponent(v[0])
                                const value = decodeURIComponent(v[1])
                                const exception = ['gclid','gcl_keyword','DMCOL,DMSKW,DMKW','SMTGNT']

                                // 일부 파라미터는 표시하지않음
                                if (key.indexOf('n_') === 0) { return }
                                else if (exception.filter(function(e) { return key === e}).length > 0) { return }
                                else {
                                    searchArray.push({key: key, value: value})
                                }
                              }
                            })

                            visitorArray.push({
                              session: session[i],
                              ip: ip[i],
                              itype: itype[i],
                              keyword: keyword[i],
                              search: searchArray
                            })
                          })

                          setVisitorDetail(visitorArray)
                        }}>
                          <div className="background-percent" style={{width: `${percent}%`, backgroundColor: colorSet(0.2)[setNumber], outlineColor: colorSet(0.4)[setNumber]}}></div>
                          <div className="address"><span>{item.second}</span>{item.path}</div>
                          <div className="count">{item.value}</div>
                          <div className="percent" style={{color: colorSet(1)[setNumber]}}>{`${percent}%`}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div>
                {/* visitor */}
                <div className="visitor-list">
                  <div className="visitor-list-head">
                    <div className="num">No.</div>
                    <div className="session">세션 ID</div>
                    <div className="ip">IP</div>
                    <div className="itype">유입종류</div>
                    <div className="keyword">키워드</div>
                  </div>
                  <div className="visitor-list-body">
                    {visitorDetail && visitorDetail.map((item, index) => {
                      return (
                        <div>
                          <div className="visitor" onClick={() => {
                            // body.current.scrollTop = body.current.scrollHeight
                            const target = document.getElementById(item.session)
                            const others = document.querySelectorAll('.visitor-highlight')
                            others.forEach(o => {
                              o.classList.remove('visitor-highlight')
                            })
                            target.classList.add('visitor-highlight')
                            document.getElementById('visitor-container').scrollTo({
                              top: target.offsetTop - 100 || 0,
                              behavior:"smooth"
                            })                            
                          }}>
                            <div className="num">{index + 1}</div>
                            <div className="session">{item.session}</div>
                            <div className="ip">{item.ip}</div>
                            <div className="itype">{item.itype}</div>
                            <div className="keyword">{item.keyword}</div>
                          </div>
                          {item.search && (
                            <div className="visitor-param">
                              {item.search.map((item, index) => {
                                return (
                                  <div class="param">
                                    <span class="param-key">{item.key}</span>
                                    <span class="param-value">{item.value}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
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
                  <div className="visitor-item" key={item.livid} id={item.liv_ck}
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
