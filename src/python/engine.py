# engine_grpc.py
from __future__ import annotations

import os
import platform
import logging
from logging.handlers import RotatingFileHandler
import signal
import sys
import threading
import time
import traceback
from collections import deque
from concurrent import futures
from typing import Any, Dict, Tuple

import grpc
from grpc_health.v1 import health, health_pb2, health_pb2_grpc
from google.protobuf import empty_pb2
from google.protobuf.struct_pb2 import Struct

import src.proto.engine_pb2 as engine_pb2
import src.proto.engine_pb2_grpc as engine_pb2_grpc

# -----------------------------
# Debug/error buffers (same as before)
# -----------------------------

debug = False
def _resolve_engine_log_path() -> str:
  # Allow explicit override from parent process.
  env_path = os.environ.get("ENGINE_LOG_PATH", "").strip()
  if env_path:
    return os.path.abspath(env_path)
  # Default path for local runs.
  return os.path.abspath(os.path.join(".", "output", "engine.log"))


def _resolve_deidtools_log_path() -> str:
  env_path = os.environ.get("DEIDTOOLS_LOG_PATH", "").strip()
  if env_path:
    return os.path.abspath(env_path)
  return os.path.abspath(os.path.join(".", "output", "deidtools.log"))


def _setup_engine_logger() -> logging.Logger:
  lg = logging.getLogger(__name__)
  lg.setLevel(logging.DEBUG if debug else logging.INFO)
  lg.propagate = False

  if debug and not lg.handlers:
    log_path = _resolve_engine_log_path()
    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    file_handler = RotatingFileHandler(
      log_path,
      maxBytes=5 * 1024 * 1024,
      backupCount=3,
      encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG if debug else logging.INFO)
    file_handler.setFormatter(
      logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
    )
    lg.addHandler(file_handler)

    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.DEBUG if debug else logging.INFO)
    stderr_handler.setFormatter(logging.Formatter("[engine] %(levelname)s %(message)s"))
    lg.addHandler(stderr_handler)

  return lg


logger = _setup_engine_logger()

debug_msgs: deque[str] = deque()
error_msgs: deque[str] = deque()
max_debug_msgs = 100
max_error_msgs = 100
_buf_lock = threading.Lock()


def _push_debug(obj: Any) -> None:
  import json
  try:
    s = json.dumps(obj, indent=4, ensure_ascii=False)
  except Exception:
    s = repr(obj)
  with _buf_lock:
    if len(debug_msgs) >= max_debug_msgs:
      debug_msgs.popleft()
    debug_msgs.append(s)


def _push_error(err: Any) -> None:
  with _buf_lock:
    if len(error_msgs) >= max_error_msgs:
      error_msgs.popleft()
    error_msgs.append(repr(err))


def _set_internal_error(context: grpc.ServicerContext, operation: str, exc_text: str) -> None:
  _push_error(exc_text)
  # Mirror traceback to stderr so Electron logs expose the real cause.
  try:
    if debug:
      logger.error("[engine:%s] %s", operation, exc_text)
      print(f"[engine:{operation}] {exc_text}", file=sys.stderr, flush=True)
  except Exception:
    pass
  context.set_code(grpc.StatusCode.INTERNAL)
  last_line = exc_text.strip().splitlines()[-1] if exc_text else "unknown error"
  context.set_details(f"internal_error:{operation}: {last_line[:300]}")


def debugMsg(msg: Dict[str, Any]) -> None:
  # keep your filter (don’t store polling spam)
  try:
    fn = msg.get("data", {}).get("function") if isinstance(msg.get("data"), dict) else None
    if fn not in ("get-progress", "get-errors", "get-debugs"):
      _push_debug(msg)
  except Exception:
    pass


# -----------------------------
# Bootstrap env (ported)
# -----------------------------

