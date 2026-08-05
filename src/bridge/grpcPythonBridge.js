// bridge/grpcPythonBridge.js
//
// Drop-in replacement for your existing PythonBridge that keeps the SAME API:
//   - new GrpcPythonBridge()
//   - await bridge.invoke(functionName, data)
//   - bridge._shell exists (child process) for compatibility with your cancel/restart logic
//
// It routes invoke() calls to typed gRPC RPCs defined in engine.proto
// and handles robust startup: spawn -> parse READY -> health check -> connect.
//
// Dependencies:
//   npm i @grpc/grpc-js @grpc/proto-loader grpc-health-check
//
// Notes:
// - This assumes you’ve updated engine.proto + engine_grpc.py as in the previous message.
// - Images now return { mime_type, image_bytes } (Uint8Array) NOT base64 data URLs.
//   Your renderer should turn that into a Blob URL (see helper at bottom).

import path, { join } from "path";
import fs from "fs";
// import { createRequire } from "module";
import { spawn } from "child_process";
import { app } from "electron";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { structToObject } from "../helpers/grpc_helpers.js";
import {
  logMetadataPreview,
  summarizeMetadataPayload,
} from "../helpers/metadata_preview_debug.js";
// import { HealthClient } from "grpc-health-check";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizePreviewMetadataData(rawData) {
  const decoded = structToObject(rawData ?? {});
  const prior_ifds = decoded.prior_ifds ?? decoded.priorIfds;
  const new_ifds = decoded.new_ifds ?? decoded.newIfds;
  const redactList = decoded.redactList ?? decoded.redact_list ?? [];
  const prior_xml = decoded.prior_xml ?? decoded.priorXml;
  const new_xml = decoded.new_xml ?? decoded.newXml;

  return {
    prior_ifds: Array.isArray(prior_ifds) ? prior_ifds : [],
    new_ifds: Array.isArray(new_ifds) ? new_ifds : [],
    redactList,
    prior_xml: typeof prior_xml === "string" ? prior_xml : null,
    new_xml: typeof new_xml === "string" ? new_xml : null,
    _debug: {
      dataType: rawData === null ? "null" : typeof rawData,
      hasFields: !!(rawData && typeof rawData === "object" && rawData.fields),
      topLevelKeys: Object.keys(decoded || {}),
      priorLen: Array.isArray(prior_ifds) ? prior_ifds.length : null,
      newLen: Array.isArray(new_ifds) ? new_ifds.length : null,
    },
  };
}

function toProtoValue(value) {
  if (value === null || value === undefined) return { nullValue: 0 };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { numberValue: value };
  if (typeof value === "boolean") return { boolValue: value };
  if (Array.isArray(value)) {
    return {
      listValue: {
        values: value.map((item) => toProtoValue(item)),
      },
    };
  }
  if (typeof value === "object") {
    return {
      structValue: toProtoStruct(value),
    };
  }
  return { stringValue: String(value) };
}

function toProtoStruct(obj) {
  const source = obj && typeof obj === "object" ? obj : {};
  const fields = {};
  for (const [key, value] of Object.entries(source)) {
    fields[key] = toProtoValue(value);
  }
  return { fields };
}

function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Directory containing frozen native libs next to a PyInstaller onedir engine binary. */
function resolveEngineInternalDir(launchCommand) {
  if (!launchCommand) return null;
  const dir = path.dirname(launchCommand);
  return firstExistingPath([
    join(dir, "_internal"),
    join(dir, "..", "_internal"),
  ]);
}

/** Prefer bundled dylibs over host /usr/local when spawning the frozen engine on macOS. */
function withEngineLibraryPath(env, launchCommand, launchArgs) {
  if (process.platform !== "darwin") return env;
  if (Array.isArray(launchArgs) && launchArgs.length > 0) return env;
  const internal = resolveEngineInternalDir(launchCommand);
  if (!internal) return env;

  const next = { ...env };
  for (const key of ["DYLD_LIBRARY_PATH", "DYLD_FALLBACK_LIBRARY_PATH"]) {
    const prev = next[key] || "";
    next[key] = prev ? `${internal}${path.delimiter}${prev}` : internal;
  }
  // Keep libvips from loading Homebrew Cellar plugin modules.
  if (!next.VIPSHOME) {
    next.VIPSHOME = internal;
  }
  return next;
}

