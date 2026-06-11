import { ipcMain, dialog, BrowserWindow, app, safeStorage, shell } from 'electron';
import { GrpcPythonBridge } from './bridge/grpcPythonBridge';
import path, { join, extname } from 'path';
import fs from 'fs/promises';
import { open, read, close } from 'fs';
import { existsSync, accessSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { registerRoute } from './routers/main-electron-router';
import { readCSV, readExcel, writeCSV } from "./utilities/csv_excel_helpers";
import walk from 'fs-walk';
import DSAAPI from './api/DSAAPI';
import ESMAPI from './api/ESMAPI';
import GlobusAPI from './api/GlobusAPI';
import { buildDeidUploadMetadata } from './helpers/dsa_upload_metadata.js';

// let bridge = new PythonBridge();
let bridge = new GrpcPythonBridge();

export { bridge };

const wsiCustomFilter = { name: 'WSI Files (*.svs, *.ndpi, *.tif, *.tiff)', extensions: ['svs', 'ndpi', 'tif', 'tiff'] };
let upload_status = {
};

let dsa_client = null;
let esm_client = null;
let globus_client = null;

function globusHandlerDebug(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

/**
 * @param { Array } list Array of object with fields source (mandatory) and destination (optional)
 */
function makeFileInfo(list) {
  let output = list.map(arr => {
    const info = {
      source: {
        filename: path.basename(arr.source),
        directory: path.dirname(arr.source),
        path: arr.source,
        parsed: path.parse(arr.source),
        sep: path.sep
      }
    }
    if (arr.destination) {
      info.destination = {
        filename: path.basename(arr.destination),
        directory: path.dirname(arr.destination),
        path: arr.destination,
        parsed: path.parse(arr.destination),
        sep: path.sep
      }
    }

    return info;
  });
  return output;
};

ipcMain.handle('dsa-login', async (event, api_url, username, password) => {
  dsa_client = new DSAAPI(api_url);
  let response = await dsa_client.login(username, password);
  return response;
});

ipcMain.handle('dsa-logout', async (event) => {
  let response = dsa_client.logout();
  dsa_client = null;
  return response;
});

/**
 * IPC handler for eSlideManager login
 * @returns {Promise<[boolean, Object]>} [success, response/error]
 */
ipcMain.handle('esm-login', async (event, url, username, password) => {
  try {
    esm_client = new ESMAPI(url);
    const response = await esm_client.tryLogin(username, password);
    if (response.ok) {
      return [true, { ok: true }];
    } else {
      return [false, { message: response.error || 'Login failed' }];
    }
  } catch (error) {
    console.error('eSlideManager login error:', error.message || error);
    return [false, { message: error.message || 'Login failed' }];
  }
});

/**
 * IPC handler for eSlideManager slide search by accession number
 * @returns {Promise<[boolean, Array|Object]>} [success, slides array or error]
 */
ipcMain.handle('esm-search-accession', async (event, url, username, password, accession) => {
  try {
    // Create new client if URL changed or client doesn't exist
    if (!esm_client || esm_client.api_url !== url) {
      esm_client = new ESMAPI(url);
    }
    const data = await esm_client.searchByAccession(username, password, accession);
    if (data && data.error) {
      return [false, { message: data.error }];
    }
    return [true, data];
  } catch (error) {
    console.error('eSlideManager search error:', error.message || error);
    return [false, { message: error.message || 'Search failed' }];
  }
});

/**
 * IPC handler for eSlideManager logout
 * @returns {Promise<[boolean, Object]>} [success, response]
 */
ipcMain.handle('esm-logout', async (event) => {
  try {
    if (esm_client) {
      const response = esm_client.logout();
      esm_client = null;
      return [true, response];
    }
    return [true, { ok: true, message: "Logged out" }];
  } catch (error) {
    console.error('eSlideManager logout error:', error.message || error);
    return [false, { message: error.message || 'Logout failed' }];
  }
});
function get_browser_window_by_title(title) {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (window.getTitle() === title) {
      return window;
    }
  }
  return null;
}

/** Append-only Redux debug log (renderer → main). File: %APPDATA%/SlideRelabeler/logs/redux-debug.log on Windows. */
ipcMain.handle('debug-append-log-line', async (event, line) => {
  try {
    const logDir = join(app.getPath('userData'), 'logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = join(logDir, 'redux-debug.log');
    const text = typeof line === 'string' ? line : JSON.stringify(line);
    await fs.appendFile(logPath, `${text}\n`, 'utf8');
  } catch (err) {
    console.error('debug-append-log-line failed:', err?.message || err);
  }
});

function read_and_send_file_chunk(window, fd, upload_id, file_row_idx, file_path, file_size, file_buffer, data_offset, chunk_size) {
  return new Promise(async (resolve, reject) => {
    read(fd, file_buffer, 0, chunk_size, -1, async (err, bytesRead, buffer) => {
      const start_time = new Date();
      if (err) {
        console.error("Error reading file", err);
        reject(false);
      }
      let response = null;
      let finalize = false;
      if (bytesRead < chunk_size) {
        response = await dsa_client.upload_file_chunk(upload_id, buffer.slice(0, bytesRead), data_offset);
        finalize = true;
      } else {
        response = await dsa_client.upload_file_chunk(upload_id, buffer, data_offset);
      }
      const end_time = new Date();
      const time_diff_ms = end_time - start_time;
      const rate_bytes_per_ms = bytesRead / time_diff_ms;



      data_offset += bytesRead;
      if (response && response[0]) {
        const progress = (response[1].received / file_size) * 100;

        if (finalize) {
          const complete = await dsa_client.upload_file_complete(upload_id);
          close(fd);
          if (complete && complete[0]) {
            const fileDoc = complete[1];
            window.webContents.send('dsa-upload-file-complete', {
              row_idx: file_row_idx,
              itemId: fileDoc.itemId,
              fileId: fileDoc._id,
              fileName: fileDoc.name,
            });
            resolve(true);
          } else {
            const errMsg = complete?.[1]?.message || 'Upload completion failed';
            window.webContents.send('dsa-upload-file-error', { file_path: file_path, error: errMsg, row_idx: file_row_idx });
            reject(false);
          }
          return;
        }
        window.webContents.send('dsa-upload-file-progress', { file_path: file_path, progress: progress, row_idx: file_row_idx, rate_bytes_per_ms: rate_bytes_per_ms });
        resolve(true);
      } else {
        window.webContents.send('dsa-upload-file-error', { file_path: file_path, error: response[1].message, row_idx: file_row_idx });
        close(fd);
        reject(false);
      }
    });
  });
}

async function send_file_chunks(window, upload_id, file_row_idx, file_path) {
  const chunk_size = 64 * 1024 * 1024; // 64MB
  const file_size = (await fs.stat(file_path)).size;

  open(file_path, 'r', async (err, fd) => {
    if (err) {
      console.error("Error opening file", err);
      return;
    }
    const file_buffer = Buffer.alloc(chunk_size);

    for (let data_offset = 0; data_offset < file_size; data_offset += chunk_size) {
      const success = await read_and_send_file_chunk(window, fd, upload_id, file_row_idx, file_path, file_size, file_buffer, data_offset, chunk_size);
      if (!success) {
        break;
      }
    }
  });
  return true;
}

ipcMain.handle('dsa-upload-file', async (event, folder_id, file_row_idx, file_path) => {
  let response = await dsa_client.begin_upload_file_to_folder(folder_id, file_path);
  if (response[0]) {
    const window = get_browser_window_by_title('SlideRelabeler');
    if (window) {
      await send_file_chunks(window, response[1]._id, file_row_idx, file_path);
    }
  }
  return response;
});

ipcMain.handle('dsa-enrich-uploaded-item', async (event, { itemId, fileRow, options }) => {
  if (!dsa_client || !itemId || !fileRow) {
    return [false, { message: 'Missing DSA client, item id, or file row' }];
  }
  const opts = options || {};
  const reserved = fileRow.__reserved || {};
  const results = {};

  try {
    if (opts.renameItem) {
      const stem =
        fileRow.AssembledName ||
        reserved.assembledItemName ||
        reserved.labelText ||
        reserved.rename ||
        '';
      const fileName = opts.fileName || '';
      const ext = extname(fileName) || reserved.source?.parsed?.ext || '';
      if (stem && ext) {
        const itemName = `${stem}${ext}`;
        const renameResp = await dsa_client.updateItem(itemId, { name: itemName });
        if (!renameResp[0]) {
          return [false, renameResp[1] || { message: 'Item rename failed' }];
        }
        results.item = renameResp[1];
      }
    }
    if (opts.setMetadata) {
      const metadata = buildDeidUploadMetadata(fileRow);
      const metaResp = await dsa_client.setItemMetadata(itemId, metadata);
      if (!metaResp[0]) {
        return [false, metaResp[1] || { message: 'Metadata update failed' }];
      }
      results.metadata = metaResp[1];
    }
    return [true, results];
  } catch (err) {
    return [false, { message: err?.message || String(err) }];
  }
});

ipcMain.handle('dsa-check-upload-folder', async (event, folder_id) => {
  let response = await dsa_client.get_folder_by_id(folder_id);
  if (response[0]) {
    return response[1];
  } else {
    return response[1];
  }
})

// Globus IPC handlers
ipcMain.handle('globus-check-cli-available', async (event) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  return [globus_client.isAvailable(), { status: globus_client.getStatus() }];
});

ipcMain.handle('globus-check-auth', async (event) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }
  return globus_client.check_auth();
});

