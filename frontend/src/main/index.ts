import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC Handlers for custom window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.restore()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('select-steam-path', async () => {
  if (!mainWindow) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Steam Executable',
    filters: [{ name: 'Executables', extensions: ['exe'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) {
    return null
  }
  return filePaths[0]
})

ipcMain.handle('auto-detect-steam', async () => {
  const commonPaths = [
    'C:\\Program Files (x86)\\Steam\\steam.exe',
    'C:\\Program Files\\Steam\\steam.exe',
    'C:\\Steam\\steam.exe',
    'D:\\Steam\\steam.exe',
    'E:\\Steam\\steam.exe'
  ]
  const fs = require('fs')
  for (const p of commonPaths) {
    try {
      if (fs.existsSync(p)) return p
    } catch (e) {}
  }
  return null
})

// IPC Handlers for Steam interactions (mock for now)
ipcMain.handle('check-steam-status', async () => {
  // TODO: implement actual process detection
  return { running: false }
})

ipcMain.handle('launch-steam', async () => {
  // TODO: implement actual steam launching
  return { success: true }
})

ipcMain.handle('close-steam', async () => {
  // TODO: implement actual steam killing
  return { success: true }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.steamhub.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Setup System Tray
  tray = new Tray(join(__dirname, '../../build/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setToolTip('STe MoN')
  tray.setContextMenu(contextMenu)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
