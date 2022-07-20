const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, BrowserView, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const { download } = require('electron-dl')

const url = require('url')
const path = require('path')
const menuTemplate = require('./electron-menu')
const gotTheLock = app.requestSingleInstanceLock()
const isMac = process.platform === 'darwin'

/* AutoUpdater logger 
 * on macOS: ~/Library/Logs/{app name}/{process type}.log
 * on Windows: %USERPROFILE%\AppData\Roaming\{app name}\logs\{processtype}.log
 */
const log = require('electron-log');
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"
log.info('Smartlog Desktop starting...')

let win
let tray
let willQuitApp = false
let cafe24LoginWindow

function createWindow () {
  /* 브라우저 창을 생성합니다. */
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,    
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })
  win.removeMenu()

  win.on('close', function (event) {
    if(!willQuitApp){
      event.preventDefault()
      win.hide()
    }
  })

  /* React를 빌드할 경우 결과물은 build 폴더에 생성되기 때문에 loadURL 부분을 아래와 같이 작성합니다. */
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '/../build/index.html'),    
    protocol: 'file:',
    slashes: true
  })

  win.loadURL(startUrl)
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('smlog', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('smlog')
}

/* 하나의 프로세스만 실행 */
if (!gotTheLock) {
  willQuitApp = true
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  app.on('before-quit', () => willQuitApp = true)
  app.on('activate', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
      willQuitApp = false
    }
  })
  
  app.on('ready', () => {
    /* Application User Model ID */
    app.setAppUserModelId('com.smlog.chatterbox')

    log.info(`Smartlog Desktop ready (${app.getVersion()})`)

    autoUpdater.checkForUpdatesAndNotify()
    tray = new Tray(path.join(__dirname, '/../build/icon.png'))
    const contextMenu = Menu.buildFromTemplate([
      {label: `Smartlog Desktop (${app.getVersion()})`,
        click: function() {
          win.show()
          win.focus()
        } 
      },
      {type: 'separator'},
      {label: 'Exit',
        click: function() {
          win.close()
          app.quit()
          app.exit()
        }
      }
    ])
    tray.setToolTip('Smartlog Desktop')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => {
      win.show()
      win.focus()
    })
  })

  /* cafe24 로그인을 위해 deeplink 구현 */
  app.on('open-url', function (event, url) {
    dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`)
    const response = JSON.parse(decodeURIComponent(url.replace('smlog://', '')))
    win.focus()
    win.webContents.send('cafe24-login-response', response)
  })
}


/* developer tool을 여는 단축키 지정 (command + P) */
app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+P', () => {
    win.openDevTools()
  })
})

if (isMac) {
  const menu = Menu.buildFromTemplate(menuTemplate(app))
  Menu.setApplicationMenu(menu)
}

/* 이 메소드는 Electron의 초기화가 완료되고
 * 브라우저 윈도우가 생성될 준비가 되었을때 호출
 * 어떤 API는 이 이벤트가 나타난 이후에만 사용할 수 있습니다. */
app.whenReady().then(createWindow)

/* 모든 윈도우가 닫히면 종료된다. */
app.on('window-all-closed', () => {
  /* macOS에서는 사용자가 명확하게 Cmd + Q를 누르기 전까지는
   * 애플리케이션이나 메뉴 바가 활성화된 상태로 머물러 있는 것이 일반적입니다. */
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  /* macOS에서는 dock 아이콘이 클릭되고 다른 윈도우가 열려있지 않았다면
   * 앱에서 새로운 창을 다시 여는 것이 일반적입니다. */
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    autoUpdater.checkForUpdatesAndNotify()
  }
})

/* Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID 이슈
 * https://stackoverflow.com/questions/38986692/how-do-i-trust-a-self-signed-certificate-from-an-electron-app
 */
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // On certificate error we disable default behaviour (stop loading the page)
  // and we then say "it is all fine - true" to the callback
  event.preventDefault();
  callback(true);
});

/* 앱 버전 확인 */
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() })
})

/* 업데이트가 가능한 상태인지 확인 */
autoUpdater.on('update-available', () => {
  log.info('update available')
  win.webContents.send('update_available')
})

/* 가능한 업데이트가 없음 */
autoUpdater.on('update-not-available', () => {
  log.info('update not available')
  win.webContents.send('update_not_available')
})

/* 업데이트파일 다운로드 완료 */
autoUpdater.on('update-downloaded', () => {
  log.info('update downloaded')
  win.webContents.send('update_downloaded')
})

/* 앱 재시작 후 설치 */
ipcMain.on('restart_app', () => {
  willQuitApp = true
  log.info('restart app')
  /* 윈도우에서 자동 업데이트 진행 시 정상적으로 동작하지 않는 문제 (업데이트 실패) 
   * app.exit()를 추가하여 앱 완전종료 후 인스톨되도록 하여 해결
   * https://github.com/electron-userland/electron-builder/issues/4143
   */
  autoUpdater.quitAndInstall()
  app.exit()
})

/* 파일 다운로드 */ 
ipcMain.on('download', (event, info) => {  
  download(BrowserWindow.getFocusedWindow(), info.url, {
    saveAs: true,
    onProgress: progress => {
      event.sender.send("download-progress", { progress, info })
    }
  })
    .then(dl => event.sender.send('download-complete', dl.getSavePath()))
})

/* 업데이트 확인 */
ipcMain.on('check_update', (event) => {
  autoUpdater.on('update-available', () => {
    event.sender.send('check_update', { result: 1 })
  })
  autoUpdater.on('update-not-available', () => {
    event.sender.send('check_update', { result: 0 })
  })

  autoUpdater.emit('update-not-available')
})

// ipcMain.on('cafe24-login', (event, mallId) => {
//   app.whenReady().then(() => {
//     cafe24LoginWindow = new BrowserWindow({
//       width: 600,
//       height: 600,
//       webPreferences: {
//         nodeIntegration: true,
//       }
//     })
//     const view = new BrowserView({
//       webPreferences: {
//         nodeIntegration: true,
//       }
//     })
//     cafe24LoginWindow.setBrowserView(view)
//     view.setBounds({ x: 0, y: 0, width: 600, height: 600 })
//     view.webContents.loadURL(`https://smlog.co.kr/cafe24/app_auth.html?mall_id=${mallId}&login_type=desktop`)
//     // cafe24LoginWindow.loadURL('http://quv.kr/test/apptest.html')
//     view.webContents.openDevTools()
//   })
// })

ipcMain.on('cafe24-login-response', (event, info) => {
  cafe24LoginWindow.destroy()
  win.webContents.send('cafe24-login-response', {info: info})
})
