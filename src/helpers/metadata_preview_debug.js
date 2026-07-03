const RING_MAX = 50;

export function isMetadataPreviewDebugEnabled() {
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      return true;
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return true;
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_METADATA_PREVIEW_DEBUG === '1') {
      return true;
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('slideRelabelerMetadataPreviewDebug') === '1') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function summarizeMetadataPayload(info) {
  if (!info || typeof info !== 'object') {
    return { empty: true };
  }
  const reserved = info.__reserved && typeof info.__reserved === 'object' ? info.__reserved : {};
  return {
    topKeys: Object.keys(info).slice(0, 24),
    reservedKeys: Object.keys(reserved),
    sourcePath: reserved.source?.path,
    destinationDirectory: reserved.destinationDirectory,
    processed: reserved.processed,
    textColumn: info.config?.label?.text_column_field?.value,
  };
}

export function logMetadataPreview(event, payload = {}) {
  if (!isMetadataPreviewDebugEnabled()) return;

  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };

  console.info('[metadata-preview]', event, payload);

  if (typeof window !== 'undefined') {
    if (!window.__metadataPreviewDebug) {
      window.__metadataPreviewDebug = { lines: [] };
    }
    window.__metadataPreviewDebug.lines.push(entry);
    if (window.__metadataPreviewDebug.lines.length > RING_MAX) {
      window.__metadataPreviewDebug.lines.shift();
    }
  }
}
