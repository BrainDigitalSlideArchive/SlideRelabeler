import { ipcMain, dialog, BrowserWindow } from 'electron';
import { PythonBridge } from './bridge/pythonBridge';
import path from 'path';

// open-file-dialog: let the user pick files from the operating system
ipcMain.handle('open-file-dialog', async ()=>{
    //open the file dialog
    return dialog.showOpenDialog({properties: ['openFile', 'multiSelections']}).then(d=>{
        // if canceled, return; otherwise, return the list of files that were picked
        if(d.canceled){
            return Promise.reject('No files selected');
        } else {
            // return PythonBridge.invoke('open-files', d.filePaths);
            return d.filePaths.map(file=>{
                return {
                    filename: path.basename(file),
                    directory: path.dirname(file),
                    path:file,
                }
            });
        }
    });
});


// open-folder-dialog: let the user pick files from the operating system
ipcMain.handle('open-folder-dialog', async ()=>{
    //open the file dialog
    return dialog.showOpenDialog({properties: ['openDirectory','createDirectory']}).then(d=>{
        // if canceled, return; otherwise, return the list of files that were picked
        if(d.canceled){
            return Promise.reject('No folder selected');
        } else {
            return d.filePaths[0]
        }
    });
});



// open-file: tell python to open a file
ipcMain.handle('open-file', async (event, file) => {
    return PythonBridge.invoke('open-file', file);
});

ipcMain.handle('open-viewer', async (event, file) => {
    // console.log(JSON.stringify(event))
    // console.log(`******* Creating Viewer Window for ${file} ************`)

    // Create the browser window.
    const viewerWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    if (VIEWER_WINDOW_VITE_DEV_SERVER_URL) {
        viewerWindow.loadURL(VIEWER_WINDOW_VITE_DEV_SERVER_URL+`?file=${file}`);
    } else {
        viewerWindow.loadFile(path.join(__dirname, `../renderer/${VIEWER_WINDOW_VITE_NAME}/index.html`), {query: {file: file}});
    }

    // viewerWindow.webContents.openDevTools({mode: 'bottom'});
});