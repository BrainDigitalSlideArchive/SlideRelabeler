// helpers/thumbnail_helpers.js — embedded thumbnail visibility + protocol URLs.

export function canShowEmbeddedThumbnail(reserved) {
  return Boolean(reserved?.source?.path)
    && (reserved?.associatedImages ?? []).includes('thumbnail');
}

export function buildThumbnailProtocolUrl(sourcePath) {
  return `thumbnail://${encodeURIComponent(sourcePath)}`;
}

/** AG Grid valueGetter token so Original file cells refresh when metadata arrives. */
export function sourceFilenameCellValue(reserved) {
  const name = reserved?.source?.filename ?? '';
  const thumbKey = (reserved?.associatedImages ?? []).includes('thumbnail') ? '1' : '0';
  const errorKey = reserved?.error != null && String(reserved.error).trim() ? '1' : '0';
  return `${name}\x00${reserved?.bytes ?? 0}\x00${thumbKey}\x00${errorKey}`;
}
