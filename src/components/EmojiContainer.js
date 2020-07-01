import React from 'react'

const EmojiConatiner = (props) => {
  // https://getemoji.com/
  const emojiSmileys = '😀,😁,😂,🤣,😃,😄,😅,😆,😉,😊,😋,😎,😍,😘,🥰,😗,😙,😚,☺️,🙂,🤗,🤩,🤔,🤨,😐,😑,😶,🙄,😏,😣,😥,😮,🤐,😯,😪,😫,😴,😌,😛,😜,😝,🤤,😒,😓,😔,😕,🙃,🤑,😲,☹️,🙁,😖,😞,😟,😤,😢,😭,😦,😧,😨,😩,🤯,😬,😰,😱,🥵,🥶,😳,🤪,😵,😡,😠,🤬,😷,🤒,🤕,🤢,🤮,🤧,😇,🤠,🤡,🥳,🥴,🥺,🤥,🤫,🤭,🧐,🤓,😈,👿,👹,👺,💀,👻,👽,🤖,💩,😺,😸,😹,😻,😼,😽,🙀,😿,😾'
  const emojiGestures = '👋,🤚,🖐,✋,🖖,👌,✌️,🤞,🤟,🤘,🤙,👈,👉,👆,🖕,👇,👍,👎,✊,👊,🤛,🤜,👏,🙌,👐,🤲,🤝,🙏,✍️,💅,🤳,💪,🦵,🦶,👂,👃,🧠,🦷,🦴,👀,👁,👅,👄,💋'
  React.useEffect(() => {

  },[])

  return (
    <div className={(props.getState === true) ? 'emoji-container active' : 'emoji-container'}>
      <div className="emoji-title">Smileys</div>
      { emojiSmileys && emojiSmileys.split(',').map((m, i) => (
        <div
          key={i}
          className="emoji"
          onClick={(e) => {
            props.selectEmoji({ emoji: e.currentTarget.textContent, timestamp: new Date().getTime() })
            props.setState(false)
          }}>
          {m}
        </div>
      )) }
      <div className="emoji-title">Gestures and Body Parts</div>
      { emojiGestures && emojiGestures.split(',').map((m, i) => (
        <div
          key={i}
          className="emoji"
          onClick={(e) => {
            props.selectEmoji({ emoji: e.currentTarget.textContent, timestamp: new Date().getTime() })
            props.setState(false)
          }}>
          {m}
        </div>
      )) }
    </div>
  )
}

  // <p>😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵😡😠🤬😷🤒🤕🤢🤮🤧😇🤠🤡🥳🥴🥺🤥🤫🤭🧐🤓😈👿👹👺💀👻👽🤖💩😺😸😹😻😼😽🙀😿😾</p>

export default EmojiConatiner
