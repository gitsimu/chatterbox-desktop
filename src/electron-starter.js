const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray } = require('electron')
const { autoUpdater } = require('electron-updater')
const { download } = require('electron-dl')

const url = require('url')
const path = require('path')
const menuTemplate = require('./electron-menu')
const gotTheLock = app.requestSingleInstanceLock()
const isMac = process.platform === 'darwin'
let win
let tray
let willQuitApp = false

function createWindow () {
  /* 브라우저 창을 생성합니다. */
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,    
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true      
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

/* 하나의 프로세스만 실행 */
if (!gotTheLock) {
  willQuitApp = true
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
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
  
    autoUpdater.checkForUpdatesAndNotify()
    tray = new Tray(path.join(__dirname, '/../build/icon.png'))
    const contextMenu = Menu.buildFromTemplate([
      {label: `Smartlog Desktop (${app.getVersion()})`,
        click: function() {
          win.show()
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

/* 앱 버전 확인 */
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() })
})

/* 업데이트가 가능한 상태인지 확인 */
autoUpdater.on('update-available', () => {
  win.webContents.send('update_available')
})

/* 가능한 업데이트가 없음 */
autoUpdater.on('update-not-available', () => {
  win.webContents.send('update_not_available')
})

/* 업데이트파일 다운로드 완료 */
autoUpdater.on('update-downloaded', () => {
  win.webContents.send('update_downloaded')
})

/* 앱 재시작 후 설치 */
ipcMain.on('restart_app', () => {
  willQuitApp = true
  autoUpdater.quitAndInstall()
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