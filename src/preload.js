// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

const API = {
    sendButtonClick: (text) => ipcRenderer.send('button-click', text),
    onMessage: (callback) => ipcRenderer.on('message', (_event, value) => callback(value)),
    onDisplay: (callback) => ipcRenderer.on('display', (_event, value) => callback(value)),
}

contextBridge.exposeInMainWorld('electronAPI', API);