// New: authoritative auth status endpoint (typed object, no legacy tuple)
ipcMain.handle('globus-auth-status', async (event) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return { ok: false, isAuthenticated: false, classification: 'cliNotAvailable', message: 'Globus CLI not available' };
  }

  // Prefer whoami preflight for authoritative status
  try {
    const whoami = await globus_client.executeCommand(['whoami'], false);
    if (whoami && whoami[0]) {
      const username = (whoami[1]?.message || '').trim();
      return { ok: true, isAuthenticated: true, classification: 'success', username };
    }
    return { ok: true, isAuthenticated: false, classification: 'notAuthenticated' };
  } catch (error) {
    return { ok: false, isAuthenticated: false, classification: 'unknownError', message: error.message || 'Unknown error' };
  }
});

ipcMain.handle('globus-login', async (event, options = {}) => {
  globusHandlerDebug('[Handlers] globus-login IPC');

  if (!globus_client) {
    globus_client = new GlobusAPI();
  }

  const isAvailable = globus_client.isAvailable();
  if (!isAvailable) {
    return [false, { message: 'Globus CLI not available' }];
  }

  const response = await globus_client.login(options);
  globusHandlerDebug('[Handlers] globus-login response', {
    ok: response?.ok,
    classification: response?.classification,
    hasUrl: !!response?.url,
  });

  // If login returned a URL, open it in the user's browser (best-effort)
  if (response && response.ok && response.classification === 'needsBrowserAuth' && response.url) {
    try {
      await shell.openExternal(response.url);
      return { ...response, browserOpened: true };
    } catch (error) {
      console.error('[Handlers] globus-login: failed to open browser', error?.message || error);
      return { ...response, browserOpened: false, browserOpenError: error?.message || String(error) };
    }
  }

  return response;
});

