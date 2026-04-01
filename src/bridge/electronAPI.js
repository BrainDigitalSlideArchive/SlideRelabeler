// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, BrowserWindow } from 'electron';

import * as files_actions from '../actions/files';
import * as globus_actions from '../actions/globus';


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
  copyFile: (source, destination) => ipcRenderer.invoke('copy-file', source, destination),
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
  dsaCheckUploadFolder: (folder_id) => ipcRenderer.invoke('dsa-check-upload-folder', folder_id),
  // eSlideManager API methods
  esmLogin: (url, username, password) => ipcRenderer.invoke('esm-login', url, username, password),
  esmSearchAccession: (url, username, password, accession) => ipcRenderer.invoke('esm-search-accession', url, username, password, accession),
  esmLogout: () => ipcRenderer.invoke('esm-logout'),
  globusCheckCliAvailable: () => ipcRenderer.invoke('globus-check-cli-available'),
  globusCheckAuth: () => ipcRenderer.invoke('globus-check-auth'),
  globusAuthStatus: () => ipcRenderer.invoke('globus-auth-status'),
  globusLogin: (options = {}) => {
    console.log('[electronAPI] globusLogin() called, invoking IPC...');
    const result = ipcRenderer.invoke('globus-login', options);
    console.log('[electronAPI] globusLogin() IPC invoke returned (promise):', result);
    result.then((response) => {
      console.log('[electronAPI] globusLogin() IPC response received:', response);
    }).catch((error) => {
      console.log('[electronAPI] globusLogin() IPC error:', error);
    });
    return result;
  },
  globusSubmitAuthorizationCode: (code) => ipcRenderer.invoke('globus-submit-authorization-code', code),
  globusSetSslVerification: (disable) => ipcRenderer.invoke('globus-set-ssl-verification', disable),
  globusLogout: () => ipcRenderer.invoke('globus-logout'),
  globusUploadFile: (source_path, dest_collection_path, file_path, file_row_idx = 0) => 
    ipcRenderer.invoke('globus-upload-file', source_path, dest_collection_path, file_path, file_row_idx),
  globusUploadFileWithSize: (source_path, dest_collection_path, file_path, file_row_idx = 0, file_size_bytes = null) =>
    ipcRenderer.invoke('globus-upload-file', source_path, dest_collection_path, file_path, file_row_idx, file_size_bytes),
  globusCheckCollectionPath: (collection_path) => ipcRenderer.invoke('globus-check-collection-path', collection_path),
  globusListDirectory: (collection_path) => ipcRenderer.invoke('globus-list-directory', collection_path),
  globusGetLocalEndpointId: () => ipcRenderer.invoke('globus-get-local-endpoint-id'),
  globusSearchEndpoints: (query) => ipcRenderer.invoke('globus-search-endpoints', query),
  globusSetupUploadFileProgress: (dispatch) => ipcRenderer.on('globus-upload-file-progress', (event, progress) => {
    dispatch({ type: files_actions.UPDATE_FILE_UPLOAD_PROGRESS, payload: progress });
  }),
  globusSetupUploadComplete: (dispatch) => ipcRenderer.on('globus-upload-file-complete', (event, file_row_idx) => {
    dispatch({ type: globus_actions.UPLOAD_FILE_COMPLETE, payload: file_row_idx });
  }),
  globusSetupUploadFileError: (dispatch) => ipcRenderer.on('globus-upload-file-error', (event, error) => {
    dispatch({ type: files_actions.UPLOAD_FILE_ERROR, payload: error });
  }),
  globusStopUploadFileProgress: () => ipcRenderer.removeAllListeners('globus-upload-file-progress'),
  globusStopUploadComplete: () => ipcRenderer.removeAllListeners('globus-upload-file-complete'),
  globusStopUploadFileError: () => ipcRenderer.removeAllListeners('globus-upload-file-error'),
  globusSetupUploadDebugLog: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('globus-upload-debug-log', handler);
    return () => ipcRenderer.removeListener('globus-upload-debug-log', handler);
  },
  globusStopUploadDebugLog: () => ipcRenderer.removeAllListeners('globus-upload-debug-log'),
  globusSetupUploadDebugStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('globus-upload-debug-status', handler);
    return () => ipcRenderer.removeListener('globus-upload-debug-status', handler);
  },
  globusStopUploadDebugStatus: () => ipcRenderer.removeAllListeners('globus-upload-debug-status'),
  globusExecuteCommand: (args, useJsonFormat = false) => ipcRenderer.invoke('globus-execute-command', args, useJsonFormat),
  globusCancelCommand: (commandId) => ipcRenderer.invoke('globus-cancel-command', commandId),
  globusSetupCommandOutput: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('globus-command-output', handler);
    return () => ipcRenderer.removeListener('globus-command-output', handler);
  },
  globusSetupCommandComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('globus-command-complete', handler);
    return () => ipcRenderer.removeListener('globus-command-complete', handler);
  },
  globusSetupCommandError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('globus-command-error', handler);
    return () => ipcRenderer.removeListener('globus-command-error', handler);
  },
  globusStopCommandOutput: () => ipcRenderer.removeAllListeners('globus-command-output'),
  globusStopCommandComplete: () => ipcRenderer.removeAllListeners('globus-command-complete'),
  globusStopCommandError: () => ipcRenderer.removeAllListeners('globus-command-error'),
}

contextBridge.exposeInMainWorld('electronAPI', API);