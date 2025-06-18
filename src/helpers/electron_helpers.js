import {app, BrowserWindow, safeStorage} from "electron";
import {join} from "path";
import {accessSync, existsSync, readFileSync, writeFileSync} from "fs";
import fs from "fs/promises";

export function create_window(id, dev_server_url, fileRoute, options = {}) {
    const window = new BrowserWindow({
        width: 1200,
        height: 900,
        ...options,
    });

    // File route unpacked because contains an array of params
    // Dev server url is  a url string
    // loadFile for electron expects a file path and options object which can contain both a hash and query params
    // the react router setup requires the file path to be passed as a hash

    process.env.NODE_ENV === 'development'? window.loadURL(dev_server_url) : window.loadFile(...fileRoute);

    return window
}

export function create_window_no_router(dev_server_url, file_route, options) {
  const window = new BrowserWindow({
      width: 1200,
      height: 900,
    ...options
  });

  process.env.NODE_ENV === 'development'? window.loadURL(dev_server_url) : window.loadFile(file_route);

  return window
}

export function clear_files_from_store() {
  let user_data_path = app.getPath('userData')
  let app_data_path = join(user_data_path, 'deid.tmp')
  let exists = existsSync(app_data_path);
  if (exists) {
    try {
      accessSync(app_data_path, fs.constants.R_OK);
      let app_data = readFileSync(app_data_path);
      let json_string = safeStorage.decryptString(app_data);
      let json_data = JSON.parse(json_string);
      delete json_data.files

      let encrypted_data = safeStorage.encryptString(JSON.stringify(json_data));
      writeFileSync(app_data_path, encrypted_data, {encoding: 'utf8'})
    }
    catch(err) {
      console.error("Failed to delete files from store", err)
    }
  }
}