ipcMain.handle('globus-submit-authorization-code', async (event, code) => {
  globusHandlerDebug('[Handlers] globus-submit-authorization-code IPC');

  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }

  if (!code || !code.trim()) {
    return [false, { message: 'Authorization code is required' }];
  }

  return globus_client.submitAuthorizationCode(code.trim());
});

ipcMain.handle('globus-set-ssl-verification', async (event, disable) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }

  globus_client.setDisableSslVerification(disable);
  return [true, { message: 'SSL verification setting updated' }];
});

ipcMain.handle('globus-logout', async (event) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }
  return globus_client.logout();
});

ipcMain.handle('globus-check-collection-path', async (event, collection_path) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }
  return globus_client.validate_collection_path(collection_path);
});

ipcMain.handle('globus-list-directory', async (event, collection_path) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }
  try {
    return await globus_client.listDirectory(collection_path);
  } catch (err) {
    return [false, { message: err?.message || 'List directory failed' }];
  }
});

ipcMain.handle('globus-get-local-endpoint-id', async () => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }
  return globus_client.getLocalEndpointId();
});

ipcMain.handle('globus-search-endpoints', async (event, query) => {
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }
  try {
    return await globus_client.searchEndpoints(query);
  } catch (err) {
    return [false, { message: err?.message || 'Endpoint search failed' }];
  }
});

// Store running command processes by commandId
const runningCommands = new Map();

ipcMain.handle('globus-execute-command', async (event, args, useJsonFormat = false) => {
  globusHandlerDebug('[Handlers] globus-execute-command', args, useJsonFormat);

  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }

  // Generate unique command ID
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const webContents = event.sender; // event.sender is the webContents object

  // Set up output callbacks
  const outputCallbacks = {
    onStdout: (chunk) => {
      webContents.send('globus-command-output', {
        commandId: commandId,
        type: 'stdout',
        chunk: chunk
      });
    },
    onStderr: (chunk) => {
      webContents.send('globus-command-output', {
        commandId: commandId,
        type: 'stderr',
        chunk: chunk
      });
    },
    onComplete: (exitCode, stdout, stderr) => {
      globusHandlerDebug('[Handlers] globus command complete', commandId, exitCode);
      runningCommands.delete(commandId);
      webContents.send('globus-command-complete', {
        commandId: commandId,
        exitCode: exitCode,
        stdout: stdout,
        stderr: stderr
      });
    },
    onError: (error) => {
      console.error('[Handlers] globus command error', commandId, error);
      runningCommands.delete(commandId);
      webContents.send('globus-command-error', {
        commandId: commandId,
        error: error.message || 'Unknown error'
      });
    }
  };

  // Execute command with streaming
  try {
    const childProcess = globus_client.executeCommandStream(args, useJsonFormat, {}, outputCallbacks);

    if (!childProcess) {
      return [false, { message: 'Failed to start command process' }];
    }

    // Store process reference for potential cancellation
    runningCommands.set(commandId, childProcess);

    globusHandlerDebug('[Handlers] globus command started', commandId);
    return [true, { commandId: commandId }];
  } catch (error) {
    console.error('[Handlers] globus-execute-command: failed to start', error);
    return [false, { message: error.message || 'Failed to start command' }];
  }
});

