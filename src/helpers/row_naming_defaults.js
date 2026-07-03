// helpers/row_naming_defaults.js — populate Output name, Label text, QR content, DSA alias from config defaults.

import { normalizeFilenameConfig } from './output_filename.js';
import {
  getDsaAliasFieldSpec,
  getLabelTextFieldSpec,
  getOutputNameFieldSpec,
  getQrContentFieldSpec,
  isPatternMode,
} from './computed_field_config.js';
import {
  buildColumnAliasMap,
  evaluateFieldPattern,
} from './pattern_engine.js';

export const NAMING_SOURCE = {
  DEFAULT: 'default',
  CSV: 'csv',
  ESM: 'esm',
  USER: 'user',
};

export const LABEL_TEXT_DEFAULTS = ['output_name', 'none', 'pattern'];
export const QR_CONTENT_DEFAULTS = ['output_name', 'label_text', 'uuid', 'pattern'];

function basenameFromSourcePath(fileRow) {
  const filename = fileRow?.__reserved?.source?.filename;
  if (!filename) return '';
  const name = String(filename);
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(0, dot) : name;
}

function buildAliasMapForConfig(config, fileRow) {
  return buildColumnAliasMap({
    fileRows: [fileRow],
    fileCols: config?.fileCols ?? [],
    csvConfig: config?.csv,
  });
}

/**
 * Resolve output basename from filename config (original | uuid | pattern).
 */
export function resolveDefaultOutputName(fileRow, config, aliasMap = null) {
  if (!fileRow) return '';
  const spec = getOutputNameFieldSpec(config);
  const map = aliasMap ?? buildAliasMapForConfig(config, fileRow);

  if (spec.mode === 'original') {
    return basenameFromSourcePath(fileRow);
  }
  if (spec.mode === 'uuid') {
    return fileRow.__reserved?.uuid != null ? String(fileRow.__reserved.uuid) : '';
  }
  if (spec.mode === 'pattern') {
    return evaluateFieldPattern(fileRow, spec.pattern, {}, map);
  }

  // Legacy
  const filenameConfig = normalizeFilenameConfig(config?.filename);
  if (filenameConfig.source === 'column') {
    const col = (filenameConfig.column ?? '').trim();
    if (col && fileRow[col] != null) return String(fileRow[col]);
  }

  if (fileRow.__reserved?.uuid != null) return String(fileRow.__reserved.uuid);
  return basenameFromSourcePath(fileRow);
}

export function resolveDefaultLabelText(outputName, config, fileRow, context = {}, aliasMap = null) {
  const spec = getLabelTextFieldSpec(config);
  const map = aliasMap ?? (fileRow ? buildAliasMapForConfig(config, fileRow) : null);

  if (spec.mode === 'none') return '';
  if (spec.mode === 'output_name') {
    return outputName != null ? String(outputName) : '';
  }
  if (spec.mode === 'pattern' && fileRow) {
    return evaluateFieldPattern(fileRow, spec.pattern, { ...context, outputName }, map);
  }
  return outputName != null ? String(outputName) : '';
}

/** @deprecated use evaluateFieldPattern */
export function expandQrPattern(pattern, tokens = {}) {
  return evaluateFieldPattern(
    { __reserved: { uuid: tokens.uuid, labelText: tokens.labelText, rename: tokens.outputName } },
    pattern,
    tokens,
  );
}

export function resolveDefaultQrPayload({ outputName, labelText, uuid, dsaAlias }, config, fileRow, aliasMap = null) {
  const spec = getQrContentFieldSpec(config);
  const map = aliasMap ?? (fileRow ? buildAliasMapForConfig(config, fileRow) : null);
  const context = { outputName, labelText, uuid, dsaAlias };

  switch (spec.mode) {
    case 'label_text':
      return labelText != null ? String(labelText) : '';
    case 'uuid':
      return uuid != null ? String(uuid) : '';
    case 'pattern':
      if (!fileRow) {
        return expandQrPattern(spec.pattern, context);
      }
      return evaluateFieldPattern(fileRow, spec.pattern, context, map);
    case 'output_name':
    default:
      return outputName != null ? String(outputName) : '';
  }
}

export function resolveDefaultDsaAlias({ outputName, labelText, uuid, qrPayload }, config, fileRow, aliasMap = null) {
  const spec = getDsaAliasFieldSpec(config);
  const map = aliasMap ?? (fileRow ? buildAliasMapForConfig(config, fileRow) : null);
  const context = { outputName, labelText, uuid, qrPayload };

  if (spec.mode === 'none') return '';
  if (spec.mode === 'output_name') return outputName != null ? String(outputName) : '';
  if (spec.mode === 'label_text') return labelText != null ? String(labelText) : '';
  if (spec.mode === 'pattern' && fileRow) {
    return evaluateFieldPattern(fileRow, spec.pattern, context, map);
  }
  return outputName != null ? String(outputName) : '';
}

