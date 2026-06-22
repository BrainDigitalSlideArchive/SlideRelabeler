// helpers/pattern_engine.js — unified pattern placeholders for computed naming fields.

import { getRowFieldValue } from './template_engine.js';

const UUID_BUILTIN = { token: 'uuid', label: 'UUID' };
const OUTPUT_NAME_BUILTIN = { token: 'outputName', label: 'Output name' };
const LABEL_TEXT_BUILTIN = { token: 'labelText', label: 'Label text' };
const QR_CONTENT_BUILTIN = { token: 'qrContent', label: 'QR content' };
const ORIGINAL_BASENAME_BUILTIN = { token: 'originalBasename', label: 'Original basename' };
const ORIGINAL_FILENAME_BUILTIN = { token: 'originalFilename', label: 'Original filename' };
const DSA_ALIAS_BUILTIN = { token: 'dsaAlias', label: 'DSA alias' };

/** @deprecated use field-specific lists; kept for tests referencing all resolvable builtins */
export const BUILTIN_PLACEHOLDERS = [
  UUID_BUILTIN,
  OUTPUT_NAME_BUILTIN,
  LABEL_TEXT_BUILTIN,
  QR_CONTENT_BUILTIN,
  ORIGINAL_FILENAME_BUILTIN,
  ORIGINAL_BASENAME_BUILTIN,
  DSA_ALIAS_BUILTIN,
];

export const OUTPUT_NAME_BUILTINS = [UUID_BUILTIN, ORIGINAL_BASENAME_BUILTIN];
export const LABEL_TEXT_BUILTINS = [OUTPUT_NAME_BUILTIN, UUID_BUILTIN, ORIGINAL_BASENAME_BUILTIN];
export const QR_CONTENT_BUILTINS = [OUTPUT_NAME_BUILTIN, LABEL_TEXT_BUILTIN, UUID_BUILTIN];
export const DSA_ALIAS_BUILTINS = [
  OUTPUT_NAME_BUILTIN,
  LABEL_TEXT_BUILTIN,
  QR_CONTENT_BUILTIN,
  UUID_BUILTIN,
];

export const PATTERN_FIELD_KEYS = {
  outputName: OUTPUT_NAME_BUILTINS,
  labelText: LABEL_TEXT_BUILTINS,
  qrContent: QR_CONTENT_BUILTINS,
  dsaAlias: DSA_ALIAS_BUILTINS,
};

export const OUTPUT_NAME_DISALLOWED_BUILTINS = new Set([
  'outputName',
  'labelText',
  'qrContent',
  'qrPayload',
  'dsaAlias',
  'deidToken',
]);

const ALL_RESOLVABLE_BUILTINS = [
  ...BUILTIN_PLACEHOLDERS,
  { token: 'qrPayload', label: 'QR content' },
];

const BUILTIN_TOKEN_SET = new Set(ALL_RESOLVABLE_BUILTINS.map((p) => p.token));

const PATTERN_COLUMN_DENYLIST = new Set([
  '__reserved',
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
  'AssembledName',
]);

function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * Normalize a header/column name to camelCase identifier for {token} syntax.
 */
export function toCamelCaseIdentifier(name) {
  const raw = String(name ?? '').trim();
  if (!raw) return '';
  const parts = raw.split(/[\s_\-]+/).filter(Boolean);
  if (parts.length === 1 && /^[A-Za-z][A-Za-z0-9]*$/.test(parts[0])) {
    return parts[0].charAt(0).toLowerCase() + parts[0].slice(1);
  }
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  const head = first.toLowerCase();
  const tail = rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
  return `${head}${tail}`;
}

function basenameFromSourcePath(fileRow) {
  const filename = fileRow?.__reserved?.source?.filename;
  if (!filename) return '';
  const name = String(filename);
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(0, dot) : name;
}

function isDeniedPatternColumn(field, csvConfig = {}) {
  if (!field || typeof field !== 'string') return true;
  if (field === '__reserved') return true;
  if (PATTERN_COLUMN_DENYLIST.has(field)) return true;
  if (field.startsWith('__reserved.')) return true;
  const pathCol = (csvConfig.file_path_column ?? '').trim();
  const destCol = (csvConfig.file_destination_directory_column ?? '').trim();
  if (pathCol && field === pathCol) return true;
  if (destCol && field === destCol) return true;
  return false;
}