ipcMain.handle('globus-cancel-command', async (event, commandId) => {
  globusHandlerDebug('[Handlers] globus-cancel-command', commandId);

  const childProcess = runningCommands.get(commandId);
  if (childProcess && !childProcess.killed) {
    try {
      childProcess.kill();
      runningCommands.delete(commandId);
      return [true, { message: 'Command cancelled' }];
    } catch (error) {
      console.error('[Handlers] globus-cancel-command failed', error);
      return [false, { message: error.message || 'Failed to cancel command' }];
    }
  } else {
    return [false, { message: 'Command not found or already completed' }];
  }
});

function emitGlobusUploadDebugLog(webContents, file_row_idx, stream, message, meta = {}) {
  if (!webContents || webContents.isDestroyed()) return;
  try {
    webContents.send('globus-upload-debug-log', {
      row_idx: file_row_idx,
      stream,
      message: message != null ? String(message) : '',
      time: new Date().getTime(),
      ...meta,
    });
  } catch {
    /* ignore */
  }
}

function emitGlobusUploadDebugStatus(webContents, file_row_idx, task, task_id) {
  if (!webContents || webContents.isDestroyed()) return;
  try {
    webContents.send('globus-upload-debug-status', {
    row_idx: file_row_idx,
    task_id,
    status: task?.status || task?.state || null,
    nice_status: task?.nice_status ?? null,
    nice_status_short_description: task?.nice_status_short_description ?? null,
    bytes_transferred: task?.bytes_transferred ?? null,
    files_transferred: task?.files_transferred ?? null,
    files: task?.files ?? null,
    time: new Date().getTime(),
  });
  } catch {
    /* ignore */
  }
}

