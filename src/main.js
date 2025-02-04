import { app, BrowserWindow, protocol } from 'electron';
import {join} from 'path';
import { PythonBridge } from './bridge/pythonBridge';
import './handlers'; // side effects - sets up ipcMain handlers
import { registerRoute } from './routers/main-electron-router';
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer";
import {decodeURLParameters} from "./helpers/url_helpers";
import {clear_files_from_store} from "./helpers/electron_helpers";

// const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([ 
  { scheme: 'test', privileges: { secure: true, standard: true, supportFetchAPI: true, }, },
  { scheme: 'tile', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'thumbnail', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'label', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'image', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'macro', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'preview-label', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'preview-macro', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
]);


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=>{
  // First initalize the needed dev tools
  if (process.env.NODE_ENV === 'development') {
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
    installExtension(REDUX_DEVTOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
  }

  const options = {
    webPreferences: {
      preload: join(__dirname, `./preload.js`),
    }
  };

  const window = new BrowserWindow({
    width: 1200,
    height: 900,
    ...options,
  });

  registerRoute( {
    id: 'main',
    browserWindow: window,
    htmlFile: join(__dirname, '..', 'renderer', 'main', 'index.html'),
  });

  window.on('closed', (event) => {
    clear_files_from_store();
  })

  protocol.handle('thumbnail', async (request,) => {
    const url = new URL(request.url);
    const value = decodeURIComponent(url.hostname);
    return PythonBridge.invoke('thumbnail', value)
      .then(fetch)
      .catch(e=>console.log('Error fetching thumbnail',e));
  });

  protocol.handle('macro', async (request,) => {
    const url = new URL(request.url);
    const value = decodeURIComponent(url.hostname);
    return PythonBridge.invoke('macro', value)
      .then(fetch)
      .catch(e=>console.log('Error fetching thumbnail',e));
  });

  protocol.handle('label', async (request,) => {
    const url = new URL(request.url);
    const value = decodeURIComponent(url.hostname);
    return PythonBridge.invoke('label', value)
      .then(fetch)
      .catch(e=>console.log('Error fetching thumbnail',e));
  });

  protocol.handle('preview-macro', async (request,) => {
    const url = new URL(request.url);
    const decoded_params = decodeURLParameters(url.searchParams);
    return PythonBridge.invoke('preview-macro', decoded_params)
      .then(fetch)
      .catch(e=>console.log('Error fetching thumbnail',e));
  });

  protocol.handle('preview-label', async (request,) => {
    const url = new URL(request.url);
    const decoded_params = decodeURLParameters(url.searchParams);
    return PythonBridge.invoke('preview-label', decoded_params)
      .then(fetch)
      .catch(e=>console.log('Error fetching thumbnail',e));
  });

  protocol.handle('image', async (request) => {
    let [file, image] = decodeURI(request.url).slice('image://'.length).split('|');
    file = decodeURIComponent(file);
    image = decodeURIComponent(image);
    return PythonBridge.invoke('image',{file, image})
      .then(fetch)
      .catch(e=>console.log('Error fetching image',e));
  });

  protocol.handle('tile', async (request) => {
    let [base, query] = decodeURI(request.url).slice('tile://'.length).split('?');
    base = decodeURIComponent(base);

    const [file, level, x, y] = base.split('|');
    
    return PythonBridge.invoke('tile',{file, level, x, y})
      .then(fetch)
      .catch(e=>console.log('Error fetching tile',e));
  });

  protocol.handle('test', async (request) => {
    console.log('Got test request', request.url);
    
    let resp = new Response('Test test test',{
      headers: { 'content-type': 'text/plain' }
    });

    return resp;
    });
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app whe
    //  mn the
    // dock icon is clicked and there are other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {

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

      registerRoute( {
        id: 'main',
        browserWindow: window,
        htmlFile: join(__dirname, '..', 'renderer', 'main', 'index.html'),
      })

    }
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  clear_files_from_store();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
