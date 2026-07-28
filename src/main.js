import { app, BrowserWindow, protocol, shell } from "electron";
import { join } from "path";
import { bridge } from "./handlers"; // side effects - sets up ipcMain handlers
import { registerRoute } from "./routers/main-electron-router";
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from "electron-devtools-installer";
import { decodeURLParameters } from "./helpers/url_helpers";
import { clear_files_from_store } from "./helpers/electron_helpers";
import { unlinkSync, existsSync } from "fs";

// const bridge = new GrpcPythonBridge();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

if (handleSquirrelEvent()) {
  app.quit();
}

/** Open http(s) from target=_blank / window.open in the system browser, not a blank Electron window. */
app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        shell.openExternal(url);
      }
    } catch {
      // ignore invalid URLs
    }
    return { action: "deny" };
  });
});

function handleSquirrelEvent() {
  if (process.argv.length === 1) return false;

  const ChildProcess = require("child_process");
  const path = require("path");

  const app_folder = path.resolve(process.execPath, "..");
  const root_app_folder = path.resolve(app_folder, "..");
  const update_dot_exe = path.resolve(path.join(root_app_folder, "Update.exe"));
  const exe_name = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess;
    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch {}
    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(update_dot_exe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case "--squirrel-install":
    case "--squirrel-updated": {
      let user_data_path = app.getPath("userData");
      let app_data_path = join(user_data_path, "deid.tmp");
      let exists = existsSync(app_data_path);
      if (exists) unlinkSync(app_data_path);

      spawnUpdate(["--createShortcut", exe_name]);
      setTimeout(app.quit, 1000);
      return true;
    }

    case "--squirrel-uninstall":
      spawnUpdate(["--removeShortcut", exe_name]);
      setTimeout(app.quit, 1000);
      return true;

    case "--squirrel-obsolete":
      app.quit();
      return true;
  }
  return false;
}

protocol.registerSchemesAsPrivileged([
  { scheme: "test", privileges: { secure: true, standard: true, supportFetchAPI: true } },
  { scheme: "tile", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "thumbnail", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "label", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "image", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "macro", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "preview-label", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "preview-macro", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "preview-metadata", privileges: { secure: true, standard: false, supportFetchAPI: true } },
  { scheme: "metadata", privileges: { secure: true, standard: false, supportFetchAPI: true } },
]);

function imageReplyToResponse(reply) {
  // reply = { mime_type, image_bytes } from gRPC bridge
  // image_bytes might be Buffer or Uint8Array; normalize to Buffer
  const body = Buffer.isBuffer(reply?.image_bytes) ? reply.image_bytes : Buffer.from(reply?.image_bytes || []);
  const mime = reply?.mime_type || "application/octet-stream";
  return new Response(body, {
    headers: {
      "content-type": mime,
      // Allow caching of immutable-ish image bytes to prevent flicker/refetch on rerenders.
      // (Custom schemes can be cached; no-store forces repeated loads.)
      "cache-control": "private, max-age=3600",
    },
  });
}