function globusTaskNumericField(task, key) {
  const v = task?.[key];
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function globusTransferProgressFromTask(task, file_size_bytes, last_progress) {
  const status = task?.status || task?.state || '';
  if (status === 'SUCCEEDED') {
    return { progress: 100, indeterminate: false };
  }

  const fileSize = typeof file_size_bytes === 'number' && file_size_bytes > 0 ? file_size_bytes : null;
  const transferredBytes = globusTaskNumericField(task, 'bytes_transferred');
  const filesTransferred = globusTaskNumericField(task, 'files_transferred');
  const files = globusTaskNumericField(task, 'files');

  if (fileSize != null && transferredBytes != null && transferredBytes > 0) {
    const p = Math.max(0, Math.min(100, (transferredBytes / fileSize) * 100));
    return { progress: p, indeterminate: false };
  }

  if (filesTransferred != null && files != null && files > 0 && filesTransferred > 0) {
    const p = Math.max(0, Math.min(100, (filesTransferred / files) * 100));
    return { progress: p, indeterminate: false };
  }

  const activeLike = /^(ACTIVE|IN_PROGRESS|STARTED|RUNNING)$/i.test(String(status));
  const noByteOrFileProgress =
    (transferredBytes == null || transferredBytes === 0) &&
    (filesTransferred == null || filesTransferred === 0);
  if (activeLike && noByteOrFileProgress) {
    return { progress: typeof last_progress === 'number' ? last_progress : 0, indeterminate: true };
  }

  const bps = globusTaskNumericField(task, 'effective_bytes_per_second');
  const requestTime = task?.request_time;
  if (fileSize != null && bps != null && bps > 0 && requestTime) {
    const reqMs = Date.parse(requestTime);
    if (!Number.isNaN(reqMs)) {
      const elapsedSec = Math.max(0, (Date.now() - reqMs) / 1000);
      const estimatedBytes = bps * elapsedSec;
      let p = Math.max(0, Math.min(99, (estimatedBytes / fileSize) * 100));
      p = Math.max(typeof last_progress === 'number' ? last_progress : 0, p);
      return { progress: p, indeterminate: false };
    }
  }

  if (activeLike) {
    return { progress: typeof last_progress === 'number' ? last_progress : 0, indeterminate: true };
  }

  return { progress: typeof last_progress === 'number' ? last_progress : 0, indeterminate: false };
}

async function poll_globus_transfer_status(webContents, task_id, file_row_idx, file_path, file_size_bytes = null) {
  const max_polls = 1000; // Prevent infinite polling
  const pollStartMs = Date.now();
  let poll_count = 0;
  let last_status = null;
  let last_reported_progress = 0;

  while (poll_count < max_polls) {
    const status_response = await globus_client.get_transfer_status(task_id);
    if (!status_response[0]) {
      emitGlobusUploadDebugLog(webContents, file_row_idx, 'stderr', status_response?.[1]?.message || 'Task status check failed', {
        task_id,
      });
      if (webContents && !webContents.isDestroyed()) {
        try {
          webContents.send('globus-upload-file-error', { 
            file_path: file_path, 
            error: status_response[1].message, 
            row_idx: file_row_idx 
          });
        } catch {
          /* ignore */
        }
      }
      return;
    }
    
    const task = status_response[1];
    const status = task.status || task.state;
    emitGlobusUploadDebugLog(webContents, file_row_idx, 'stdout', `task_show_json | row ${file_row_idx} | task ${task_id}`, {
      task_id,
      task_show_json: JSON.stringify(task),
    });
    emitGlobusUploadDebugStatus(webContents, file_row_idx, task, task_id);
    if (status && status !== last_status) {
      emitGlobusUploadDebugLog(webContents, file_row_idx, 'status', `Task status: ${status}${task?.nice_status ? ` (${task.nice_status})` : ''}`, {
        task_id,
      });
      last_status = status;
    }
    
    const { progress: rawProgress, indeterminate } = globusTransferProgressFromTask(
      task,
      file_size_bytes,
      last_reported_progress
    );
    let progress = rawProgress;
    if (status !== 'SUCCEEDED') {
      progress = Math.max(last_reported_progress, progress);
    }
    last_reported_progress = progress;

    // Send progress update
    if (webContents && !webContents.isDestroyed()) {
      try {
        webContents.send('globus-upload-file-progress', { 
          file_path: file_path, 
          progress: progress, 
          indeterminate,
          status: status,
          row_idx: file_row_idx,
          globus: true,
        });
      } catch {
        /* ignore */
      }
    }
    
    // Check if transfer is complete
    if (status === 'SUCCEEDED') {
      const durationSec = Math.max(1, Math.round((Date.now() - pollStartMs) / 1000));
      const effectiveBps = globusTaskNumericField(task, 'effective_bytes_per_second');
      try {
        if (webContents && !webContents.isDestroyed()) {
          webContents.send('globus-upload-file-complete', {
            row_idx: file_row_idx,
            duration_sec: durationSec,
            effective_bytes_per_second: effectiveBps != null ? effectiveBps : 0,
          });
        }
      } catch (e) {
        console.error('poll_globus_transfer_status: send globus-upload-file-complete failed', e?.message || e, {
          task_id,
          file_row_idx,
        });
      }
      return;
    } else if (status === 'FAILED') {
      emitGlobusUploadDebugLog(webContents, file_row_idx, 'stderr', task?.message || 'Transfer failed', { task_id });
      if (webContents && !webContents.isDestroyed()) {
        try {
          webContents.send('globus-upload-file-error', { 
            file_path: file_path, 
            error: task.message || `Transfer ${status}`, 
            row_idx: file_row_idx 
          });
        } catch {
          /* ignore */
        }
      }
      return;
    }
    
    poll_count++;
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before next poll
  }
  
  // Timeout after max polls
  emitGlobusUploadDebugLog(webContents, file_row_idx, 'stderr', 'Transfer polling timeout', { task_id });
  if (webContents && !webContents.isDestroyed()) {
    try {
      webContents.send('globus-upload-file-error', { 
        file_path: file_path, 
        error: 'Transfer polling timeout', 
        row_idx: file_row_idx 
      });
    } catch {
      /* ignore */
    }
  }
}

// Progress/poll callbacks must use this handler's event.sender (never title/focus/window lookup) so concurrent transfers reach the invoking renderer.
ipcMain.handle('globus-upload-file', async (event, source_path, dest_collection_path, file_path, file_row_idx = 0, file_size_bytes = null) => {
  const rowIdxNum = Number(file_row_idx);
  const ipcRowIdx = Number.isFinite(rowIdxNum) ? rowIdxNum : file_row_idx;
  const sender = event.sender;
  if (sender.isDestroyed()) {
    return [false, { message: 'Renderer webContents is destroyed' }];
  }
  if (!globus_client) {
    globus_client = new GlobusAPI();
  }
  if (!globus_client.isAvailable()) {
    return [false, { message: 'Globus CLI not available' }];
  }

  emitGlobusUploadDebugLog(sender, ipcRowIdx, 'stdout', `Submitting transfer: ${source_path} -> ${dest_collection_path}`, {
    file_path,
  });
  const transfer_response = await globus_client.submit_transfer(source_path, dest_collection_path);
  if (!transfer_response[0]) {
    emitGlobusUploadDebugLog(sender, ipcRowIdx, 'stderr', transfer_response?.[1]?.message || 'Transfer submission failed', {
      file_path,
    });
    if (transfer_response?.[1]?.stderr) {
      emitGlobusUploadDebugLog(sender, ipcRowIdx, 'stderr', transfer_response[1].stderr, { file_path });
    }
    return transfer_response;
  }
  
  // Extract task_id from response
  // The response format may vary, but typically includes a task_id or similar
  const task_id = transfer_response[1].task_id || transfer_response[1].id || transfer_response[1].DATA?.[0]?.task_id;
  
  if (!task_id) {
    return [false, { message: 'Could not extract task_id from transfer response', response: transfer_response[1] }];
  }
  
  // Push progress/complete to the same WebContents that invoked this handler (matches globus-execute-command).
  if (!sender.isDestroyed()) {
    emitGlobusUploadDebugLog(sender, ipcRowIdx, 'stdout', `Transfer task_id: ${task_id}`, { file_path, task_id });
    try {
      sender.send('globus-upload-file-progress', {
        file_path,
        progress: 0,
        indeterminate: true,
        status: 'INITIATED',
        row_idx: ipcRowIdx,
        globus: true,
      });
    } catch (e) {
      console.error('[Handlers] globus-upload-file: send initial progress failed', e?.message || e);
    }
    poll_globus_transfer_status(sender, task_id, ipcRowIdx, file_path, file_size_bytes).catch(err => {
      console.error('Error polling globus transfer:', err);
      emitGlobusUploadDebugLog(sender, ipcRowIdx, 'stderr', err?.message || 'Error polling globus transfer', { file_path, task_id });
    });
  }
  
  return [true, { task_id: task_id, message: 'Transfer initiated' }];
});
ipcMain.handle('get-platform', async () => {
  return process.platform;
})

/**
 * An IPC handler that opens a dialog to choose a file to save
 * @param {string} file_type The type of file to save
 */
ipcMain.handle('open-save-file-dialog', async (event, file_types) => {
  let dialog_options = {
    properties: ['createDirectory', "showOverwriteConfirmation"],
    filters: []
  }

  if (file_types.includes('csv')) {
    dialog_options.filters.push({ name: 'CSV Files', extensions: ['csv'] });
  }

  if (file_types.includes('xlsx')) {
    dialog_options.filters.push({ name: 'Excel Files', extensions: ['xlsx'] });
  }

  return dialog.showSaveDialog(dialog_options).then(d => {
    if (d.canceled) {
      return { error: true, message: 'No file selected' };
    } else {
      return d.filePath;
    }
  });
});

ipcMain.handle('open-file-single-dialog', async () => {
  const customFilter = { name: 'CSV Files (*.csv)', extensions: ['csv'] };
  return dialog.showOpenDialog({ filters: [customFilter], properties: ['openFile'] }).then(d => {

    // if canceled, return; otherwise, return the list of files that were picked
    if (d.canceled) {
      // return Promise.reject({errorCode:0, message: 'No files selected'});
      return [];
    } else {
      const fileList = makeFileInfo(d.filePaths.map(f => { return { source: f } }));
      // console.log('fileList:', fileList);
      return fileList;
    }
  });
});

ipcMain.handle('cancel-restart-bridge', async () => {
  bridge._shell.kill();
  bridge = new PythonBridge();
});

ipcMain.handle('delete-file', async (event, file_path) => {
  try {
    if (existsSync(file_path)) {
      unlinkSync(file_path);
    }
    return true;
  } catch (err) {
    console.log('error deleting file:', err);
    return false;
  }
});

ipcMain.handle('open-icon-single-dialog', async () => {
  const customFilter = { name: 'Image Files (*.tiff, *.tif, *.png, *.jpg)', extensions: ['tiff', 'tif', 'png', 'jpg'] };
  return dialog.showOpenDialog({ filters: [customFilter], properties: ['openFile'] }).then(d => {

    // if canceled, return; otherwise, return the list of files that were picked
    if (d.canceled) {
      // return Promise.reject({errorCode:0, message: 'No files selected'});
      return [];
    } else {
      const fileList = makeFileInfo(d.filePaths.map(f => { return { source: f } }));
      // console.log('fileList:', fileList);
      return fileList;
    }
  });
  // ipcMain.emit('store-changes-finalized')
});

ipcMain.handle('get-store', async () => {
  let user_data_path = app.getPath('userData')
  let app_data_path = join(user_data_path, 'deid.tmp')
  let exists = existsSync(app_data_path);
  if (exists) {
    try {
      accessSync(app_data_path, fs.constants.R_OK);
      let app_data = readFileSync(app_data_path);
      let json_string = safeStorage.decryptString(app_data);
      let json_data = JSON.parse(json_string);
      return json_data;
    } catch (err) {
      console.error("Cannot access previous app data from ", app_data_path, err)
    }

  }
});

ipcMain.handle('get-file-from-store', async (event, idx) => {
  // todo: finish this function
  let user_data_path = app.getPath('userData')
  let app_data_path = join(user_data_path, 'deid.tmp')
  let exists = existsSync(app_data_path);
  if (exists) {
    try {
      accessSync(app_data_path, fs.constants.R_OK);
      let app_data = await fs.readFile(app_data_path);
      const json_string = safeStorage.decryptString(app_data);
      const json_data = JSON.parse(json_string);
      let value;
      if (json_data.files) {
        value = json_data.files.fileRows.pop(idx);
      } else {
        value = null;
      }
      return value;
    } catch (err) {
      console.error("Cannot access previous app data from ", app_data_path, err)
    }

  }
});

ipcMain.handle('set-store', async (event, data) => {
  let user_data_path = app.getPath('userData')
  let app_data_path = join(user_data_path, 'deid.tmp')
  let encrypted_data = safeStorage.encryptString(JSON.stringify(data));
  writeFileSync(app_data_path, encrypted_data, { encoding: 'utf8' })
  try {
    BrowserWindow.getAllWindows().forEach((w) => {
      try {
        w.webContents.send('store-updated');
      } catch {}
    });
  } catch {}
});

ipcMain.handle('delete-store', async () => {
  let user_data_path = app.getPath('userData')
  let app_data_path = join(user_data_path, 'deid.tmp')
  let exists = existsSync(app_data_path);
  if (exists) {
    await fs.unlink(app_data_path);
  }
  app.exit(0);
});

// open-file-dialog: let the user pick files from the operating system
ipcMain.handle('open-file-multi-dialog', async () => {
  // todo: enable streaming for this dialog in the case of there being a large number of files
  return dialog.showOpenDialog({ filters: [wsiCustomFilter], properties: ['openFile', 'multiSelections'] }).then(d => {

    // if canceled, return; otherwise, return the list of files that were picked
    if (d.canceled) {
      // return Promise.reject({errorCode:0, message: 'No files selected'});
      return [];
    } else {
      const fileList = makeFileInfo(d.filePaths.map(f => { return { source: f } }));
      // console.log('fileList:', fileList);
      return fileList;
    }
  });
});

// open-folder-dialog: let the user pick files from the operating system
ipcMain.handle('open-folder-dialog', async () => {
  //open the file dialog
  return dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }).then(d => {
    // if canceled, return; otherwise, return the list of files that were picked
    if (d.canceled) {
      return { error: true, message: 'No folder selected' };
    } else {
      return d.filePaths[0];
    }
  });
});

