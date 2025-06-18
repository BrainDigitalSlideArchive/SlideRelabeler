// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

import * as app_actions from '../actions/app';

const API = {
  // sendButtonClick: (text) => ipcRenderer.send('button-click', text),
  openFileIconDialog: () => ipcRenderer.invoke('open-icon-single-dialog'),
  openFileMultiDialog: () => ipcRenderer.invoke('open-file-multi-dialog'),
  openFileSingleDialog: () => ipcRenderer.invoke('open-file-single-dialog'),
  openFolderDialog: () => { return ipcRenderer.invoke('open-folder-dialog')},
  openFoldersDialog: () => { return ipcRenderer.invoke('open-folders-dialog')},
  getAllWSIFilePaths: (folder_path) => { return ipcRenderer.invoke('get-all-wsi-file-paths', folder_path)},
  openSaveFileDialog: (file_types) => ipcRenderer.invoke('open-save-file-dialog', file_types),
  getMetadata: (file_path) => ipcRenderer.invoke('metadata', file_path),
  openViewer: (file, row_idx) => ipcRenderer.invoke('open-viewer', file, row_idx),
  openImage: image_url => ipcRenderer.invoke('open-image', image_url),
  // onFilesPicked: (callback)=> ipcRenderer.on('files-picked', (_event, value) => callback(value)),
  onLog: (callback) => ipcRenderer.on('log', (_event, value) => callback(value)),
  // onDisplay: (callback) => ipcRenderer.on('display', (_event, value) => callback(value)),
  processFile: (info) => ipcRenderer.invoke('process-file', info),
  getCopyProgress: (id) => ipcRenderer.invoke('get-copy-progress', id),
  getProgress: (info, output_path) => ipcRenderer.invoke('get-progress', info, output_path),
  cancelRestartBridge: () => ipcRenderer.invoke('cancel-restart-bridge'),
  deletePartialFile: (file_path) => ipcRenderer.invoke('delete-partial-file', file_path),
  readCSV: (file_path) => ipcRenderer.invoke('read-csv', file_path),
  writeCSV: (file_path, data) => ipcRenderer.invoke('write-csv', file_path, data),
  readExcel: (file_path) => ipcRenderer.invoke('read-excel', file_path),
  checkFileExists: (file_path) => ipcRenderer.invoke('check-file-exists', file_path),
  checkFileReadable: (file_path) => ipcRenderer.invoke('check-file-readable', file_path),
  checkFileWriteable: (file_path) => ipcRenderer.invoke('check-file-writeable', file_path),
  getPlatform: (file_path) => ipcRenderer.invoke('get-platform'),
  getStore: () => ipcRenderer.invoke('get-store'),
  setStore: (store) => ipcRenderer.invoke('set-store', store),
  getErrors: () => ipcRenderer.invoke('get-errors'),
  clearErrors: () => ipcRenderer.invoke('clear-errors'),
  getDebugs: () => ipcRenderer.invoke('get-debugs'),
  clearDebugs: () => ipcRenderer.invoke('clear-debugs'),
  getOutputPath: (info) => ipcRenderer.invoke('get-output-path', info),
  deleteStore: () => ipcRenderer.invoke('delete-store'),
  previewMetadata: (output_dict) => ipcRenderer.invoke('preview-metadata', output_dict)
}

// ipcRenderer.on('log',()=>console.log(...arguments));

contextBridge.exposeInMainWorld('electronAPI', API);