function jsonToResponse(obj) {
  return new Response(JSON.stringify(obj ?? null), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function decodePreviewRequestParams(requestUrl) {
  const url = new URL(requestUrl);
  let searchParams = url.searchParams;

  // Some custom-scheme requests can arrive with an empty URL.searchParams even
  // when a raw query string exists. Fall back to manual query extraction.
  if (Array.from(searchParams.keys()).length === 0 && requestUrl.includes("?")) {
    const rawQuery = requestUrl.slice(requestUrl.indexOf("?") + 1).split("#")[0];
    searchParams = new URLSearchParams(rawQuery);
  }

  return decodeURLParameters(searchParams);
}

app.on("ready", async () => {
  // DevTools
  if (process.env.NODE_ENV === "development") {
    installExtension(REACT_DEVELOPER_TOOLS).catch((err) => console.log("Devtools error:", err));
    installExtension(REDUX_DEVTOOLS).catch((err) => console.log("Devtools error:", err));
  }

  // Optional: start python early so first protocol fetch is fast
  // (bridge.invoke() will also start lazily if you remove this)
  try {
    await bridge.start?.();
  } catch (e) {
    console.error("Failed to start gRPC python bridge on ready:", e);
  }

  const options = {
    webPreferences: {
      preload: join(__dirname, `./preload.js`),
    },
  };

  const window = new BrowserWindow({
    title: "SlideRelabeler",
    width: 1200,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    ...options,
  });

  registerRoute({
    id: "main",
    browserWindow: window,
    htmlFile: join(__dirname, "..", "renderer", "main", "index.html"),
  });

  window.on("closed", () => {
    clear_files_from_store();
  });

  // -------------------------
  // Protocol handlers
  // -------------------------

  protocol.handle("metadata", async (request) => {
    try {
      const url = new URL(request.url);
      const value = decodeURIComponent(url.hostname);
      const result = await bridge.invoke("metadata", value);
      return jsonToResponse(result);
    } catch (e) {
      console.log("Error fetching metadata", e);
      return new Response("metadata error", { status: 500 });
    }
  });

  protocol.handle("thumbnail", async (request) => {
    try {
      const url = new URL(request.url);
      const value = decodeURIComponent(url.hostname);
      const reply = await bridge.invoke("thumbnail", value);
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching thumbnail", e);
      return new Response("thumbnail error", { status: 500 });
    }
  });

  protocol.handle("macro", async (request) => {
    try {
      const url = new URL(request.url);
      const value = decodeURIComponent(url.hostname);
      const reply = await bridge.invoke("macro", value);
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching macro", e);
      return new Response("macro error", { status: 500 });
    }
  });

  protocol.handle("label", async (request) => {
    try {
      const url = new URL(request.url);
      const value = decodeURIComponent(url.hostname);
      const reply = await bridge.invoke("label", value);
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching label", e);
      return new Response("label error", { status: 500 });
    }
  });

  protocol.handle("preview-macro", async (request) => {
    try {
      const decoded_params = decodePreviewRequestParams(request.url);
      const reply = await bridge.invoke("preview-macro", decoded_params);
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching preview-macro", e);
      return new Response("preview-macro error", { status: 500 });
    }
  });

  protocol.handle("preview-label", async (request) => {
    try {
      const decoded_params = decodePreviewRequestParams(request.url);
      const reply = await bridge.invoke("preview-label", decoded_params);
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching preview-label", e);
      return new Response("preview-label error", { status: 500 });
    }
  });

  protocol.handle("preview-metadata", async (request) => {
    try {
      const decoded_params = decodePreviewRequestParams(request.url);
      const result = await bridge.invoke("preview-metadata", decoded_params);
      // preview-metadata is not an image; return JSON
      return jsonToResponse(result);
    } catch (e) {
      console.log("Error fetching preview-metadata", e);
      return new Response("preview-metadata error", { status: 500 });
    }
  });

  protocol.handle("image", async (request) => {
    try {
      let [file, image] = decodeURI(request.url).slice("image://".length).split("|");
      file = decodeURIComponent(file);
      image = decodeURIComponent(image);
      const reply = await bridge.invoke("image", { file, image });
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching image", e);
      return new Response("image error", { status: 500 });
    }
  });

  protocol.handle("tile", async (request) => {
    try {
      let [base] = decodeURI(request.url).slice("tile://".length).split("?");
      base = decodeURIComponent(base);

      const [file, level, x, y] = base.split("|");

      const reply = await bridge.invoke("tile", { file, level, x, y });
      return imageReplyToResponse(reply);
    } catch (e) {
      console.log("Error fetching tile", e);
      return new Response("tile error", { status: 500 });
    }
  });

  protocol.handle("test", async (request) => {
    console.log("Got test request", request.url);
    return new Response("Test test test", {
      headers: { "content-type": "text/plain" },
    });
  });
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const options = {
      webPreferences: {
        preload: join(__dirname, `./preload.js`),
      },
    };

    const window = new BrowserWindow({
      title: "SlideRelabeler",
      width: 1200,
      height: 900,
      minWidth: 960,
      minHeight: 600,
      ...options,
    });

    registerRoute({
      id: "main",
      browserWindow: window,
      htmlFile: join(__dirname, "..", "renderer", "main", "index.html"),
    });
  }
});

app.on("window-all-closed", () => {
  clear_files_from_store();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Stop the python backend when quitting
app.on("before-quit", async () => {
  try {
    await bridge.stop?.();
  } catch {}
});