function isDefaultSource(source) {
  return source === NAMING_SOURCE.DEFAULT;
}

function isLegacyUnsetSource(source) {
  return source === undefined || source === null || source === '';
}

/**
 * Apply config defaults to row fields whose source is explicitly `default`.
 */
export function applyRowNamingDefaults(fileRow, config) {
  if (!fileRow) return fileRow;

  const aliasMap = buildAliasMapForConfig(config, fileRow);
  const reserved = { ...(fileRow.__reserved || {}) };
  let rename = reserved.rename;

  if (isDefaultSource(reserved.renameSource)) {
    rename = resolveDefaultOutputName(fileRow, config, aliasMap);
    reserved.rename = rename;
  }

  const outputName = rename ?? reserved.rename ?? '';
  const computeContext = {
    outputName,
    uuid: reserved.uuid ?? '',
  };

  if (isDefaultSource(reserved.labelTextSource)) {
    const labelText = resolveDefaultLabelText(outputName, config, fileRow, computeContext, aliasMap);
    if (labelText) reserved.labelText = labelText;
    else delete reserved.labelText;
  }

  const labelText = reserved.labelText ?? '';
  computeContext.labelText = labelText;

  if (isDefaultSource(reserved.qrPayloadSource)) {
    const qrPayload = resolveDefaultQrPayload(
      { ...computeContext, dsaAlias: reserved.dsaAlias },
      config,
      fileRow,
      aliasMap,
    );
    if (qrPayload) reserved.qrPayload = qrPayload;
    else delete reserved.qrPayload;
  }

  computeContext.qrPayload = reserved.qrPayload ?? '';

  const dsaActive = config?.dsa_upload?.rename_item_after_upload
    || config?.dsa_upload?.set_item_metadata;
  if (dsaActive && isDefaultSource(reserved.dsaAliasSource)) {
    const dsaAlias = resolveDefaultDsaAlias(computeContext, config, fileRow, aliasMap);
    if (dsaAlias) reserved.dsaAlias = dsaAlias;
    else delete reserved.dsaAlias;
  }

  return { ...fileRow, __reserved: reserved };
}

/**
 * Migrate legacy row reserved fields on hydrate.
 */
export function migrateRowNamingReserved(reserved = {}) {
  const next = { ...reserved };
  if (next.assembledItemName && !next.dsaAlias) {
    next.dsaAlias = next.assembledItemName;
  }
  if (next.assembledName && !next.dsaAlias) {
    next.dsaAlias = next.assembledName;
  }
  delete next.assembledItemName;
  delete next.assembledName;
  return next;
}

export function initRowNamingSources(fileRow) {
  if (!fileRow?.__reserved) return fileRow;
  return {
    ...fileRow,
    __reserved: migrateRowNamingReserved({
      ...fileRow.__reserved,
      renameSource: NAMING_SOURCE.DEFAULT,
      labelTextSource: NAMING_SOURCE.DEFAULT,
      qrPayloadSource: NAMING_SOURCE.DEFAULT,
      dsaAliasSource: NAMING_SOURCE.DEFAULT,
    }),
  };
}

export function markNamingFieldSource(reserved, field, source) {
  const keyMap = {
    rename: 'renameSource',
    labelText: 'labelTextSource',
    qrPayload: 'qrPayloadSource',
    dsaAlias: 'dsaAliasSource',
  };
  const key = keyMap[field];
  if (!key) return reserved;
  return { ...reserved, [key]: source };
}

export function countProtectedNamingRows(fileRows = []) {
  let count = 0;
  for (const row of fileRows) {
    const r = row?.__reserved ?? {};
    const sources = [r.renameSource, r.labelTextSource, r.qrPayloadSource, r.dsaAliasSource];
    if (sources.some((s) => s && s !== NAMING_SOURCE.DEFAULT)) {
      count += 1;
    }
  }
  return count;
}

export function rowUsesDefaultNamingSource(reserved, field) {
  const keyMap = {
    rename: 'renameSource',
    labelText: 'labelTextSource',
    qrPayload: 'qrPayloadSource',
    dsaAlias: 'dsaAliasSource',
  };
  const source = reserved?.[keyMap[field]];
  return isDefaultSource(source);
}

export { isPatternMode, getOutputNameFieldSpec, getLabelTextFieldSpec, getQrContentFieldSpec, getDsaAliasFieldSpec };
