const template = [
  {
    label: 'Smartlog Desktop',
    submenu: [
      {
        label: 'Smartlog',
        click () { require('electron').shell.openExternal('https://smlog.co.kr') }
      },
      {type: 'separator'},
      {role: 'close', label: '닫기'},
      {role: 'quit', label: '종료'}
    ]
  }
];

module.exports = template;