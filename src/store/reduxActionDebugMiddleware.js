/**
 * Persistent Redux action logging (upload / Globus focus).
 *
 * Enable either:
 * - Build-time: VITE_REDUX_ACTION_LOG=1 (e.g. in .env.local)
 * - Runtime: localStorage.setItem('slideRelabelerReduxActionLog', '1') then reload
 * Disable: removeItem or set to anything other than '1'.
 *
 * Output:
 * - Append-only file: app.getPath('userData')/logs/redux-debug.log
 *   Windows: %APPDATA%\\SlideRelabeler\\logs\\redux-debug.log
 * - In-memory ring: window.__reduxActionDebug.lines (last 400 JSON lines)
 */

import * as files_actions from '../actions/files';

const RING_MAX = 400;

const FILES_UPLOAD_RELATED = new Set([
  files_actions.UPDATE_FILE_UPLOAD_PROGRESS,
  files_actions.GLOBUS_UPLOAD_FILE_METRICS,
  files_actions.UPLOAD_FILE_ERROR,
  files_actions.UPLOAD_FILE_COMPLETE,
  files_actions.UPLOAD_FILE_FINALIZE,
  files_actions.UPLOAD_DELETE_AFTER,
  files_actions.UPLOAD_FILE_STARTED,
  files_actions.SET_UPLOADING,
]);

export function isReduxActionLogEnabled() {
  try {
    if (import.meta.env?.VITE_REDUX_ACTION_LOG === '1') return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('slideRelabelerReduxActionLog') === '1') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function shouldLogReduxActionType(type) {
  if (typeof type !== 'string') return false;
  if (type.startsWith('globus/')) return true;
  return FILES_UPLOAD_RELATED.has(type);
}

function summarizePayload(payload) {
  if (payload == null) return payload;
  if (Array.isArray(payload)) return `[array len=${payload.length}]`;
  if (typeof payload !== 'object') return payload;

  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'file' && v && typeof v === 'object') {
      out[k] = '<file>';
      continue;
    }
    if (typeof v === 'string' && v.length > 120) {
      out[k] = `${v.slice(0, 117)}...`;
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = '<object>';
      continue;
    }
    out[k] = v;
  }
  return out;
}

function pushRingBuffer(line) {
  if (typeof window === 'undefined') return;
  if (!window.__reduxActionDebug) {
    window.__reduxActionDebug = { max: RING_MAX, lines: [] };
  }
  const b = window.__reduxActionDebug;
  b.lines.push(line);
  if (b.lines.length > b.max) {
    b.lines.splice(0, b.lines.length - b.max);
  }
}

export function createReduxActionDebugMiddleware() {
  return () => (next) => (action) => {
    const result = next(action);
    if (!isReduxActionLogEnabled() || !shouldLogReduxActionType(action?.type)) {
      return result;
    }
    const line = JSON.stringify({
      t: new Date().toISOString(),
      type: action.type,
      payload: summarizePayload(action.payload),
    });
    pushRingBuffer(line);
    const api = typeof window !== 'undefined' ? window.electronAPI : null;
    if (api?.appendDebugLogLine) {
      api.appendDebugLogLine(line).catch(() => {
        /* avoid breaking app if main fails */
      });
    }
    return result;
  };
}
