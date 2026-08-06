// helpers/label_icon_batch.js — Process preflight + in-memory icon for a batch.

/** Process dialog when icon path is set but unreadable (ENOENT / TCC / permissions). */
export const LABEL_ICON_UNREADABLE_MESSAGE =
  'The image chosen for the label is not readable. Open Configuration → Slide label, choose the image again, then retry Process. Your file list is unchanged.';

/** Short UI warning (config row, viewer, Process aria). Names the label icon. */
export const LABEL_ICON_UNREADABLE_SUMMARY =
  'Label icon isn’t readable';

export const LABEL_ICON_UNREADABLE_DETAIL =
  'Missing file or permission — choose the image again under Slide label.';

/** Cap base64 length so preview-label:// query strings stay within URL limits. */
export const MAX_PREVIEW_ICON_BYTES_BASE64 = 400_000;

/**
 * Absolute path stored for the label icon, or '' if none.
 */
export function getLabelIconPath(config) {
  return String(config?.label?.icon_file?.source?.path ?? '').trim();
}

/**
 * True when Process needs a readable icon file (icon enabled and a path is set).
 * Icon enabled with no path stays a soft skip (existing Python behavior).
 */
export function needsLabelIconFile(config) {
  return !!config?.label?.add_icon && !!getLabelIconPath(config);
}

/**
 * Attach batch-buffered icon bytes to a config clone for Process / preview payloads.
 * Does not mutate the Redux config object.
 */
export function attachLabelIconBytes(config, bytesBase64) {
  if (!config || !bytesBase64) return config;
  const iconFile = config.label?.icon_file;
  if (!iconFile) return config;

  return {
    ...config,
    label: {
      ...config.label,
      icon_file: {
        ...iconFile,
        source: {
          ...(iconFile.source || {}),
          bytes_base64: bytesBase64,
        },
      },
    },
  };
}

/**
 * Config for preview-label URLs: attach icon bytes when small enough.
 * Oversized icons keep path-only loading (Python may still soft-skip).
 */
export function configForLabelPreview(config, bytesBase64) {
  if (!bytesBase64 || String(bytesBase64).length > MAX_PREVIEW_ICON_BYTES_BASE64) {
    return config;
  }
  return attachLabelIconBytes(config, bytesBase64);
}

/**
 * Interpret the result of reading the label icon for a batch.
 * @param {object|null} readResult — from electronAPI.readLabelIconBytes
 * @param {object} config
 * @returns {{ ok: true, bytesBase64: string|null } | { ok: false, message: string }}
 */
export function resolveLabelIconForBatch(config, readResult) {
  if (!needsLabelIconFile(config)) {
    return { ok: true, bytesBase64: null };
  }
  if (readResult?.ok && readResult.base64) {
    return { ok: true, bytesBase64: String(readResult.base64) };
  }
  return { ok: false, message: LABEL_ICON_UNREADABLE_MESSAGE };
}