function resolveProtoRoot() {
  const appAsar = join(process.resourcesPath || "", "app.asar");
  return (
    firstExistingPath([
      join(process.cwd(), "src", "proto"),
      join(appAsar, "src", "proto"),
      join(process.resourcesPath || "", "src", "proto"),
    ]) || join(process.cwd(), "src", "proto")
  );
}

function resolveEngineLaunch(opts = {}) {
  const engineBinary = process.platform === "win32" ? "engine.exe" : "engine";
  const pythonExe = opts.pythonExe || process.env.PYTHON || "python";
  const isPackaged = app?.isPackaged === true;
  const isProdRuntime = isPackaged || process.env.NODE_ENV === "production";
  const isDev = !isProdRuntime;
  const forceBinary = process.env.SLIDERELABELER_USE_ENGINE_BINARY === "1";
  const allowScriptFallback = process.env.SLIDERELABELER_ALLOW_PY_SCRIPT_FALLBACK === "1";

  if (opts.pyScript) {
    return { command: pythonExe, args: [opts.pyScript] };
  }

  const scriptPath =
    firstExistingPath([
      join(process.cwd(), "src", "python", "engine.py"),
      join(process.resourcesPath || "", "app.asar.unpacked", "src", "python", "engine.py"),
      join(process.resourcesPath || "", "app.asar", "src", "python", "engine.py"),
      join(__dirname, "..", "python", "engine.py"),
    ]) ||
    join(process.cwd(), "src", "python", "engine.py");

  // In development, prefer live Python source so local edits are picked up
  // without rebuilding the PyInstaller binary.
  if (isDev && !forceBinary) {
    return { command: pythonExe, args: [scriptPath] };
  }

  // macOS PyInstaller COLLECT names the folder "engine.app" but it is not a
  // real .app bundle — binary lives at engine.app/engine (see forge extraResource).
  const binaryPath = firstExistingPath([
    join(process.cwd(), "dist", "engine", engineBinary),
    join(process.cwd(), "dist", "engine.app", engineBinary),
    join(process.resourcesPath || "", engineBinary),
    join(process.resourcesPath || "", "engine", engineBinary),
    join(process.resourcesPath || "", "engine.app", engineBinary),
    join(process.resourcesPath || "", "engine.app", "Contents", "MacOS", engineBinary),
    join(process.resourcesPath || "", "engine", "engine.exe"), // windows explicit
    join(process.resourcesPath || "", "engine", "engine"), // non-windows explicit
    join(process.resourcesPath || "", "engine.exe", "engine"), // legacy packaging layout
  ]);

  if (binaryPath) {
    return { command: binaryPath, args: [] };
  }

  if (isProdRuntime && !allowScriptFallback) {
    throw new Error(
      `Engine binary not found in production. Looked for "${engineBinary}" under resources paths. ` +
      `Set SLIDERELABELER_ALLOW_PY_SCRIPT_FALLBACK=1 to force python script fallback.`,
    );
  }

  return { command: pythonExe, args: [scriptPath] };
}

function resolveStableLogPaths() {
  const explicitLogDir = (process.env.SLIDERELABELER_LOG_DIR || "").trim();
  let logDir = null;

  if (explicitLogDir) {
    logDir = path.resolve(explicitLogDir);
  } else {
    try {
      const userDataDir = app?.getPath?.("userData");
      if (userDataDir) {
        logDir = join(userDataDir, "logs");
      }
    } catch {
      // Fallback below if Electron app path APIs are unavailable.
    }
  }

  if (!logDir) {
    logDir = join(process.cwd(), "output");
  }

  return {
    logDir,
    engineLogPath: join(logDir, "engine.log"),
    deidtoolsLogPath: join(logDir, "deidtools.log"),
  };
}

// const require = createRequire(import.meta.url);

// function resolveGrpcHealthProto() {
//   // Preferred: resolve from node_modules/grpc-health-check
//   try {
//     const pkgJson = require.resolve("grpc-health-check/package.json");
//     const pkgDir = path.dirname(pkgJson);

//     return {
//       protoPath: path.join(pkgDir, "proto", "health", "v1", "health.proto"),
//       includeDirs: [path.join(pkgDir, "proto")], // resolves "health/v1/health.proto"
//     };
//   } catch (e) {
//     // Fallback: vendor the proto into your repo (recommended for packaged apps)
//     // Put it here: src/proto/health/v1/health.proto
//     const protoRoot = path.join(process.cwd(), "src", "proto");
//     return {
//       protoPath: path.join(protoRoot, "health", "v1", "health.proto"),
//       includeDirs: [protoRoot],
//     };
//   }
// }