def bootstrap_env() -> Dict[str, Any]:
  import multiprocessing
  multiprocessing.freeze_support()

  json_setup: Dict[str, Any] = {}

  if "NODE_ENV" in os.environ:
    json_setup["NODE_ENV"] = os.environ["NODE_ENV"]

  if "PATH" in os.environ:
    json_setup["PATH"] = os.environ["PATH"]

  if os.name == "nt":
    json_setup["PLATFORM"] = "windows"
    if os.environ.get("NODE_ENV") == "development":
      large_image_tools_dir = os.path.abspath(os.path.join(".", "src", "python", "DeidTools"))
      bin_dir = os.path.join(large_image_tools_dir, "win-bin")
      os.environ["PATH"] = os.pathsep.join((bin_dir, os.environ.get("PATH", "")))
      try:
        os.add_dll_directory(bin_dir)  # type: ignore[attr-defined]
      except Exception as e:
        json_setup["ADD_DLL_DIRECTORY_EXCEPTION"] = repr(e)

    elif os.environ.get("NODE_ENV") == "production":
      collected_internal_path = os.path.join(".", "resources", "engine", "_internal")
      collected_internal_path_2 = os.path.join(".", "_internal")
      gdal_share_path = os.path.join(collected_internal_path, "gdal")
      gdal_share_path_2 = os.path.join(collected_internal_path_2, "gdal")

      if os.path.exists(gdal_share_path):
        json_setup["GDAL_DATA"] = gdal_share_path
        os.environ["GDAL_DATA"] = gdal_share_path
      elif os.path.exists(gdal_share_path_2):
        json_setup["GDAL_DATA"] = os.path.abspath(gdal_share_path_2)
        os.environ["GDAL_DATA"] = os.path.abspath(gdal_share_path_2)
      else:
        json_setup["GDAL_DATA"] = None
        raise RuntimeError("GDAL_DATA not found in packaged _internal paths")

  elif platform.system() == "Darwin":
    json_setup["PLATFORM"] = "macos"
    if os.environ.get("NODE_ENV") == "production":
      _push_debug({"NODE_ENV": "production", "PLATFORM": "Darwin", "cwd": os.getcwd()})

  # optional openslide source import
  try:
    import large_image_source_openslide  # noqa: F401
  except Exception as e:
    json_setup["LARGE_IMAGE_SOURCE_OPENSLIDE_EXCEPTION"] = repr(e)

  import pyproj
  os.environ["PROJ_DATA"] = pyproj.datadir.get_data_dir()
  json_setup["PROJ_DATA"] = os.environ["PROJ_DATA"]

  if debug:
    debugMsg({"data": {"function": "bootstrap_env"}, "setup": json_setup})
    logger.info("Engine bootstrap complete. log_path=%s", _resolve_engine_log_path())
  return json_setup


def _maybe_install_patchlibtiff_guard() -> None:
  """Install tiff_reader guard on darwin/arm64 (auto) or when SLIDERELABELER_PATCH_LIBTIFF=1."""
  from patch_libtiff_platform import patch_libtiff_mode, should_patch_libtiff

  if not should_patch_libtiff():
    return
  from libtiff_guard import install_patchlibtiff_guard

  install_patchlibtiff_guard()
  mode = patch_libtiff_mode()
  mode_label = "auto-enabled (darwin/arm64)" if mode == "auto" else "forced (SLIDERELABELER_PATCH_LIBTIFF=1)"
  print(
    f"[engine] libtiff guard {mode_label}: tiff_reader patches registered "
    "(patchLibtiff + _getJpegTables + _getJpegFrameSize)",
    file=sys.stderr,
    flush=True,
  )


# -----------------------------
# Heavy imports after bootstrap
# -----------------------------
bootstrap_env()
_maybe_install_patchlibtiff_guard()

import base64  # noqa: E402 (still used internally if needed)
import large_image  # noqa: E402
from DeidTools import DeidTools  # noqa: E402

from patch_libtiff_platform import should_patch_libtiff

if should_patch_libtiff():
  from libtiff_guard import is_guard_active
  print(
    f"[engine] libtiff guard active: guard_executed={is_guard_active()}",
    file=sys.stderr,
    flush=True,
  )

