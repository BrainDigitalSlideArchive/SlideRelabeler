// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

const API = {
    // sendButtonClick: (text) => ipcRenderer.send('button-click', text),
    openFileDialog: () => {console.log('open file dialog');  return ipcRenderer.invoke('open-file-dialog')},
    openFolderDialog: () => {console.log('open folder dialog');  return ipcRenderer.invoke('open-folder-dialog')},
    openFile: (file) => ipcRenderer.invoke('open-file', file),
    openViewer: (file) => {ipcRenderer.invoke('open-viewer', file)},
    // onFilesPicked: (callback)=> ipcRenderer.on('files-picked', (_event, value) => callback(value)),
    onLog: (callback) => ipcRenderer.on('log', (_event, value) => callback(value)),
    // onDisplay: (callback) => ipcRenderer.on('display', (_event, value) => callback(value)),
}

// ipcRenderer.on('log',()=>console.log(...arguments));

contextBridge.exposeInMainWorld('electronAPI', API);