// open-folders-dialog: let the user pick multiple folders from the operating system
ipcMain.handle('open-folders-dialog', async () => {
  //open the file dialog
  return dialog.showOpenDialog({ properties: ['multiSelections', 'openDirectory', 'createDirectory'] }).then(d => {
    // if canceled, return; otherwise, return the list of files that were picked
    if (d.canceled) {
      return { error: true, message: 'No folder selected' };
    } else {
      return d.filePaths;
    }
  });
});

ipcMain.handle('get-all-wsi-file-paths', async (event, folder_path) => {
  const paths = [];
  walk.walkSync(folder_path, function (basedir, filename, stat) {
    if (['.svs', '.ndpi', '.czi', '.tiff'].includes(path.extname(filename))) {
      paths.push(join(basedir, filename));
    }
  });
  const fileList = makeFileInfo(paths.map(f => { return { source: f } }));
  return fileList;
})

// check if file exists
ipcMain.handle('check-file-exists', async (event, file_path) => {
  try {
    await fs.access(file_path);
    return true
  }
  catch {
    return false;
  }
});

ipcMain.handle('check-file-readable', async (event, file_path) => {
  try {
    await fs.access(file, fs.constants.R_OK);
    return true;
  }
  catch {
    return false;
  }
});

ipcMain.handle('check-file-writeable', async (event, file_path) => {
  try {
    await fs.access(file, fs.constants.W_OK);
    return true;
  }
  catch {
    return false;
  }
});

