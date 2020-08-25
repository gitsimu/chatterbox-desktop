import React from 'react'
import { connect } from 'react-redux'
import * as smlog from '../js/smlog'
import * as script from '../js/script.js'

const FraudClick = ({ settings, ...props }) => {
  const [fraudClickTabState, setFraudClickTabState] = React.useState(0)
  const [data1, setData1] = React.useState(null)
  const [data2, setData2] = React.useState(null)

  React.useEffect(() => {
    let s = new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setHours(0, 0, 0, 0))
    let e = new Date(new Date().setHours(23, 59, 59, 59))

    const request1 = {
      method: 'ip_ad_dn',
      svid: 1240,
      page: 1,
      si_date: Math.floor(s / 1000),
      ei_date: Math.floor(e / 1000),
      sr_1: 3
    }
    smlog.API(request1).then(data => {
      setData1(data.data)
      console.log(data.data)
    })
  }, [])

  return (
    <div>
      <div className="fraudclick-item">
        <div></div>
      </div>
      {data1 && fraudClickTabState === 0 && (
        data1.map((item, index) => {
          return (<div className="fraudclick-item">
            <div>{item.ip}</div>
            <div>{item.ad_click}</div>
            <div>{item.art_visit_time}</div>
            <div>{item.tr_text}</div>
          </div>)
        })
      )}
    </div>
  )
}

const mapStateToProps = state => ({
  settings: state.settings
})

// export default ChatMessage
export default connect(mapStateToProps)(FraudClick)