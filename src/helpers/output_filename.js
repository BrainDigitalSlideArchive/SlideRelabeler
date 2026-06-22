// helpers/output_filename.js — resolve output basename from config + file row.

import { getRowFieldValue } from './template_engine.js';
import { buildAssembledName } from './assembly_routing.js';
import { getOutputNameFieldSpec } from './computed_field_config.js';
import { buildColumnAliasMap, evaluateFieldPattern } from './pattern_engine.js';

export const OUTPUT_FILENAME_SOURCES = ['original', 'uuid', 'column', 'computed', 'pattern'];

export const DEFAULT_FILENAME_CONFIG = {
  source: 'uuid',
  column: '',
  pattern: '',
  use_uuid: true,
  style: 'uuid',
};

const OUTPUT_FILENAME_COLUMN_DENYLIST = new Set([
  '__reserved.source.directory',
  '__reserved.source.filename',
  '__reserved.source.path',
  '__reserved.bytes',
  '__reserved.associatedImages',
  '__reserved.destinationDirectory',
  '__reserved.rename',
  '__reserved.progress',
  '__reserved.labelText',
  '__reserved.qrPayload',
  '__reserved.dsaAlias',
  '__reserved.uuid',
  'path',
  'CompressedFileLocation',
  // Derived by assembly; prefer Computed mode unless CSV pre-populates (excluded by default).
  'AssembledName',
]);

function isDeniedOutputFilenameColumn(field, csvConfig = {}) {
  if (!field || typeof field !== 'string') return true;
  if (field === '__reserved' || field.startsWith('__')) return true;
  if (OUTPUT_FILENAME_COLUMN_DENYLIST.has(field)) return true;
  const pathCol = (csvConfig.file_path_column ?? '').trim();
  const destCol = (csvConfig.file_destination_directory_column ?? '').trim();
  if (pathCol && field === pathCol) return true;
  if (destCol && field === destCol) return true;
  return false;
}

/**
 * Dropdown options for single-column output filename mode.
 * Only includes: metadata from the loaded table (file_cols + row keys), plus the saved column name.
 * No guessed/preset headers — those may not exist after import.
 */
export function buildOutputFilenameColumnOptions({
  fileRows = [],
  fileCols = [],
  savedColumn = '',
  csvConfig = {},
} = {}) {
  const fields = new Set();

  for (const col of fileCols) {
    const field = col?.field;
    if (field && !isDeniedOutputFilenameColumn(field, csvConfig)) {
      fields.add(field);
    }
  }

  for (const row of fileRows) {
    if (!row || typeof row !== 'object') continue;
    for (const key of Object.keys(row)) {
      if (!isDeniedOutputFilenameColumn(key, csvConfig)) {
        fields.add(key);
      }
    }
  }

  const saved = (savedColumn ?? '').trim();
  if (saved) {
    fields.add(saved);
  }

  return [...fields]
    .sort((a, b) => a.localeCompare(b))
    .map((field) => ({ label: field, value: field }));
}

function basenameFromSourcePath(fileRow) {
  const filename = fileRow?.__reserved?.source?.filename;
  if (!filename) return '';
  const name = String(filename);
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(0, dot) : name;
}

/**
 * Normalize filename config (legacy use_uuid → source).
 */
export function normalizeFilenameConfig(filenameConfig = {}) {
  const merged = { ...DEFAULT_FILENAME_CONFIG, ...filenameConfig };
  let source = merged.source;

  if (!filenameConfig.source || !OUTPUT_FILENAME_SOURCES.includes(filenameConfig.source)) {
    if (merged.use_uuid === false) {
      source = (merged.column || '').trim() ? 'column' : 'computed';
    } else {
      source = 'uuid';
    }
  }

  return {
    ...merged,
    source,
    use_uuid: source === 'uuid',
    style: source === 'uuid' ? 'uuid' : 'readable',
  };
}

export function getFilenameSource(config) {
  return normalizeFilenameConfig(config?.filename).source;
}

/**
 * Resolve output basename (no extension, no prefix/suffix).
 */
export function resolveOutputBasename(fileRow, config, options = {}) {
  if (!fileRow) return '';
  const reserved = fileRow.__reserved ?? {};
  const renameSource = reserved.renameSource;

  if (renameSource === 'user' || renameSource === 'csv' || renameSource === 'esm') {
    if (reserved.rename != null && String(reserved.rename).trim()) {
      return String(reserved.rename);
    }
  }
  if (renameSource === 'default' && reserved.rename != null && String(reserved.rename).trim()) {
    return String(reserved.rename);
  }

  const filenameConfig = normalizeFilenameConfig(config?.filename);
  const source = filenameConfig.source;

  let base = '';

  if (source === 'original') {
    base = basenameFromSourcePath(fileRow);
  } else if (source === 'uuid') {
    base = fileRow.__reserved?.uuid != null ? String(fileRow.__reserved.uuid) : '';
  } else if (source === 'pattern') {
    const spec = getOutputNameFieldSpec(config);
    const aliasMap = buildColumnAliasMap({
      fileRows: [fileRow],
      fileCols: config?.fileCols ?? [],
      csvConfig: config?.csv,
    });
    base = evaluateFieldPattern(fileRow, spec.pattern, {}, aliasMap);
  } else if (source === 'column') {
    const col = (filenameConfig.column ?? '').trim();
    base = col ? getRowFieldValue(fileRow, col) : '';
  } else if (source === 'computed') {
    base = buildAssembledName(fileRow, config?.assembly, options);
  }

  if (!base && options.allowFallback !== false) {
    const assembled = fileRow.AssembledName ?? fileRow.__reserved?.dsaAlias ?? fileRow.__reserved?.assembledName;
    if (assembled) base = String(assembled);
    else if (fileRow.__reserved?.rename) base = String(fileRow.__reserved.rename);
    else if (fileRow.__reserved?.uuid) base = String(fileRow.__reserved.uuid);
    else base = basenameFromSourcePath(fileRow);
  }

  return base != null ? String(base) : '';
}

/**
 * Full output filename stem (no extension).
 */
export function resolveOutputFilenameStem(fileRow, config, options = {}) {
  const reserved = fileRow?.__reserved ?? {};
  if (reserved.rename != null && String(reserved.rename).trim()) {
    return String(reserved.rename);
  }
  return resolveOutputBasename(fileRow, config, options);
}

/**
 * Migrate legacy persisted filename block.
 */
export function migrateFilenameConfig(loadedConfig = {}) {
  const loadedFilename = loadedConfig.filename || {};
  const filename = { ...DEFAULT_FILENAME_CONFIG, ...loadedFilename };
  const csvRename = loadedConfig.csv?.file_rename_column ?? '';

  if (csvRename && !filename.column) {
    filename.column = csvRename;
  }

  const sourceExplicit = loadedFilename.source && OUTPUT_FILENAME_SOURCES.includes(loadedFilename.source);

  if (!sourceExplicit) {
    if (filename.use_uuid === false) {
      filename.source = csvRename ? 'column' : 'computed';
    } else {
      filename.source = 'uuid';
    }
  }

  if (filename.source === 'column' && csvRename && !filename.column) {
    filename.column = csvRename;
  }

  return normalizeFilenameConfig(filename);
}