// read csv file
ipcMain.handle('read-csv', async (event, file) => {
  return readCSV(file);
});

// todo: test and maek sure read excel works
ipcMain.handle('read-excel', async (event, file) => {
  return readExcel(file);
});

ipcMain.handle('write-csv', async (event, file, data) => {
  return writeCSV(file, data);
});

// open-file: tell python to get metadata for a file
ipcMain.handle('metadata', async (event, file) => {
  // return PythonBridge.invoke('metadata', normalizePath(file));
  return bridge.invoke('metadata', file);
});

ipcMain.handle('open-viewer', async (event, file, row_idx) => {
  console.log(`******* Creating Viewer Window for ${file} at ${row_idx} ************`)
  const encoded_file_uri = encodeURIComponent(file);

  try {
    const options = {
      webPreferences: {
        preload: join(__dirname, `./preload.js`),
      }
    }

    const window = new BrowserWindow({
      width: 1200,
      height: 900,
      ...options,
    });

    registerRoute({
      id: 'viewer',
      browserWindow: window,
      htmlFile: path.join(__dirname, '..', 'renderer', 'viewer', 'index.html'),
      query: { file: file, row_idx: row_idx }
    })
  }

  catch (e) {
    console.log("Error creating viewer window for file:", file)
  }

});

ipcMain.handle('open-image', async (event, image_url) => {
  const window = new BrowserWindow({
    width: 1200,
    height: 900
  });
  window.loadURL(image_url);
})

