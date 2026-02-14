import { app, BrowserWindow, protocol, ipcMain } from 'electron';
import {join} from 'path';
import { PythonBridge } from './bridge/pythonBridge';
import './handlers'; // side effects - sets up ipcMain handlers
import { registerRoute } from './routers/main-electron-router';
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from "electron-devtools-installer";
import {decodeURLParameters} from "./helpers/url_helpers";
import {clear_files_from_store} from "./helpers/electron_helpers";
import {unlinkSync, existsSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import { createHash } from 'crypto';

// const path = require('path');

const bridge = new PythonBridge();

// ============================================================================
// Cache Setup: Two-tier caching (Memory LRU + Disk)
// ============================================================================

// Use system temp directory - always exists, no initialization needed
// Cache directories will be created lazily when needed
let cacheDir, thumbnailCacheDir, metadataCacheDir, labelCacheDir, macroCacheDir;

// Create cache subdirectories (idempotent, safe to call multiple times)
function ensureCacheSubdirectories() {
  [thumbnailCacheDir, metadataCacheDir, labelCacheDir, macroCacheDir].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}

// LRU Cache will be loaded dynamically to avoid ESM/CommonJS issues
let LRUCache;
let thumbnailCache, metadataCache, labelCache, macroCache;

// Initialize LRU caches dynamically after app is ready
async function initializeCaches() {
  try {
    // Dynamic import to avoid ESM/CommonJS issues
    const lruCacheModule = await import('lru-cache');
    LRUCache = lruCacheModule.LRUCache;
    
    // Create caches
    thumbnailCache = new LRUCache({
      max: 100, // Max 100 thumbnails
      maxSize: 50 * 1024 * 1024, // 50MB max
      sizeCalculation: (value) => {
        // Value is data URI string, estimate size
        return value.length;
      },
      ttl: 1000 * 60 * 60 // 1 hour TTL
    });

    metadataCache = new LRUCache({
      max: 500, // More metadata entries
      maxSize: 10 * 1024 * 1024, // 10MB
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
      ttl: 1000 * 60 * 30 // 30 minutes
    });

    labelCache = new LRUCache({
      max: 50,
      maxSize: 25 * 1024 * 1024, // 25MB
      sizeCalculation: (value) => value.length,
      ttl: 1000 * 60 * 60
    });

    macroCache = new LRUCache({
      max: 50,
      maxSize: 25 * 1024 * 1024, // 25MB
      sizeCalculation: (value) => value.length,
      ttl: 1000 * 60 * 60
    });
  } catch (error) {
    console.error('Failed to initialize LRU caches:', error);
    // Caches will remain undefined, handlers will skip caching
  }
}

// Helper to convert data URI string to buffer
function dataURIToBuffer(dataURI) {
  // Handle both full data URI and just base64 data
  const base64Data = dataURI.includes(',') ? dataURI.split(',')[1] : dataURI;
  return Buffer.from(base64Data, 'base64');
}

// Helper to get cache file path from file path
function getCacheFilePath(filePath, resourceType) {
  // Defensive: ensure directories are initialized
  if (!cacheDir) {
    cacheDir = join(app.getPath('temp'), 'SlideRelabeler-cache');
    thumbnailCacheDir = join(cacheDir, 'thumbnails');
    metadataCacheDir = join(cacheDir, 'metadata');
    labelCacheDir = join(cacheDir, 'labels');
    macroCacheDir = join(cacheDir, 'macros');
  }
  
  const hash = createHash('sha256').update(filePath).digest('hex');
  let dir, ext;
  
  switch (resourceType) {
    case 'thumbnail':
      dir = thumbnailCacheDir;
      ext = '.png';
      break;
    case 'metadata':
      dir = metadataCacheDir;
      ext = '.json';
      break;
    case 'label':
      dir = labelCacheDir;
      ext = '.png';
      break;
    case 'macro':
      dir = macroCacheDir;
      ext = '.png';
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
  
  return join(dir, `${hash}${ext}`);
}


// Helper to invalidate cache for a file path
function invalidateCache(filePath) {
  // Clear from memory caches (if initialized)
  if (thumbnailCache) thumbnailCache.delete(filePath);
  if (metadataCache) metadataCache.delete(filePath);
  if (labelCache) labelCache.delete(filePath);
  if (macroCache) macroCache.delete(filePath);
  
  // Clear from disk cache
  const thumbnailPath = getCacheFilePath(filePath, 'thumbnail');
  const metadataPath = getCacheFilePath(filePath, 'metadata');
  const labelPath = getCacheFilePath(filePath, 'label');
  const macroPath = getCacheFilePath(filePath, 'macro');
  
  if (existsSync(thumbnailPath)) unlinkSync(thumbnailPath);
  if (existsSync(metadataPath)) unlinkSync(metadataPath);
  if (existsSync(labelPath)) unlinkSync(labelPath);
  if (existsSync(macroPath)) unlinkSync(macroPath);
}

// Listen for cache invalidation events
ipcMain.on('invalidate-cache', (event, filePath) => {
  invalidateCache(filePath);
});

// Listen for clear all cache
ipcMain.on('clear-all-cache', () => {
  // Clear memory caches (if initialized)
  if (thumbnailCache) thumbnailCache.clear();
  if (metadataCache) metadataCache.clear();
  if (labelCache) labelCache.clear();
  if (macroCache) macroCache.clear();
  
  // Note: Disk cache in temp directory will be cleaned up by OS
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

if (handleSquirrelEvent()) {
  app.quit();
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const app_folder = path.resolve(process.execPath, '..');
  const root_app_folder = path.resolve(app_folder, '..');
  const update_dot_exe = path.resolve(path.join(root_app_folder, 'Update.exe'));
  const exe_name = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(update_dot_exe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      let user_data_path = app.getPath('userData')
      let app_data_path = join(user_data_path, 'deid.tmp')
      let exists = existsSync(app_data_path);
      if (exists) {
        unlinkSync(app_data_path);
      }
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exe_name]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exe_name]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
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
  { scheme: 'preview-metadata', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
  { scheme: 'metadata', privileges: { secure: true, standard: false, supportFetchAPI: true, }, },
]);


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async ()=>{
  // Initialize cache directory paths (must be done after app is ready)
  cacheDir = join(app.getPath('temp'), 'SlideRelabeler-cache');
  thumbnailCacheDir = join(cacheDir, 'thumbnails');
  metadataCacheDir = join(cacheDir, 'metadata');
  labelCacheDir = join(cacheDir, 'labels');
  macroCacheDir = join(cacheDir, 'macros');
  
  // Initialize LRU caches dynamically
  await initializeCaches();
  
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
    title: 'SlideRelabeler',
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

  protocol.handle('metadata', async (request,) => {
    const url = new URL(request.url);
    const filePath = decodeURIComponent(url.hostname);
    
    try {
      // 1. Check memory cache first (if initialized)
      if (metadataCache) {
        const memoryCached = metadataCache.get(filePath);
        if (memoryCached) {
          return new Response(JSON.stringify(memoryCached), {
            headers: { 'content-type': 'application/json' }
          });
        }
      }
      
      // 2. Check disk cache
      const diskCachePath = getCacheFilePath(filePath, 'metadata');
      if (existsSync(diskCachePath)) {
        const diskCached = JSON.parse(readFileSync(diskCachePath, 'utf8'));
        
        // Also populate memory cache for faster future access (if initialized)
        if (metadataCache) {
          metadataCache.set(filePath, diskCached);
        }
        
        return new Response(JSON.stringify(diskCached), {
          headers: { 'content-type': 'application/json' }
        });
      }
      
      // 3. Fetch from Python bridge
      const result = await bridge.invoke('metadata', filePath);
      
      // 4. Write to both caches
      if (metadataCache) {
        metadataCache.set(filePath, result);
      }
      
      // Write to disk cache (non-blocking, failures are logged but don't break the flow)
      try {
        ensureCacheSubdirectories();
        writeFileSync(diskCachePath, JSON.stringify(result), 'utf8');
      } catch (diskError) {
        // Log but don't throw - disk cache is an optimization, not critical
        console.warn(`Failed to write to disk cache for ${filePath}:`, diskError.message);
        // Continue - data is already in memory cache
      }
      
      return new Response(JSON.stringify(result), {
        headers: { 'content-type': 'application/json' }
      });
    } catch (e) {
      console.log('Error fetching metadata', e);
      throw e;
    }
  });

  protocol.handle('thumbnail', async (request,) => {
    const url = new URL(request.url);
    const filePath = decodeURIComponent(url.hostname);
    
    try {
      // 1. Check memory cache first (if initialized)
      if (thumbnailCache) {
        const memoryCached = thumbnailCache.get(filePath);
        if (memoryCached) {
          const buffer = dataURIToBuffer(memoryCached);
          return new Response(buffer, {
            headers: { 'content-type': 'image/png' }
          });
        }
      }
      
      // 2. Check disk cache
      const diskCachePath = getCacheFilePath(filePath, 'thumbnail');
      if (existsSync(diskCachePath)) {
        const diskCached = readFileSync(diskCachePath);
        // diskCached is already a buffer, return it directly
        // Also convert to data URI for memory cache
        const dataURI = `data:image/png;base64,${diskCached.toString('base64')}`;
        
        // Also populate memory cache for faster future access (if initialized)
        if (thumbnailCache) {
          thumbnailCache.set(filePath, dataURI);
        }
        
        return new Response(diskCached, {
          headers: { 'content-type': 'image/png' }
        });
      }
      
      // 3. Fetch from Python bridge
      const dataURI = await bridge.invoke('thumbnail', filePath);
      
      // 4. Extract buffer from data URI and write to both caches
      const buffer = dataURIToBuffer(dataURI);
      
      // Write to memory cache (store as data URI) - if initialized
      if (thumbnailCache) {
        thumbnailCache.set(filePath, dataURI);
      }
      
      // Write to disk cache (store as binary PNG) - non-blocking
      try {
        ensureCacheSubdirectories();
        writeFileSync(diskCachePath, buffer);
      } catch (diskError) {
        // Log but don't throw - disk cache is an optimization, not critical
        console.warn(`Failed to write to disk cache for ${filePath}:`, diskError.message);
        // Continue - data is already in memory cache
      }
      
      return new Response(buffer, {
        headers: { 'content-type': 'image/png' }
      });
    } catch (e) {
      console.log('Error fetching thumbnail', e);
      throw e;
    }
  });

  protocol.handle('macro', async (request,) => {
    const url = new URL(request.url);
    const filePath = decodeURIComponent(url.hostname);
    
    try {
      // 1. Check memory cache first (if initialized)
      if (macroCache) {
        const memoryCached = macroCache.get(filePath);
        if (memoryCached) {
          const buffer = dataURIToBuffer(memoryCached);
          return new Response(buffer, {
            headers: { 'content-type': 'image/png' }
          });
        }
      }
      
      // 2. Check disk cache
      const diskCachePath = getCacheFilePath(filePath, 'macro');
      if (existsSync(diskCachePath)) {
        const diskCached = readFileSync(diskCachePath);
        // diskCached is already a buffer, return it directly
        // Also convert to data URI for memory cache
        const dataURI = `data:image/png;base64,${diskCached.toString('base64')}`;
        
        // Also populate memory cache for faster future access (if initialized)
        if (macroCache) {
          macroCache.set(filePath, dataURI);
        }
        
        return new Response(diskCached, {
          headers: { 'content-type': 'image/png' }
        });
      }
      
      // 3. Fetch from Python bridge
      const dataURI = await bridge.invoke('macro', filePath);
      
      // 4. Extract buffer from data URI and write to both caches
      const buffer = dataURIToBuffer(dataURI);
      
      // Write to memory cache (if initialized)
      if (macroCache) {
        macroCache.set(filePath, dataURI);
      }
      
      // Write to disk cache - non-blocking
      try {
        ensureCacheSubdirectories();
        writeFileSync(diskCachePath, buffer);
      } catch (diskError) {
        // Log but don't throw - disk cache is an optimization, not critical
        console.warn(`Failed to write to disk cache for ${filePath}:`, diskError.message);
        // Continue - data is already in memory cache
      }
      
      return new Response(buffer, {
        headers: { 'content-type': 'image/png' }
      });
    } catch (e) {
      console.log('Error fetching macro', e);
      throw e;
    }
  });

  protocol.handle('label', async (request,) => {
    const url = new URL(request.url);
    const filePath = decodeURIComponent(url.hostname);
    
    try {
      // 1. Check memory cache first (if initialized)
      if (labelCache) {
        const memoryCached = labelCache.get(filePath);
        if (memoryCached) {
          const buffer = dataURIToBuffer(memoryCached);
          return new Response(buffer, {
            headers: { 'content-type': 'image/png' }
          });
        }
      }
      
      // 2. Check disk cache
      const diskCachePath = getCacheFilePath(filePath, 'label');
      if (existsSync(diskCachePath)) {
        const diskCached = readFileSync(diskCachePath);
        // diskCached is already a buffer, return it directly
        // Also convert to data URI for memory cache
        const dataURI = `data:image/png;base64,${diskCached.toString('base64')}`;
        
        // Also populate memory cache for faster future access (if initialized)
        if (labelCache) {
          labelCache.set(filePath, dataURI);
        }
        
        return new Response(diskCached, {
          headers: { 'content-type': 'image/png' }
        });
      }
      
      // 3. Fetch from Python bridge
      const dataURI = await bridge.invoke('label', filePath);
      
      // 4. Extract buffer from data URI and write to both caches
      const buffer = dataURIToBuffer(dataURI);
      
      // Write to memory cache (if initialized)
      if (labelCache) {
        labelCache.set(filePath, dataURI);
      }
      
      // Write to disk cache - non-blocking
      try {
        ensureCacheSubdirectories();
        writeFileSync(diskCachePath, buffer);
      } catch (diskError) {
        // Log but don't throw - disk cache is an optimization, not critical
        console.warn(`Failed to write to disk cache for ${filePath}:`, diskError.message);
        // Continue - data is already in memory cache
      }
      
      return new Response(buffer, {
        headers: { 'content-type': 'image/png' }
      });
    } catch (e) {
      console.log('Error fetching label', e);
      throw e;
    }
  });

  protocol.handle('preview-macro', async (request,) => {
    const url = new URL(request.url);
    const decoded_params = decodeURLParameters(url.searchParams);
    return bridge.invoke('preview-macro', decoded_params)
      .then(fetch)
      .catch(e=>console.log('Error fetching preview-macro',e));
  });

  protocol.handle('preview-label', async (request,) => {
    const url = new URL(request.url);
    const decoded_params = decodeURLParameters(url.searchParams);
    return bridge.invoke('preview-label', decoded_params)
      .then(fetch)
      .catch(e=>console.log('Error fetching preview-label',e));
  });

  protocol.handle('preview-metadata', async (request,) => {
    const url = new URL(request.url);
    const decoded_params = decodeURLParameters(url.searchParams);
    return bridge.invoke('preview-metadata', decoded_params)
      .then(fetch)
      .catch(e=>console.log('Error fetching preview-metadata',e));
  });

  protocol.handle('image', async (request) => {
    let [file, image] = decodeURI(request.url).slice('image://'.length).split('|');
    file = decodeURIComponent(file);
    image = decodeURIComponent(image);
    return bridge.invoke('image',{file, image})
      .then(fetch)
      .catch(e=>console.log('Error fetching image',e));
  });

  protocol.handle('tile', async (request) => {
    let [base, query] = decodeURI(request.url).slice('tile://'.length).split('?');
    base = decodeURIComponent(base);

    const [file, level, x, y] = base.split('|');
    
    return bridge.invoke('tile',{file, level, x, y})
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
        title: 'SlideRelabeler',
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