/**
 * Discover column field keys from file_cols + row keys.
 */
export function discoverPatternColumnFields({ fileRows = [], fileCols = [], csvConfig = {} } = {}) {
  const fields = new Set();
  for (const col of fileCols) {
    const field = col?.field;
    if (field && !isDeniedPatternColumn(field, csvConfig)) {
      fields.add(field);
    }
  }
  for (const row of fileRows) {
    if (!row || typeof row !== 'object') continue;
    for (const key of Object.keys(row)) {
      if (!isDeniedPatternColumn(key, csvConfig)) {
        fields.add(key);
      }
    }
  }
  return [...fields].sort((a, b) => a.localeCompare(b));
}

/**
 * Map camelCase token → actual field key for a row + column list.
 */
export function buildColumnAliasMap({ fileRows = [], fileCols = [], csvConfig = {} } = {}) {
  const fields = discoverPatternColumnFields({ fileRows, fileCols, csvConfig });
  const map = new Map();
  for (const field of fields) {
    const camel = toCamelCaseIdentifier(field);
    if (camel && !map.has(camel)) {
      map.set(camel, field);
    }
  }
  return map;
}

const PLACEHOLDER_TOKEN_RE = /\{([^{}]+)\}/g;

/**
 * @returns {{ camelTokens: string[], fieldPaths: string[], allTokens: string[] }}
 */
export function extractPatternPlaceholders(pattern) {
  const camelTokens = [];
  const fieldPaths = [];
  const allTokens = [];
  const tpl = toStr(pattern);
  let match;
  const re = new RegExp(PLACEHOLDER_TOKEN_RE.source, 'g');
  while ((match = re.exec(tpl)) !== null) {
    const inner = match[1].trim();
    allTokens.push(inner);
    if (inner.startsWith('field:')) {
      fieldPaths.push(inner.slice(6).trim());
    } else if (!BUILTIN_TOKEN_SET.has(inner) && inner !== 'qrPayload' && inner !== 'deidToken') {
      camelTokens.push(inner);
    }
  }
  return { camelTokens, fieldPaths, allTokens };
}

function resolveBuiltinToken(token, fileRow, context) {
  switch (token) {
    case 'uuid':
      return toStr(context.uuid ?? fileRow?.__reserved?.uuid);
    case 'outputName':
      return toStr(context.outputName ?? fileRow?.__reserved?.rename);
    case 'labelText':
      return toStr(context.labelText ?? fileRow?.__reserved?.labelText);
    case 'qrContent':
    case 'qrPayload':
      return toStr(context.qrPayload ?? fileRow?.__reserved?.qrPayload);
    case 'originalFilename':
      return toStr(fileRow?.__reserved?.source?.filename);
    case 'originalBasename':
      return basenameFromSourcePath(fileRow);
    case 'dsaAlias':
      return toStr(context.dsaAlias ?? fileRow?.__reserved?.dsaAlias);
    case 'deidToken':
      return '';
    default:
      return null;
  }
}

function resolveColumnToken(token, fileRow, aliasMap) {
  if (aliasMap?.has(token)) {
    return getRowFieldValue(fileRow, aliasMap.get(token));
  }
  const direct = getRowFieldValue(fileRow, token);
  if (direct) return direct;
  for (const [field] of aliasMap?.entries?.() ?? []) {
    if (toCamelCaseIdentifier(field) === token) {
      return getRowFieldValue(fileRow, field);
    }
  }
  return '';
}

/**
 * Evaluate a pattern string for one row.
 * @param {object} fileRow
 * @param {string} pattern
 * @param {object} context — outputName, labelText, qrPayload, dsaAlias, uuid
 * @param {Map<string,string>} [aliasMap]
 */
export function evaluateFieldPattern(fileRow, pattern, context = {}, aliasMap = null) {
  const tpl = toStr(pattern);
  if (!tpl.trim()) return '';

  return tpl.replace(PLACEHOLDER_TOKEN_RE, (_match, raw) => {
    const inner = raw.trim();
    if (inner.startsWith('field:')) {
      return getRowFieldValue(fileRow, inner.slice(6).trim());
    }
    const builtin = resolveBuiltinToken(inner, fileRow, context);
    if (builtin !== null) return builtin;
    return resolveColumnToken(inner, fileRow, aliasMap);
  });
}

