import { app, ipcMain, BrowserWindow, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import { PythonBridge , makeBridge} from './bridge/pythonBridge';
import './handlers'; // side effects - sets up ipcMain handlers

// const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createMainWidow = () => {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: '/src/assets/BDSA-icon.png'
  });

  
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  console.log(process.argv);
  if(process.argv.includes('debug')){
    // Open the DevTools.
    mainWindow.webContents.openDevTools({mode: 'bottom'});
  }
  
  
};


protocol.registerSchemesAsPrivileged([ 
  { scheme: 'test', privileges: { secure: true, standard: true, supportFetchAPI: true, }, },
  { scheme: 'tile', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'thumbnail', privileges: { secure: true, standard: false, supportFetchAPI: true, }, }, 
  { scheme: 'image', privileges: { secure: true, standard: false, supportFetchAPI: true, }, }, 
]);


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=>{

  protocol.handle('thumbnail', async (request) => {
    return PythonBridge.invoke('thumbnail',decodeURI(request.url).slice('thumbnail://'.length))
      .then(fetch)
      .catch(e=>console.log('Error fetching thumbnail',e));
  });

  protocol.handle('image', async (request) => {
    const [file, image] = decodeURI(request.url).slice('image://'.length).split('|');
    return PythonBridge.invoke('image',{file, image})
      .then(fetch)
      .catch(e=>console.log('Error fetching image',e));
  });

  protocol.handle('tile', async (request) => {
    const [base, query] = decodeURI(request.url).slice('tile://'.length).split('?');
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

  

  createMainWidow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWidow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
