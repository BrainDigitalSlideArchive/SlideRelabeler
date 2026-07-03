// helpers/config_preview_row.js — sandbox preview row for Configuration modal.

import {
  HIDDEN_FILE_TABLE_COLUMN_FIELDS,
} from './file_table_columns.js';
import {
  applyRowNamingDefaults,
  initRowNamingSources,
  markNamingFieldSource,
  NAMING_SOURCE,
} from './row_naming_defaults.js';

const EDITABLE_NAMING_FIELDS = new Set([
  '__reserved.rename',
  '__reserved.labelText',
  '__reserved.qrPayload',
]);

const PREVIEW_ROW_RESERVED_FIELDS = new Set([
  '__reserved.source.filename',
  '__reserved.source.directory',
  '__reserved.source.path',
  '__reserved.bytes',
  '__reserved.associatedImages',
  '__reserved.destinationDirectory',
  '__reserved.rename',
  '__reserved.labelText',
  '__reserved.qrPayload',
  '__reserved.progress',
  '__reserved.dsaAlias',
  '__reserved.uuid',
]);

function demoValueForField(field) {
  const lower = String(field).toLowerCase();
  if (lower.includes('block')) return 'B1';
  if (lower.includes('stain')) return 'H&E';
  if (lower.includes('slide')) return '1';
  if (lower.includes('accession')) return 'ACC-DEMO';
  return 'demo';
}

function seedMetadataForFileCols(fileCols = []) {
  const out = {};
  for (const col of fileCols) {
    const field = col?.field;
    if (!field || field.startsWith('__')) continue;
    if (HIDDEN_FILE_TABLE_COLUMN_FIELDS.has(field)) continue;
    if (PREVIEW_ROW_RESERVED_FIELDS.has(field)) continue;
    out[field] = demoValueForField(field);
  }
  return out;
}

function extensionFromFilename(filename) {
  const lastDotIndex = String(filename).lastIndexOf('.');
  return lastDotIndex === -1 ? '' : String(filename).slice(lastDotIndex);
}

export function buildExamplePreviewRow({ uuid, filename, fileCols = [], config }) {
  const ext = extensionFromFilename(filename);
  let row = {
    ...seedMetadataForFileCols(fileCols),
    __reserved: {
      uuid,
      processed: 0,
      progress: 0,
      bytes: 372_000_000,
      associatedImages: ['thumbnail', 'label', 'macro'],
      destinationDirectory: null,
      source: {
        filename,
        directory: '/example/path',
        path: null,
        parsed: { ext },
      },
    },
  };
  row = initRowNamingSources(row);
  if (config) {
    row = applyRowNamingDefaults(row, config);
  }
  return row;
}

export function clonePreviewRowFromFileRow(row) {
  if (!row) return row;
  if (typeof structuredClone === 'function') {
    return structuredClone(row);
  }
  return JSON.parse(JSON.stringify(row));
}

export function updatePreviewRowCell(row, field, value, config) {
  if (!row) return row;

  if (EDITABLE_NAMING_FIELDS.has(field)) {
    let updated = applyNamingFieldEdit(row, field, value);
    if (config) {
      updated = applyRowNamingDefaults(updated, config);
    }
    return updated;
  }

  const next = { ...row };
  const trimmed = value != null ? String(value) : '';
  if (trimmed.trim() === '') {
    delete next[field];
  } else {
    next[field] = trimmed;
  }

  if (config) {
    return applyRowNamingDefaults(next, config);
  }
  return next;
}

export function isPreviewRowExampleMode(mode) {
  return mode === 'example';
}

function applyNamingFieldEdit(row, field, newValue) {
  const replace_row = { ...row };
  let reserved = replace_row.__reserved;
  if (!reserved) return replace_row;

  if (field === '__reserved.rename') {
    reserved = markNamingFieldSource(reserved, 'rename', NAMING_SOURCE.USER);
    reserved = { ...reserved, rename: newValue };
  } else {
    const namingField = field.replace('__reserved.', '');
    reserved = markNamingFieldSource(reserved, namingField, NAMING_SOURCE.USER);
    const nextValue = newValue != null ? String(newValue) : '';
    if (nextValue.trim() === '') {
      const updated = { ...reserved };
      delete updated[namingField];
      reserved = updated;
    } else {
      reserved = { ...reserved, [namingField]: nextValue };
    }
  }

  return { ...replace_row, __reserved: reserved };
}

export function isManualRenameOverride(row) {
  if (!row?.__reserved) return false;
  const { renameSource, rename } = row.__reserved;
  if (renameSource !== NAMING_SOURCE.USER) return false;
  const trimmed = rename != null ? String(rename).trim() : '';
  return trimmed !== '';
}

export function clearManualRenameOverride(row, config) {
  if (!row?.__reserved) return row;
  const reserved = markNamingFieldSource(row.__reserved, 'rename', NAMING_SOURCE.DEFAULT);
  const next = { ...row, __reserved: reserved };
  if (config) {
    return applyRowNamingDefaults(next, config);
  }
  return next;
}

export function resolveLabelPreviewFilePath(row) {
  const path = row?.__reserved?.source?.path;
  if (path != null && String(path).trim()) {
    return String(path);
  }
  return null;
}

export { NAMING_SOURCE };