async function waitForHealthServing(address, healthProtoPath, protoRoot, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;

    const pkgDef = protoLoader.loadSync(healthProtoPath, {
      includeDirs: [protoRoot],
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
  
    const loaded = grpc.loadPackageDefinition(pkgDef);
    const Health = loaded.grpc.health.v1.Health;
  
    const client = new Health(address, grpc.credentials.createInsecure());
  
    while (Date.now() < deadline) {
      try {
        const res = await new Promise((resolve, reject) => {
          client.Check({ service: "" }, (err, out) => (err ? reject(err) : resolve(out)));
        });
  
        if (res.status === "SERVING") return;
      } catch {}
  
      await sleep(100);
    }
  
    throw new Error(`gRPC health check timed out for ${address}`);
  }

export class GrpcPythonBridge {
  constructor(opts = {}) {
    // Keep compatibility with existing code that references bridge._shell
    this._shell = null;

    this._address = null;
    this._client = null;
    this._starting = null;

    this._protoRoot = opts.protoRoot || resolveProtoRoot();
    this._protoPath = opts.protoPath || join(this._protoRoot, "engine.proto");
    this._healthProtoPath = opts.healthProtoPath || join(this._protoRoot, "grpc", "health", "v1", "health.proto");
    this._pythonExe = opts.pythonExe || process.env.PYTHON || "python";
    const launch = resolveEngineLaunch({ pyScript: opts.pyScript, pythonExe: this._pythonExe });
    this._launchCommand = launch.command;
    this._launchArgs = launch.args;

    // Optional env overrides + stable default log paths.
    const stableLogs = resolveStableLogPaths();
    this._env = {
      ...(opts.env || {}),
    };
    if (!this._env.ENGINE_LOG_PATH && !process.env.ENGINE_LOG_PATH) {
      this._env.ENGINE_LOG_PATH = stableLogs.engineLogPath;
    }
    if (!this._env.DEIDTOOLS_LOG_PATH && !process.env.DEIDTOOLS_LOG_PATH) {
      this._env.DEIDTOOLS_LOG_PATH = stableLogs.deidtoolsLogPath;
    }

    // gRPC loader options
    this._loaderOpts = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      ...(opts.loaderOpts || {}),
    };

    // Used by invoke() to generate IDs if you pass none
    this._idCounter = 0;
  }

  _isProcessAlive() {
    return this._shell != null && this._shell.exitCode === null;
  }

  _resetProcessState() {
    this._shell = null;
    this._client = null;
    this._address = null;
    this._starting = null;
  }

  _attachProcessExitHandler(proc) {
    proc.on("exit", (code, signal) => {
      console.warn(`[py grpc] process exited code=${code} signal=${signal}`);
      if (this._shell === proc) {
        this._resetProcessState();
      }
    });
  }

  async start() {
    if (this._isProcessAlive()) return;
    if (this._starting) return this._starting;
    if (this._shell && !this._isProcessAlive()) {
      this._resetProcessState();
    }
    const startPromise = this._startImpl().catch((err) => {
      if (!this._client) {
        if (this._shell && this._isProcessAlive()) {
          try {
            this._shell.kill("SIGTERM");
          } catch {}
        }
        this._resetProcessState();
      }
      throw err;
    }).finally(() => {
      if (this._starting === startPromise) {
        this._starting = null;
      }
    });
    this._starting = startPromise;
    return startPromise;
  }

  async _startImpl() {
    if (this._isProcessAlive()) return;

    this._shell = spawn(this._launchCommand, this._launchArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      env: withEngineLibraryPath(
        {
          ...process.env,
          ...this._env,
          // Optional: enable tracemalloc flame region if your server supports it
          // ENGINE_MEM_FLAME: "1",
        },
        this._launchCommand,
        this._launchArgs,
      ),
      windowsHide: true,
    });

    console.log(`[py grpc] launch command=${this._launchCommand} args=${JSON.stringify(this._launchArgs)}`);
    console.log(
      `[py grpc] log paths engine=${this._env.ENGINE_LOG_PATH} deidtools=${this._env.DEIDTOOLS_LOG_PATH}`,
    );

    this._shell.stderr.on("data", (d) => {
      console.error("[py stderr]", d.toString());
    });

    const READY_TIMEOUT_MS = 10_000;

    const ready = new Promise((resolve, reject) => {
      let buf = "";

      const onExit = (code, signal) => {
        reject(new Error(`Python exited before READY. code=${code} signal=${signal}`));
      };
      this._shell.once("exit", onExit);

      this._shell.stdout.on("data", (chunk) => {
        buf += chunk.toString("utf8");
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          const rawLine = buf.slice(0, idx);
          const line = rawLine.trim();
          buf = buf.slice(idx + 1);

          if (!line) continue;

          if (line.startsWith("READY ")) {
            const port = Number(line.slice("READY ".length).trim());
            if (!Number.isFinite(port) || port <= 0) {
              reject(new Error(`Invalid READY line: "${line}"`));
              return;
            }
            this._address = `127.0.0.1:${port}`;
            this._shell.removeListener("exit", onExit);
            resolve();
            return;
          }

          // Forward regular stdout lines so python print() output is visible.
          console.log("[py stdout]", line);
        }
      });
    });

    await Promise.race([
      ready,
      (async () => {
        await sleep(READY_TIMEOUT_MS);
        throw new Error(`Timed out waiting for Python READY after ${READY_TIMEOUT_MS}ms`);
      })(),
    ]);

    await waitForHealthServing(this._address, this._healthProtoPath, this._protoRoot, 10_000);

    const pkgDef = protoLoader.loadSync(this._protoPath, this._loaderOpts);
    const loaded = grpc.loadPackageDefinition(pkgDef);

    // package engine; service EngineService { ... }
    const EngineService = loaded.engine?.EngineService;
    if (!EngineService) {
      throw new Error(`Could not find engine.EngineService in proto loaded from ${this._protoPath}`);
    }

    this._client = new EngineService(
      this._address,
      grpc.credentials.createInsecure(),
      {
        "grpc.max_receive_message_length": 128 * 1024 * 1024,
        "grpc.max_send_message_length": 128 * 1024 * 1024,
      },
    );
    console.log(`[py grpc] connected ${this._address}`);
  }

  async stop() {
    if (!this._shell) return;

    const proc = this._shell;
    this._resetProcessState();

    const exited = new Promise((resolve) => proc.once("exit", resolve));

    try {
      proc.kill("SIGTERM");
    } catch {}

    const GRACE_MS = 6000;
    const didExit = await Promise.race([exited.then(() => true), sleep(GRACE_MS).then(() => false)]);

    if (!didExit) {
      console.warn("[py grpc] forcing kill");
      try {
        proc.kill("SIGKILL");
      } catch {}
      await exited;
    }

    console.log("[py grpc] stopped");
  }

  // -------------
  // Compatibility: bridge.invoke(functionName, data)
  // -------------
  async invoke(functionName, data = null) {
    await this.start();
    if (!this._client) throw new Error("gRPC client not ready");

    // Your existing naming uses kebab-case for some functions.
    // We'll keep supporting those names and map to typed RPCs.
    const fn = functionName;

    // Route table
    switch (fn) {
      case "metadata":
        return this._unary("GetMetadata", { path: data });

      case "thumbnail":
        return this._unary("GetThumbnail", { path: data });

      case "label":
        return this._unary("GetLabel", { path: data });

      case "macro":
        return this._unary("GetMacro", { path: data });

      // old: image({file, image})
      // now: GetAssociatedImage({ path, name })
      case "image": {
        const file = data?.file;
        const name = data?.image;
        return this._unary("GetAssociatedImage", { path: file, name });
      }

      // old: tile({file, x, y, level})
      case "tile": {
        return this._unary("GetTile", {
          path: data?.file,
          x: Number(data?.x ?? 0),
          y: Number(data?.y ?? 0),
          level: Number(data?.level ?? 0),
        });
      }

      // preview endpoints accept dict-like payloads => StructRequest
      case "preview-label":
        return this._unary("PreviewLabel", { data: toProtoStruct(data ?? {}) });

      case "preview-macro":
        return this._unary("PreviewMacro", { data: toProtoStruct(data ?? {}) });

      case "preview-metadata":
        logMetadataPreview("grpc-req", summarizeMetadataPayload(data));
        return this._unary("PreviewMetadata", { data: toProtoStruct(data ?? {}) });

      // workflow (returns StructReply)
      case "deid-process":
        return this._unary("DeidProcess", { data: toProtoStruct(data ?? {}) });

      // typed progress (placeholder fields until you refine)
      case "get-progress":
        return this._unary("GetProgress", { data: toProtoStruct(data ?? {}) });

      // diagnostics
      case "get-errors":
        return this._unary("GetErrors", {});

      case "clear-errors":
        return this._unary("ClearErrors", {});

      case "get-debugs":
        return this._unary("GetDebugs", {});

      case "clear-debugs":
        return this._unary("ClearDebugs", {});

      case "get-output-path":
        return this._unary("GetOutputPath", { data: toProtoStruct(data ?? {}) });

      default:
        throw new Error(`Unknown function for GrpcPythonBridge.invoke: ${fn}`);
    }
  }

  // -------------
  // Internal RPC helpers
  // -------------
  _unary(methodName, requestObj) {
    return new Promise((resolve, reject) => {
      const client = this._client;
      if (!client) {
        reject(new Error(`gRPC client unavailable for ${methodName}`));
        return;
      }

      const method = client[methodName];
      if (typeof method !== "function") {
        reject(new Error(`gRPC method not found: ${methodName}`));
        return;
      }

      // For Empty requests, pass null/{} is fine; grpc-js accepts {}
      method.call(client, requestObj, (err, resp) => {
        if (err) {
          if (methodName === "PreviewMetadata") {
            logMetadataPreview("grpc-error", {
              code: err.code,
              details: err.details,
            });
          }
          // err.details will have python context.set_details if set
          // Best-effort: fetch buffered backend tracebacks for richer diagnostics.
          if (methodName !== "GetErrors" && typeof client.GetErrors === "function") {
            client.GetErrors({}, (diagErr, diagResp) => {
              if (!diagErr) {
                const latest = (diagResp?.values || []).slice(-1)[0];
                if (latest) {
                  console.error(`[py grpc] latest backend error for ${methodName}:`, latest);
                }
              }
              reject(err);
            });
            return;
          }
          reject(err);
          return;
        }

        // if (methodName != "GetErrors" && methodName != "GetDebugs") {
        //   console.log("methodName", methodName);
        //   console.log("resp", resp);
        // }

        // Normalize returns to match what your old code expected:
        // - MetadataReply -> {metadata, associated_images, bytes}
        // - ImageReply -> {mime_type, image_bytes}
        // - StructReply -> resp.data (plain object via proto-loader)
        // - PreviewMetadataReply -> resp.data (plain object)
        // - StringReply -> resp.value
        // - StringListReply -> resp.values
        // - ProgressReply -> resp (typed)
        //
        // Note: with proto-loader defaults=true, missing fields appear as defaults.
        // google.protobuf.Struct arrives as { fields: { key: Value } }; decode with
        // structToObject before handing metadata to the renderer.

        if (methodName === "GetMetadata") {
          resolve({
            metadata: structToObject(resp.metadata ?? {}),
            associatedImages: resp.associated_images ?? [],
            bytes: Number(resp.bytes ?? 0),
          });
          return;
        }

        if (
          methodName === "GetThumbnail" ||
          methodName === "GetLabel" ||
          methodName === "GetMacro" ||
          methodName === "GetAssociatedImage" ||
          methodName === "GetTile" ||
          methodName === "PreviewLabel" ||
          methodName === "PreviewMacro"
        ) {
          resolve({
            mime_type: resp.mime_type,
            image_bytes: resp.image_bytes, // Uint8Array
          });
          return;
        }

        if (methodName === "PreviewMetadata") {
          const normalized = normalizePreviewMetadataData(resp.data);
          logMetadataPreview("grpc-resp", normalized._debug);
          resolve({
            prior_ifds: normalized.prior_ifds,
            new_ifds: normalized.new_ifds,
            redactList: normalized.redactList,
            prior_xml: normalized.prior_xml,
            new_xml: normalized.new_xml,
          });
          return;
        }

        if (methodName === "DeidProcess") {
          resolve(resp.data ?? {});
          return;
        }

        if (methodName === "GetOutputPath") {
          resolve(resp.value ?? "");
          return;
        }

        if (methodName === "GetErrors" || methodName === "GetDebugs") {
          resolve(resp.values ?? []);
          return;
        }

        if (methodName === "ClearErrors" || methodName === "ClearDebugs") {
          resolve(true);
          return;
        }

        if (methodName === "GetProgress") {
          resolve(resp); // {progress, bytes, message, time_ms, extra}
          return;
        }

        // fallback
        resolve(resp);
      });
    });
  }
}

// Optional helper: convert ImageReply to an object URL in renderer
// (Put this in renderer side; shown here for reference)
//
// export function imageReplyToObjectUrl({ mime_type, image_bytes }) {
//   const blob = new Blob([Buffer.from(image_bytes)], { type: mime_type });
//   return URL.createObjectURL(blob);
// }