const processingFiles = {}
// copy-file: make a copy from source to destination
async function processFile(fileInfo, copyNum) {
  const file = fileInfo.path;
  const name = fileInfo.rename;
  const id = fileInfo.id;
  const targetDir = fileInfo.targetDirectory;

  const alreadyProcessing = processingFiles[id];
  let tryName;
  if (copyNum) {
    const parsed = path.parse(name);
    tryName = `${parsed.name}(${copyNum})${parsed.ext}`;
  } else {
    tryName = name;
  }
  const outputPath = path.join(targetDir, tryName);

  //save a map from the id to the destination file
  processingFiles[id] = outputPath;
  const outputDir = path.parse(outputPath).dir;

  return fs.mkdir(outputDir, { recursive: true }).then(() => {
    // console.log('Copying', file, outputPath, outputDir);
    fs.copyFile(file, outputPath, fs.constants.COPYFILE_EXCL)
  }).catch(async err => {
    console.log('Error copying file', err); // this will happen if the file name already exists (code: 'EEXIST') or other reasons
    if (err.code === 'EEXIST') {
      // handle this be creating a renamed copy
      const parsed = path.parse(outputPath);
      const existing = await fs.readdir(targetDir);
      const regex = `^${parsed.name}(?:\\((\\d+)\\))?${parsed.ext}$`;
      const re = new RegExp(regex);
      // console.log('regex:', regex, re);
      //get reverse sorted list of existing copy numbers
      const matches = existing.filter(name => name.match(re)).map(name => parseInt(name.match(re)[1] || 0)).sort((a, b) => b - a);
      console.log('matches?', matches);
      if (matches) {
        // increment the prefix number and retry
        const nextIndex = matches[0] + 1;
        // return processFile(file, targetDir, name, nextIndex);
        return { retry: true, copyNum: nextIndex }
      } else if (!alreadyProcessing) {
        // no matches... just try again...?
        // return processFile(file, targetDir, name, copyNum);
        return { retry: true, copyNum: copyNum }
      } else {
        return err;
      }
    } else {
      return err;
    }
  }).then(x => {
    const copiedFile = processingFiles[id];
    delete processingFiles[id]; // clear the cache of this key
    console.log('In then', x, processingFiles);
    if (x?.errno) {
      console.log('Returning error', x)
      return x;
    } else if (x?.retry) {
      console.log('Retrying with copy num', x.copyNum);
      return processFile(fileInfo, x.copyNum);
    } else {
      console.log('Returning copied file', copiedFile);
      return copiedFile;
    }
  });
}

ipcMain.handle('get-errors', async (event) => {
  try {
    return bridge.invoke('get-errors');
  }
  catch (e) {
    console.log("Cannot get errors.  Is the python bridge process running?", e);
    return [{ message: "Cannot get errors.  Is the python bridge process running?", error: e }];
  }
});

ipcMain.handle('get-debugs', async (event) => {
  return bridge.invoke('get-debugs');
});

ipcMain.handle('clear-errors', async (event) => {
  return bridge.invoke('clear-errors');
});

ipcMain.handle('clear-debugs', async (event) => {
  return bridge.invoke('clear-debugs');
});

ipcMain.handle('get-output-path', async (event, info) => {
  return bridge.invoke('get-output-path', info);
});

ipcMain.handle('copy-file', async (event, source, destination) => {
  return fs.copyFile(source, destination);
});


ipcMain.handle('process-file', async (event, info) => {
  return bridge.invoke('deid-process', info);
});

ipcMain.handle('preview-metadata', async (event, info) => {
  return bridge.invoke('preview-metadata', info);
});

ipcMain.handle('get-progress', async (event, info, output_path) => {
  try {
    let partial_output_path = output_path + ".partial";

    const output_stats = await fs.stat(partial_output_path);

    const input_size = info.__reserved.bytes;
    const output_size = output_stats.size;
    const progress = output_size / input_size * 100;

    return {
      progress: progress,
      bytes: output_size,
      message: 'File progressing',
      time: new Date().getTime()
    }


  } catch (e) {
    if (e?.code !== 'ENOENT') {
      console.log("Error getting progress", e);
    } else if (process?.env?.VERBOSE_PROCESS_PROGRESS === '1') {
      console.log("Error getting progress", e);
    }
    return null;
  }
});

ipcMain.handle('get-copy-progress', async (event, id) => {
  const file = processingFiles[id];
  if (file) {
    const stats = await fs.stat(file);
    // console.log('File stats',file, stats);
    return {
      path: file,
      size: stats.size
    };
  } else {
    return null;
  }

});

