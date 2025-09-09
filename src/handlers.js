import { ipcMain, dialog, BrowserWindow, app, safeStorage } from 'electron';
import { PythonBridge } from './bridge/pythonBridge';
import path, { join } from 'path';
import fs from 'fs/promises';
import { open, read, close } from 'fs';
import { existsSync, accessSync, readFileSync, writeFileSync } from 'fs';
import { registerRoute } from './routers/main-electron-router';
import { readCSV, readExcel, writeCSV } from "./utilities/csv_excel_helpers";
import walk from 'fs-walk';
import DSAAPI from './api/DSAAPI';

let bridge = new PythonBridge();

const wsiCustomFilter = { name: 'WSI Files (*.svs, *.ndpi, *.tif, *.tiff)', extensions: ['svs', 'ndpi', 'tif', 'tiff'] };

let upload_status = {
};

let dsa_client = null;

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

function get_browser_window_by_title(title) {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (window.getTitle() === title) {
      return window;
    }
  }
  return null;
}

function read_and_send_file_chunk(window, fd, upload_id, file_row_idx, file_path, file_size, file_buffer, data_offset, chunk_size) {
  return new Promise(async (resolve, reject) => {
    read(fd, file_buffer, 0, chunk_size, -1, async (err, bytesRead, buffer) => {
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

      data_offset += bytesRead;
      if (response && response[0]) {
        const progress = (response[1].received / file_size) * 100;

        if (finalize) {
          window.webContents.send('dsa-upload-file-complete', file_row_idx);
        } else {
          window.webContents.send('dsa-upload-file-progress', { file_path: file_path, progress: progress, row_idx: file_row_idx });
        }
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
      await fs.unlink(file_path);
    }
    return true;
  } catch (err) {
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
  console.log("Paths :", paths);
  const fileList = makeFileInfo(paths.map(f => { return { source: f } }));
  console.log("File list ", fileList);
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

    console.log("Register route", registerRoute);

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
    console.log("Error getting progress", e);
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

