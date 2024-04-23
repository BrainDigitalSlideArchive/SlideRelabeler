import { ipcMain, dialog, BrowserWindow } from 'electron';
import { PythonBridge } from './bridge/pythonBridge';
import path from 'path';
import fs from 'fs/promises';
import { parseSpreadsheet } from './utilities/parseSpreadsheet';
// import re from 're';

// open-file-dialog: let the user pick files from the operating system
ipcMain.handle('open-file-dialog', async ()=>{

    function normalizePath(path){
        return path.replaceAll('\\', '/');
    }

    /**
     * @param { Array } list Array of object with fields source (mandatory) and destination (optional)
     */
    function makeFileInfo(list){
        let output = list.map(arr=>{
            const info = {
                source: {
                    filename: path.basename(arr.source),
                    directory: normalizePath(path.dirname(arr.source)),
                    path: normalizePath(arr.source),
                    parsed: path.parse(normalizePath(arr.source)),
                    sep:normalizePath(path.sep)
                }
            }
            if(arr.destination){
                info.destination = {
                    filename: path.basename(arr.destination),
                    directory: normalizePath(path.dirname(arr.destination)),
                    path: normalizePath(arr.destination),
                    parsed: path.parse(normalizePath(arr.destination)),
                    sep:normalizePath(path.sep)
                }
            }
            
            return info;
        });
        return output;
    }
    //open the file dialog
    return dialog.showOpenDialog({properties: ['openFile', 'multiSelections']}).then(d=>{
        console.log('showOpenFileDialog called');
        // if canceled, return; otherwise, return the list of files that were picked
        if(d.canceled){
            // return Promise.reject({errorCode:0, message: 'No files selected'});
            return [];
        } else {
            const fileList = makeFileInfo(d.filePaths.map(f=>{return {source:f}}));
            // console.log('fileList:', fileList);
            const spreadsheets = fileList.filter(f => {
                const ext = f.source.parsed.ext.toLowerCase();
                console.log('File extension', ext);
                return ext==='.csv' || ext==='.xlsx';
            });
            // console.log('spreadsheets:',spreadsheets)
            if(spreadsheets.length === 0){
                return fileList;
            } else if (spreadsheets.length !== fileList.length){
                return {error:true, errorCode:1, message: 'Selecting spreadsheets and images at the same time is not supported'};
            } else if (spreadsheets.length > 1){
                return {error: true, errorCode:2, message: 'Only one spreadsheet can be selected at a time'};
            } else {
                try{
                    return parseSpreadsheet(fileList[0].source);
                } catch(error){
                    return {error: true, message:error.message};
                }
            }
        }
    });
});


// open-folder-dialog: let the user pick files from the operating system
ipcMain.handle('open-folder-dialog', async ()=>{
    //open the file dialog
    return dialog.showOpenDialog({properties: ['openDirectory','createDirectory']}).then(d=>{
        // if canceled, return; otherwise, return the list of files that were picked
        if(d.canceled){
            return {error: true, message: 'No folder selected'};
        } else {
            return d.filePaths[0]
        }
    });
});



// open-file: tell python to get metadata for a file
ipcMain.handle('metadata', async (event, file) => {
    return PythonBridge.invoke('metadata', file);
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

});

const processingFiles = {}
// copy-file: make a copy from source to destination
async function processFile(fileInfo, copyNum){
    console.log('fileInfo', fileInfo);
    const file = fileInfo.path;
    const name = fileInfo.rename;
    const id = fileInfo.id;
    const targetDir = fileInfo.targetDirectory;

    const alreadyProcessing = processingFiles[id];
    let tryName;
    if(copyNum){
        const parsed = path.parse(name);
        tryName = `${parsed.name}(${copyNum})${parsed.ext}`;
    } else {
        tryName = name;
    }
    const outputPath = path.join(targetDir, tryName);

    //save a map from the id to the destination file
    processingFiles[id] = outputPath;
    const outputDir = path.parse(outputPath).dir;

    return fs.mkdir(outputDir, {recursive: true}).then( ()=>{
        // console.log('Copying', file, outputPath, outputDir);
        fs.copyFile(file, outputPath, fs.constants.COPYFILE_EXCL)
    }).catch(async err=>{
        console.log('Error copying file', err); // this will happen if the file name already exists (code: 'EEXIST') or other reasons
        if(err.code === 'EEXIST'){
            // handle this be creating a renamed copy
            const parsed = path.parse(outputPath);
            const existing = await fs.readdir(targetDir);
            const regex = `^${parsed.name}(?:\\((\\d+)\\))?${parsed.ext}$`;
            const re = new RegExp(regex);
            // console.log('regex:', regex, re);
            //get reverse sorted list of existing copy numbers
            const matches = existing.filter(name => name.match(re)).map(name => parseInt(name.match(re)[1]||0)).sort((a,b)=>b-a);
            console.log('matches?', matches);
            if(matches){
                // increment the prefix number and retry
                const nextIndex = matches[0]+1;
                // return processFile(file, targetDir, name, nextIndex);
                return {retry: true, copyNum: nextIndex}
            } else if(!alreadyProcessing){
                // no matches... just try again...?
                // return processFile(file, targetDir, name, copyNum);
                return {retry: true, copyNum: copyNum}
            } else {
                return err;
            }
        } else {
            return err;
        }
    }).then( x => {
        const copiedFile = processingFiles[id];
        delete processingFiles[id]; // clear the cache of this key
        console.log('In then', x, processingFiles);
        if(x?.errno){
            console.log('Returning error', x)
            return x;
        } else if (x?.retry){
            console.log('Retrying with copy num', x.copyNum);
            return processFile(fileInfo, x.copyNum);
        } else {
            console.log('Returning copied file', copiedFile);
            return copiedFile;
        }
    });
}
ipcMain.handle('process-file', async(event, info)=>{
    // fs.copyFile(file.path, )
    console.log('process-file', info)
    return processFile(info);

})

ipcMain.handle('get-copy-progress', async(event, id)=>{
    const file = processingFiles[id];
    if(file){
        const stats = await fs.stat(file);
        // console.log('File stats',file, stats);
        return {
            path: file,
            size: stats.size
        };
    } else {
        return null;
    }
    
})

