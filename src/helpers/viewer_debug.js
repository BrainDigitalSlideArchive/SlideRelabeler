const RING_MAX = 50;

export function isViewerDebugEnabled() {
  try {
    if (import.meta.env?.DEV) return true;
    if (import.meta.env?.VITE_VIEWER_DEBUG === '1') return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('slideRelabelerViewerDebug') === '1') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function logViewerDebug(event, payload = {}) {
  if (!isViewerDebugEnabled()) return;

  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };

  console.info('[viewer]', event, payload);

  if (typeof window !== 'undefined') {
    if (!window.__viewerDebug) {
      window.__viewerDebug = { lines: [], lastStatus: null };
    }
    window.__viewerDebug.lines.push(entry);
    if (window.__viewerDebug.lines.length > RING_MAX) {
      window.__viewerDebug.lines.shift();
    }
    if (event === 'sidePanelBlocked' || event === 'sidePanelUrls') {
      window.__viewerDebug.lastStatus = entry;
    }
  }
}

export function getViewerDebugLastStatus() {
  if (typeof window !== 'undefined' && window.__viewerDebug?.lastStatus) {
    return window.__viewerDebug.lastStatus;
  }
  return null;
}