large_image.config.setConfig('cache_sources', False)

deid_tools = DeidTools(
  supress_print=True,
  debug=debug,
  log_path=_resolve_deidtools_log_path(),
)
if debug:
  logger.info("DeidTools configured. log_path=%s", _resolve_deidtools_log_path())

openFiles: Dict[str, Any] = {}
try:
  large_image.canRead()
except Exception:
  pass


# -----------------------------
# Helpers: Struct conversion
# -----------------------------

_PROTO_VALUE_KEYS = {
  "nullValue",
  "numberValue",
  "stringValue",
  "boolValue",
  "structValue",
  "listValue",
}


def _to_struct_key(key: Any) -> str:
  # google.protobuf.Struct requires string keys.
  return key if isinstance(key, str) else str(key)


def _normalize_proto_wrapped_value(value: Any) -> Any:
  """
  Convert proto Value-like wrapper dicts into plain Python values.

  Examples:
    {"numberValue": 5, "kind": "numberValue"} -> 5
    {"stringValue": "x"} -> "x"
    {"listValue": {"values": [{"numberValue": 1}]}} -> [1]
  """
  if isinstance(value, list):
    return [_normalize_proto_wrapped_value(v) for v in value]

  if not isinstance(value, dict):
    return value

  # Explicit oneof marker from some JS payloads.
  kind = value.get("kind")
  if isinstance(kind, str) and kind in _PROTO_VALUE_KEYS and kind in value:
    if kind == "nullValue":
      return None
    if kind == "listValue":
      lv = value.get("listValue")
      if isinstance(lv, dict) and "values" in lv:
        return [_normalize_proto_wrapped_value(v) for v in (lv.get("values") or [])]
      if isinstance(lv, list):
        return [_normalize_proto_wrapped_value(v) for v in lv]
      return []
    if kind == "structValue":
      sv = value.get("structValue")
      if isinstance(sv, dict) and "fields" in sv and isinstance(sv["fields"], dict):
        return {_to_struct_key(k): _normalize_proto_wrapped_value(v) for k, v in sv["fields"].items()}
      if isinstance(sv, dict):
        return {_to_struct_key(k): _normalize_proto_wrapped_value(v) for k, v in sv.items()}
      return {}
    return _normalize_proto_wrapped_value(value.get(kind))

  # Wrapper without explicit kind.
  present_proto_keys = [k for k in _PROTO_VALUE_KEYS if k in value]
  if len(present_proto_keys) == 1 and all(k in _PROTO_VALUE_KEYS or k == "kind" for k in value.keys()):
    return _normalize_proto_wrapped_value(
      {
        "kind": present_proto_keys[0],
        present_proto_keys[0]: value[present_proto_keys[0]],
      }
    )

  # Generic dict: normalize recursively by field.
  return {_to_struct_key(k): _normalize_proto_wrapped_value(v) for k, v in value.items()}


def dict_to_struct(d: Dict[str, Any]) -> Struct:
  s = Struct()
  # Normalize any proto Value wrapper shapes into JSON-like Python values first.
  normalized = _normalize_proto_wrapped_value(d)
  if not isinstance(normalized, dict):
    normalized = {"value": normalized}
  s.update(normalized)
  return s


def struct_to_dict(s: Struct) -> Dict[str, Any]:
  # Struct behaves like a mapping in python but easiest is MessageToDict;
  # however to avoid extra deps, we can just use json_format.
  from google.protobuf.json_format import MessageToDict
  return MessageToDict(s, preserving_proto_field_name=False)


def any_to_struct(obj: Any) -> Struct:
  """
  Convert dict-like outputs into Struct. If obj isn't a dict, wrap it.
  """
  if obj is None:
    return dict_to_struct({})
  if isinstance(obj, Struct):
    return obj
  if isinstance(obj, dict):
    return dict_to_struct(obj)
  # If it's a tuple/list, wrap
  if isinstance(obj, (list, tuple)):
    return dict_to_struct({"value": list(obj)})
  return dict_to_struct({"value": obj})


