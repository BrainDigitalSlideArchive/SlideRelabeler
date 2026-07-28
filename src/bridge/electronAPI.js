// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, BrowserWindow } from 'electron';

import * as dsa_actions from '../actions/dsa';
import * as files_actions from '../actions/files';
import * as globus_actions from '../actions/globus';

function coerceGlobusRowIdx(v) {
  if (v == null) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

let globusUploadIpcSubscribed = false;

function ensureGlobusUploadIpcSubscribed(dispatch) {
  if (globusUploadIpcSubscribed) return;
  globusUploadIpcSubscribed = true;
  ipcRenderer.on('globus-upload-file-progress', (event, progress) => {
    const p =
      progress && typeof progress === 'object'
        ? { ...progress, row_idx: coerceGlobusRowIdx(progress.row_idx) }
        : progress;
    dispatch({ type: files_actions.UPDATE_FILE_UPLOAD_PROGRESS, payload: p });
  });
  ipcRenderer.on('globus-upload-file-complete', (event, payload) => {
    const rawRow =
      payload != null && typeof payload === 'object' ? payload.row_idx : payload;
    const rowIdx = coerceGlobusRowIdx(rawRow);
    if (payload != null && typeof payload === 'object' && payload.duration_sec != null) {
      dispatch({
        type: files_actions.GLOBUS_UPLOAD_FILE_METRICS,
        payload: {
          row_idx: rowIdx,
          duration_sec: payload.duration_sec,
          effective_bytes_per_second: payload.effective_bytes_per_second ?? 0,
        },
      });
    }
    dispatch({ type: globus_actions.UPLOAD_FILE_COMPLETE, payload: rowIdx });
  });
  ipcRenderer.on('globus-upload-file-error', (event, error) => {
    const ri = error && typeof error === 'object' ? coerceGlobusRowIdx(error.row_idx) : null;
    const errMsg =
      error && typeof error === 'object'
        ? error.error != null
          ? String(error.error)
          : error.message != null
            ? String(error.message)
            : null
        : null;
    const err =
      error && typeof error === 'object'
        ? { ...error, row_idx: coerceGlobusRowIdx(error.row_idx) }
        : error;
    dispatch({ type: files_actions.UPLOAD_FILE_ERROR, payload: err });
    if (ri != null) {
      dispatch({
        type: globus_actions.UPLOAD_FILE_FAILURE,
        payload: {
          row_idx: ri,
          message: errMsg != null ? errMsg : 'Globus upload failed',
        },
      });
    } else {
      dispatch({ type: globus_actions.GLOBUS_RELEASE_UPLOAD_SLOT });
    }
  });
}

const API = {
  // sendButtonClick: (text) => ipcRenderer.send('button-click', text),
  openFileIconDialog: () => ipcRenderer.invoke('open-icon-single-dialog'),
  readLocalImagePreview: (filePath) => ipcRenderer.invoke('read-local-image-preview', filePath),
  openFileMultiDialog: () => ipcRenderer.invoke('open-file-multi-dialog'),
  openFileSingleDialog: () => ipcRenderer.invoke('open-file-single-dialog'),
  openFolderDialog: () => { return ipcRenderer.invoke('open-folder-dialog') },
  openFoldersDialog: () => { return ipcRenderer.invoke('open-folders-dialog') },
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  getAllWSIFilePaths: (folder_path) => { return ipcRenderer.invoke('get-all-wsi-file-paths', folder_path) },
  openSaveFileDialog: (file_types, defaultPath) => ipcRenderer.invoke('open-save-file-dialog', file_types, defaultPath),
  openJsonFileDialog: () => ipcRenderer.invoke('open-json-file-dialog'),
  writeTextFile: (filePath, contents) => ipcRenderer.invoke('write-text-file', filePath, contents),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  getConfigProfiles: () => ipcRenderer.invoke('get-config-profiles'),
  setConfigProfiles: (doc) => ipcRenderer.invoke('set-config-profiles', doc),
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
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getStore: () => ipcRenderer.invoke('get-store'),
  setStore: (store) => ipcRenderer.invoke('set-store', store),
  onStoreUpdated: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('store-updated', handler);
    return () => ipcRenderer.removeListener('store-updated', handler);
  },
  getErrors: () => ipcRenderer.invoke('get-errors'),
  clearErrors: () => ipcRenderer.invoke('clear-errors'),
  getDebugs: () => ipcRenderer.invoke('get-debugs'),
  clearDebugs: () => ipcRenderer.invoke('clear-debugs'),
  getOutputPath: (info) => ipcRenderer.invoke('get-output-path', info),
  getStagingDirectory: (options) => ipcRenderer.invoke('get-staging-directory', options),
  deleteStore: () => ipcRenderer.invoke('delete-store'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  deleteFile: (file_path) => ipcRenderer.invoke('delete-file', file_path),
  previewMetadata: (output_dict) => ipcRenderer.invoke('preview-metadata', output_dict),
  dsaLogin: (api_url, username, password) => ipcRenderer.invoke('dsa-login', api_url, username, password),
  dsaCheckServerUrl: (api_url) => ipcRenderer.invoke('dsa-check-server-url', api_url),
  dsaLogout: () => ipcRenderer.invoke('dsa-logout'),
  dsaUploadFile: (folder_id, file_row_idx, file_path) => ipcRenderer.invoke('dsa-upload-file', folder_id, file_row_idx, file_path),
  dsaEnrichUploadedItem: (payload) => ipcRenderer.invoke('dsa-enrich-uploaded-item', payload),
  dsaSetupUploadComplete: (dispatch) => ipcRenderer.on('dsa-upload-file-complete', (event, payload) => {
    dispatch({ type: dsa_actions.UPLOAD_FILE_COMPLETE, payload });
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
  dsaGetResourcePath: (id, type = 'folder') => ipcRenderer.invoke('dsa-get-resource-path', id, type),
  dsaListFolders: (parentId, parentType = 'folder') => ipcRenderer.invoke('dsa-list-folders', parentId, parentType),
  dsaListCollections: () => ipcRenderer.invoke('dsa-list-collections'),
  dsaGetCurrentUser: () => ipcRenderer.invoke('dsa-get-current-user'),
  // eSlideManager API methods
  esmLogin: (connection, username, password) => ipcRenderer.invoke('esm-login', connection, username, password),
  esmSearchAccession: (connection, username, password, accession) => ipcRenderer.invoke('esm-search-accession', connection, username, password, accession),
  esmLogout: () => ipcRenderer.invoke('esm-logout'),
  globusCheckCliAvailable: () => ipcRenderer.invoke('globus-check-cli-available'),
  globusCheckAuth: () => ipcRenderer.invoke('globus-check-auth'),
  globusAuthStatus: () => ipcRenderer.invoke('globus-auth-status'),
  globusLogin: (options = {}) => ipcRenderer.invoke('globus-login', options),
  globusSubmitAuthorizationCode: (code) => ipcRenderer.invoke('globus-submit-authorization-code', code),
  globusSetSslVerification: (disable) => ipcRenderer.invoke('globus-set-ssl-verification', disable),
  globusLogout: () => ipcRenderer.invoke('globus-logout'),
  globusUploadFile: (source_path, dest_collection_path, file_path, file_row_idx = 0) => 
    ipcRenderer.invoke('globus-upload-file', source_path, dest_collection_path, file_path, file_row_idx),
  globusUploadFileWithSize: (source_path, dest_collection_path, file_path, file_row_idx = 0, file_size_bytes = null) =>
    ipcRenderer.invoke('globus-upload-file', source_path, dest_collection_path, file_path, file_row_idx, file_size_bytes),
  globusUploadBatch: (payload) => ipcRenderer.invoke('globus-upload-batch', payload),
  globusCheckCollectionPath: (collection_path) => ipcRenderer.invoke('globus-check-collection-path', collection_path),
  globusListDirectory: (collection_path) => ipcRenderer.invoke('globus-list-directory', collection_path),
  globusGetLocalEndpointId: () => ipcRenderer.invoke('globus-get-local-endpoint-id'),
  globusSearchEndpoints: (query) => ipcRenderer.invoke('globus-search-endpoints', query),
  ensureGlobusUploadIpcSubscribed: (dispatch) => ensureGlobusUploadIpcSubscribed(dispatch),
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
  appendDebugLogLine: (line) => ipcRenderer.invoke('debug-append-log-line', line),
}

contextBridge.exposeInMainWorld('electronAPI', API);