function builtinsToChips(builtins) {
  return builtins.map((p) => ({
    token: p.token,
    label: p.label,
    insertValue: `{${p.token}}`,
    kind: 'builtin',
  }));
}

/**
 * Placeholder chips for config UI.
 * @param {{ field?: keyof typeof PATTERN_FIELD_KEYS }} options
 */
export function getPatternPlaceholderCatalog({
  field = 'outputName',
  fileRows = [],
  fileCols = [],
  hasLoadedFiles = false,
  csvConfig = {},
} = {}) {
  const builtins = PATTERN_FIELD_KEYS[field] ?? OUTPUT_NAME_BUILTINS;
  const builtinChips = builtinsToChips(builtins);

  if (!hasLoadedFiles) {
    return builtinChips;
  }

  const fields = discoverPatternColumnFields({ fileRows, fileCols, csvConfig });
  const columnChips = fields.map((colField) => {
    const camel = toCamelCaseIdentifier(colField);
    return {
      token: camel,
      label: colField,
      insertValue: `{${camel}}`,
      altInsertValue: `{field:${colField}}`,
      kind: 'column',
    };
  });

  return [...builtinChips, ...columnChips];
}

/**
 * Advisory warnings for Output name patterns that reference downstream or removed builtins.
 */
export function validateOutputNamePatternBuiltins(pattern) {
  const tpl = toStr(pattern).trim();
  if (!tpl) return [];

  const { allTokens } = extractPatternPlaceholders(tpl);
  const bad = allTokens.filter(
    (token) => !token.startsWith('field:') && OUTPUT_NAME_DISALLOWED_BUILTINS.has(token),
  );
  if (bad.length === 0) return [];

  const unique = [...new Set(bad)];
  return [
    `Output name pattern uses placeholders that are not available when the output name is computed: ${unique.map((t) => `{${t}}`).join(', ')}.`,
  ];
}

/**
 * Resolve a column reference value for validation.
 */
export function resolvePatternColumnRef(fileRow, ref, aliasMap) {
  if (ref.startsWith('field:')) {
    return getRowFieldValue(fileRow, ref.slice(6).trim());
  }
  if (BUILTIN_TOKEN_SET.has(ref) || ref === 'qrPayload' || ref === 'deidToken') {
    return null;
  }
  return resolveColumnToken(ref, fileRow, aliasMap);
}

/**
 * Row-level pattern validation: column refs must be non-empty on affected rows.
 * Built-in tokens are not validated here (handled by compute order / caller).
 */
export function validatePatternForRows(pattern, fileRows, { fileCols = [], csvConfig = {}, rowFilter } = {}) {
  const tpl = toStr(pattern).trim();
  if (!tpl) {
    return { blocking: false, failingRowCount: 0, messages: [], failingRows: [] };
  }

  const { camelTokens, fieldPaths } = extractPatternPlaceholders(tpl);
  const columnRefs = [...fieldPaths, ...camelTokens];
  if (columnRefs.length === 0) {
    return { blocking: false, failingRowCount: 0, messages: [], failingRows: [] };
  }

  const aliasMap = buildColumnAliasMap({ fileRows, fileCols, csvConfig });
  const failingRows = [];
  const rows = fileRows ?? [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (rowFilter && !rowFilter(row)) continue;

    let rowFailed = false;
    const missing = [];

    for (const ref of columnRefs) {
      const val = resolvePatternColumnRef(row, ref.startsWith('field:') ? ref : ref, aliasMap);
      if (val === null) continue;
      if (!toStr(val).trim()) {
        rowFailed = true;
        missing.push(ref.startsWith('field:') ? ref.slice(6) : ref);
      }
    }

    if (rowFailed) {
      failingRows.push({ index: i, missing });
    }
  }

  const failingRowCount = failingRows.length;
  const messages = [];
  if (failingRowCount > 0) {
    messages.push(
      `${failingRowCount} row${failingRowCount === 1 ? '' : 's'} missing column value${failingRowCount === 1 ? '' : 's'} required by pattern.`,
    );
  }

  return {
    blocking: failingRowCount > 0,
    failingRowCount,
    messages,
    failingRows,
  };
}