# -----------------------------
# Original functionality (same semantics)
# -----------------------------

def _assert_slide_path_readable(file: str) -> None:
  if not file or not str(file).strip():
    raise FileNotFoundError("Slide path is empty")
  if not os.path.exists(file):
    raise FileNotFoundError(f"File not found: {file}")
  if not os.path.isfile(file):
    raise IsADirectoryError(f"Not a file: {file}")
  if not os.access(file, os.R_OK):
    raise PermissionError(f"Cannot read file: {file}")


def openFile(file: str, second: bool = False):
  source = openFiles.get(file)
  if not source:
    _assert_slide_path_readable(file)
    try:
      source = large_image.open(file)
      openFiles[file] = source
    except Exception:
      if not second:
        return openFile(file, True)
      raise Exception("Could not open tile source for " + file)
  return source


def getMetadata(file: str) -> Dict[str, Any]:
  _assert_slide_path_readable(file)
  source = openFile(file)
  return {
    "metadata": source.getMetadata(),
    "associatedImages": source.getAssociatedImagesList(),
    "bytes": os.path.getsize(file),
  }


def getAssociatedImageBytes(file: str, name: str) -> Tuple[bytes, str]:
  f = openFile(file)
  if not f:
    raise Exception(f"Error: {file} is not open")
  image, mime_type = f.getAssociatedImage(name)
  return image, mime_type


def getThumbnailBytes(file: str) -> Tuple[bytes, str]:
  f = openFile(file)
  if not f:
    raise Exception(f"Error: {file} is not open")
  image, mime_type = f.getThumbnail(width=256, height=256)
  return image, mime_type


def getTileBytes(file: str, x: int, y: int, level: int) -> Tuple[bytes, str]:
  f = openFile(file)
  if not f:
    debugMsg({"data": {"function": "tile"}, "error": f"{file} is not open", "open": list(openFiles.keys())})
    raise Exception(f"Error: {file} is not open")
  mime_type = f.getTileMimeType()
  image = f.getTile(int(x), int(y), int(level))
  return image, mime_type


def preview_label(output_dict: Dict[str, Any]) -> Tuple[bytes, str]:
  label = deid_tools.preview_label(output_dict)
  mime_type, base64_str = deid_tools.pil_to_base64(label)
  # DeidTools gives base64. Convert back to bytes so we still return bytes over gRPC.
  return base64.b64decode(base64_str), mime_type


def preview_macro(output_dict: Dict[str, Any]) -> Tuple[bytes, str]:
  macro = deid_tools.preview_macro(output_dict)
  mime_type, base64_str = deid_tools.pil_to_base64(macro)
  return base64.b64decode(base64_str), mime_type


def preview_metadata(output_dict: Dict[str, Any]) -> Dict[str, Any]:
  prior_ifds, new_ifds, redactList = deid_tools.preview_metadata(output_dict)
  # Return as dict so we can pack into Struct with 3 keys
  return {
    "prior_ifds": prior_ifds,
    "new_ifds": new_ifds,
    "redactList": redactList,
  }


def deid_process(output_dict: Dict[str, Any]) -> Any:
  return deid_tools.apply_workflow_to_filename_with_output_dir(output_dict)


def get_output_path(output_dict: Dict[str, Any]) -> Any:
  return deid_tools.get_output_path(output_dict)


def get_progress(output_dict: Dict[str, Any]) -> Any:
  return deid_tools.get_progress(output_dict)


# -----------------------------
# RPC Servicer (typed endpoints)
# -----------------------------

