import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { loadConfig } from './config'
import { initDB, registerDBHandlers } from './ipc/db'
import { registerFSHandlers } from './ipc/fs'
import { registerScriptHandlers } from './ipc/scripts'
import { registerArchiveHandlers } from './ipc/archive'
import { registerReviewsHandlers } from './ipc/reviews'
import { runMigrations } from './migrations'

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 820,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(isMac
      ? {
          trafficLightPosition: { x: 16, y: 16 }
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerWindowHandlers(): void {
  ipcMain.handle('win:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })
  ipcMain.handle('win:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })
  ipcMain.handle('win:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.stocks-app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    loadConfig()
    await runMigrations()
    await initDB()
  } catch (err) {
    console.error('[startup]', err)
  }

  registerDBHandlers()
  registerFSHandlers()
  registerScriptHandlers()
  registerArchiveHandlers()
  registerReviewsHandlers()
  registerWindowHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
