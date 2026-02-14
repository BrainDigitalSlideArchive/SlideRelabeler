// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, BrowserWindow } from 'electron';

import * as files_actions from '../actions/files';


const API = {
  // sendButtonClick: (text) => ipcRenderer.send('button-click', text),
  openFileIconDialog: () => ipcRenderer.invoke('open-icon-single-dialog'),
  openFileMultiDialog: () => ipcRenderer.invoke('open-file-multi-dialog'),
  openFileSingleDialog: () => ipcRenderer.invoke('open-file-single-dialog'),
  openFolderDialog: () => { return ipcRenderer.invoke('open-folder-dialog') },
  openFoldersDialog: () => { return ipcRenderer.invoke('open-folders-dialog') },
  getAllWSIFilePaths: (folder_path) => { return ipcRenderer.invoke('get-all-wsi-file-paths', folder_path) },
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
  deleteFile: (file_path) => ipcRenderer.invoke('delete-file', file_path),
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
  deleteFile: (file_path) => ipcRenderer.invoke('delete-file', file_path),
  previewMetadata: (output_dict) => ipcRenderer.invoke('preview-metadata', output_dict),
  dsaLogin: (api_url, username, password) => ipcRenderer.invoke('dsa-login', api_url, username, password),
  dsaLogout: () => ipcRenderer.invoke('dsa-logout'),
  dsaUploadFile: (folder_id, file_row_idx, file_path) => ipcRenderer.invoke('dsa-upload-file', folder_id, file_row_idx, file_path),
  dsaSetupUploadComplete: (dispatch) => ipcRenderer.on('dsa-upload-file-complete', (event, file_row_idx) => {
    dispatch({ type: files_actions.UPLOAD_FILE_COMPLETE, payload: file_row_idx });
  }),
  dsaSetupUploadFileProgress: (dispatch) => ipcRenderer.on('dsa-upload-file-progress', (event, progress) => {
    dispatch({ type: files_actions.UPDATE_FILE_UPLOAD_PROGRESS, payload: progress });
  }),
  dsaSetupUploadFileError: (dispatch) => ipcRenderer.on('dsa-upload-file-error', (event, error) => {
    dispatch({ type: files_actions.UPLOAD_FILE_ERROR, payload: error });
  }),
  dsaStopUploadFileProgress: () => ipcRenderer.removeAllListeners('dsa-upload-file-progress'),
  dsaStopUploadComplete: () => ipcRenderer.removeAllListeners('dsa-upload-file-complete'),
  dsaStopUploadFileError: () => ipcRenderer.removeAllListeners('dsa-upload-file-error'),
  invalidateCache: (filePath) => ipcRenderer.send('invalidate-cache', filePath),
  clearAllCache: () => ipcRenderer.send('clear-all-cache'),
}

contextBridge.exposeInMainWorld('electronAPI', API);