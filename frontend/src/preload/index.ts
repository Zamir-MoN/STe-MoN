import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkSteamStatus: () => ipcRenderer.invoke('check-steam-status'),
  launchSteam: (username?: string, password?: string, path?: string) => ipcRenderer.invoke('launch-steam', username, password, path),
  closeSteam: () => ipcRenderer.invoke('close-steam'),
  selectSteamPath: () => ipcRenderer.invoke('select-steam-path'),
  autoDetectSteam: () => ipcRenderer.invoke('auto-detect-steam')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel: string, data: any) => ipcRenderer.send(channel, data),
        on: (channel: string, func: (...args: any[]) => void) => {
          ipcRenderer.on(channel, (event, ...args) => func(...args))
        }
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ipcRenderer }
  // @ts-ignore (define in dts)
  window.api = api
}
