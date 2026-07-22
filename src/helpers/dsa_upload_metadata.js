// helpers/dsa_upload_metadata.js — map file-table data onto Girder item metadata.

import { return_filename_basename_from_filename } from './renderer_path_helpers.js';

/**
 * @param {object} [itemMetadata]
 * @returns {boolean}
 */
export function isDsaItemMetadataEnabled(itemMetadata) {
  const mode = itemMetadata?.mode ?? 'none';
  if (mode === 'none' || !mode) return false;
  if (mode === 'column') return Boolean(String(itemMetadata?.column ?? '').trim());
  return mode === 'all_deid' || mode === 'all_original';
}

function originalSourceFileName(fileRow) {
  const source = fileRow?.__reserved?.source ?? {};
  if (source.filename) return String(source.filename);
  if (source.path) return return_filename_basename_from_filename(source.path);
  return '';
}

function pathColumnKeys(csvConfig = {}) {
  const keys = new Set();
  const pathCol = String(csvConfig.file_path_column ?? '').trim();
  if (pathCol) keys.add(pathCol);
  return keys;
}

/**
 * Top-level scalar data columns, excluding __* and configured path column.
 * @param {object} fileRow
 * @param {object} [csvConfig]
 * @returns {Record<string, string>}
 */
export function topLevelDataColumns(fileRow, csvConfig = {}) {
  const out = {};
  if (!fileRow || typeof fileRow !== 'object') return out;
  const exclude = pathColumnKeys(csvConfig);
  for (const key of Object.keys(fileRow)) {
    if (key.startsWith('__')) continue;
    if (exclude.has(key)) continue;
    const val = fileRow[key];
    if (val !== null && val !== undefined && typeof val !== 'object') {
      out[key] = String(val);
    }
  }
  return out;
}

/**
 * @param {unknown} raw
 * @param {string} column
 * @returns {Record<string, unknown>|null}
 */
function metadataFromColumnValue(raw, column) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw);
  if (!str.trim()) return null;
  try {
    const parsed = JSON.parse(str);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { ...parsed };
    }
    if (Array.isArray(parsed)) {
      return { [column]: parsed };
    }
    return { [column]: parsed };
  } catch {
    return { [column]: str };
  }
}

/**
 * Build Girder item metadata from a file row per itemMetadata config.
 * @param {object} fileRow
 * @param {{ mode?: string, column?: string }} [itemMetadata]
 * @param {object} [csvConfig]
 * @returns {Record<string, unknown>|null} null when nothing should be attached
 */
export function buildDsaItemMetadata(fileRow, itemMetadata = {}, csvConfig = {}) {
  const mode = itemMetadata?.mode ?? 'none';
  if (mode === 'none') return null;

  if (mode === 'column') {
    const column = String(itemMetadata?.column ?? '').trim();
    if (!column) return null;
    return metadataFromColumnValue(fileRow?.[column], column);
  }

  if (mode !== 'all_deid' && mode !== 'all_original') return null;

  const meta = topLevelDataColumns(fileRow, csvConfig);
  if (mode === 'all_original') {
    const original = originalSourceFileName(fileRow);
    if (original) meta.originalFileName = original;
  }
  return Object.keys(meta).length ? meta : null;
}

/** @deprecated Use buildDsaItemMetadata */
export function buildDeidUploadMetadata(fileRow, itemMetadata, csvConfig) {
  return buildDsaItemMetadata(
    fileRow,
    itemMetadata ?? { mode: 'all_deid' },
    csvConfig,
  );
}
