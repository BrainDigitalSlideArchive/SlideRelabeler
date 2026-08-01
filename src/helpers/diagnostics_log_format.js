/** Renderer/saga helpers for the diagnostics log (no Electron main imports). */

/**
 * @param {unknown} payload
 * @returns {string}
 */
export function formatFrontendErrorForDiagnostics(payload) {
  if (payload == null) return 'frontend error';
  if (typeof payload === 'string') return `frontend: ${payload}`;
  if (typeof payload === 'object') {
    const msg = payload.message ?? payload.error ?? payload.err;
    if (typeof msg === 'string' && msg.trim()) {
      return `frontend: ${msg.trim()}`;
    }
    try {
      return `frontend: ${JSON.stringify(payload)}`;
    } catch {
      return `frontend: ${String(payload)}`;
    }
  }
  return `frontend: ${String(payload)}`;
}

/**
 * @param {unknown} messages
 * @param {'engine-debug'|'engine-error'} kind
 * @returns {string[]}
 */
export function formatEngineMessagesForDiagnostics(messages, kind) {
  const list = Array.isArray(messages) ? messages : [];
  const prefix = kind === 'engine-error' ? 'engine-error' : 'engine-debug';
  return list.map((item) => {
    if (typeof item === 'string') return `${prefix}: ${item}`;
    try {
      return `${prefix}: ${JSON.stringify(item)}`;
    } catch {
      return `${prefix}: ${String(item)}`;
    }
  });
}