class EngineService(engine_pb2_grpc.EngineServiceServicer):
  # --- WSI ---
  def GetMetadata(self, request: engine_pb2.FileRequest, context: grpc.ServicerContext) -> engine_pb2.MetadataReply:
    try:
      out = getMetadata(request.path)
      meta = out.get("metadata", {})
      assoc = out.get("associatedImages", [])
      size = int(out.get("bytes", 0))

      return engine_pb2.MetadataReply(
        metadata=any_to_struct(meta),
        associated_images=[str(x) for x in assoc] if assoc else [],
        bytes=size,
      )
    except Exception:
      exc = traceback.format_exc()
      _set_internal_error(context, "GetMetadata", exc)
      return engine_pb2.MetadataReply()

  def GetThumbnail(self, request: engine_pb2.FileRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      image, mime = getThumbnailBytes(request.path)
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.ImageReply()

  def GetLabel(self, request: engine_pb2.FileRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      image, mime = getAssociatedImageBytes(request.path, "label")
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.ImageReply()

  def GetMacro(self, request: engine_pb2.FileRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      image, mime = getAssociatedImageBytes(request.path, "macro")
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.ImageReply()

  def GetAssociatedImage(self, request: engine_pb2.AssociatedImageRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      image, mime = getAssociatedImageBytes(request.path, request.name)
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.ImageReply()

  def GetTile(self, request: engine_pb2.TileRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      image, mime = getTileBytes(request.path, request.x, request.y, request.level)
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.ImageReply()

  # --- DeidTools previews ---
  def PreviewLabel(self, request: engine_pb2.StructRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      d = struct_to_dict(request.data)
      image, mime = preview_label(d)
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _set_internal_error(context, "PreviewLabel", exc)
      return engine_pb2.ImageReply()

  def PreviewMacro(self, request: engine_pb2.StructRequest, context: grpc.ServicerContext) -> engine_pb2.ImageReply:
    try:
      d = struct_to_dict(request.data)
      image, mime = preview_macro(d)
      return engine_pb2.ImageReply(mime_type=mime, image_bytes=image)
    except Exception:
      exc = traceback.format_exc()
      _set_internal_error(context, "PreviewMacro", exc)
      return engine_pb2.ImageReply()

  def PreviewMetadata(self, request: engine_pb2.StructRequest, context: grpc.ServicerContext) -> engine_pb2.PreviewMetadataReply:
    try:      
      d = struct_to_dict(request.data)
      out = preview_metadata(d)
      prior_ifds = out.get("prior_ifds") if isinstance(out, dict) else None
      new_ifds = out.get("new_ifds") if isinstance(out, dict) else None
      prior_len = len(prior_ifds) if isinstance(prior_ifds, list) else 0
      new_len = len(new_ifds) if isinstance(new_ifds, list) else 0
      print(f"[metadata-preview] PreviewMetadata OK prior={prior_len} new={new_len}", flush=True)
      return engine_pb2.PreviewMetadataReply(data=any_to_struct(out))
    except Exception:
      exc = traceback.format_exc()
      _set_internal_error(context, "PreviewMetadata", exc)
      return engine_pb2.PreviewMetadataReply()

  # --- DeidTools workflow ---
  def DeidProcess(self, request: engine_pb2.StructRequest, context: grpc.ServicerContext) -> engine_pb2.StructReply:
    try:
      d = struct_to_dict(request.data)
      out = deid_process(d)
      return engine_pb2.StructReply(data=any_to_struct(out))
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.StructReply()

  # --- Utilities / diagnostics ---
  def GetOutputPath(self, request: engine_pb2.StructRequest, context: grpc.ServicerContext) -> engine_pb2.StringReply:
    try:
      d = struct_to_dict(request.data)
      out = get_output_path(d)
      return engine_pb2.StringReply(value=str(out))
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.StringReply()

  def GetProgress(self, request: engine_pb2.StructRequest, context: grpc.ServicerContext) -> engine_pb2.ProgressReply:
    """
    Typed placeholder:
      progress (float), bytes (int64), message (string), time_ms (int64), extra (Struct)

    We do best-effort mapping from whatever deid_tools.get_progress returns today.
    """
    try:
      d = struct_to_dict(request.data)
      out = get_progress(d)

      extra = any_to_struct(out if isinstance(out, dict) else {"value": out})
      # best-effort mapping
      progress = 0.0
      nbytes = 0
      message = ""
      time_ms = int(time.time() * 1000)

      if isinstance(out, dict):
        if "progress" in out:
          try: progress = float(out["progress"])
          except Exception: pass
        if "bytes" in out:
          try: nbytes = int(out["bytes"])
          except Exception: pass
        if "message" in out:
          message = str(out["message"])
        if "time" in out:
          # you used new Date().getTime() in JS; accept ms epoch
          try: time_ms = int(out["time"])
          except Exception: pass

      return engine_pb2.ProgressReply(
        progress=progress,
        bytes=nbytes,
        message=message,
        time_ms=time_ms,
        extra=extra,
      )
    except Exception:
      exc = traceback.format_exc()
      _push_error(exc)
      context.set_code(grpc.StatusCode.INTERNAL)
      context.set_details("internal_error")
      return engine_pb2.ProgressReply()

  def GetErrors(self, request: empty_pb2.Empty, context: grpc.ServicerContext) -> engine_pb2.StringListReply:
    with _buf_lock:
      return engine_pb2.StringListReply(values=list(error_msgs))

  def ClearErrors(self, request: empty_pb2.Empty, context: grpc.ServicerContext) -> empty_pb2.Empty:
    with _buf_lock:
      error_msgs.clear()
    return empty_pb2.Empty()

  def GetDebugs(self, request: empty_pb2.Empty, context: grpc.ServicerContext) -> engine_pb2.StringListReply:
    with _buf_lock:
      return engine_pb2.StringListReply(values=list(debug_msgs))

  def ClearDebugs(self, request: empty_pb2.Empty, context: grpc.ServicerContext) -> empty_pb2.Empty:
    with _buf_lock:
      debug_msgs.clear()
    return empty_pb2.Empty()


# -----------------------------
# Server lifecycle: READY <port> + health + graceful shutdown
# -----------------------------

def _install_signal_handlers(stop_event: threading.Event) -> None:
  def _handler(_signum, _frame):
    stop_event.set()
  signal.signal(signal.SIGINT, _handler)
  signal.signal(signal.SIGTERM, _handler)


def serve() -> None:
  server = grpc.server(
    futures.ThreadPoolExecutor(max_workers=8),
    options=[
      ("grpc.keepalive_time_ms", 30_000),
      ("grpc.keepalive_timeout_ms", 10_000),
      ("grpc.http2.max_pings_without_data", 0),
      ("grpc.keepalive_permit_without_calls", 1),

      # adjust if needed; images can be large
      ("grpc.max_receive_message_length", 128 * 1024 * 1024),
      ("grpc.max_send_message_length", 128 * 1024 * 1024),
    ],
  )

  engine_pb2_grpc.add_EngineServiceServicer_to_server(EngineService(), server)

  health_servicer = health.HealthServicer()
  health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

  port = server.add_insecure_port("127.0.0.1:0")
  if port == 0:
    if debug:
      logger.error("FATAL: could not bind port")
      print("FATAL: could not bind port", file=sys.stderr, flush=True)
    sys.exit(2)

  health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)
  server.start()
  logger.info("gRPC server started on 127.0.0.1:%s", port)

  # For Electron parent process:
  print(f"READY {port}", flush=True)

  stop_event = threading.Event()
  _install_signal_handlers(stop_event)

  # optional mem flame region
  mem_flame = os.environ.get("ENGINE_MEM_FLAME", "0") == "1"
  if debug and mem_flame:
    try:
      from mem_flame_tracemalloc import tracemalloc_region  # type: ignore
      out_path = os.path.join(".", "out", f"mem_{time.time()}.folded")
      with tracemalloc_region(nframes=35, folded_out=out_path, prefix="python"):
        while not stop_event.is_set():
          time.sleep(0.1)
    except Exception as e:
      _push_error(e)
      while not stop_event.is_set():
        time.sleep(0.1)
  else:
    while not stop_event.is_set():
      time.sleep(0.1)

  health_servicer.set("", health_pb2.HealthCheckResponse.NOT_SERVING)
  server.stop(grace=5)


if __name__ == "__main__":
  serve()