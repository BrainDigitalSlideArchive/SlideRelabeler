// helpers/assembly_routing.js — unified assembled name + routing (config v2).

import { safeToken, getAccessionFromBarcodeId } from './slide_naming.js';
import { resolveAssembly } from './template_engine.js';
import { applyRules } from './esm_transform_rules.js';
import { getFilenameSource } from './output_filename.js';
import { getActiveProfile, getProfileTransformRules } from './esm_profile_helpers.js';

export const DEFAULT_ASSEMBLY = {
  specimenId: { source: 'from_metadata', fixedValue: '', column: '' },
  fieldsOrder: ['specimenId', 'BlockId', 'StainId', 'SlideNum'],
  separator: '_',
  duplicateStrategy: 'suffix-index',
  columnName: 'AssembledName',
};

export const DEFAULT_ROUTING = {
  outputFilename: { enabled: false },
  labelText: { enabled: false, column: 'AssembledName' },
  dsaItemName: { enabled: false },
  exportCsv: { enabled: true, columnHeader: 'AssembledName' },
  qr: { enabled: false, mode: 'off' },
};

function normalizeFieldKey(field) {
  if (field === 'Accession' || field === 'specimenId') return 'specimenId';
  return field;
}

/**
 * Resolve specimen ID for assembly from row/slide + assembly.specimenId config.
 */
export function computeSpecimenId(source, assembly, options = {}) {
  const spec = assembly?.specimenId ?? {};
  const sourceMode = spec.source || 'from_metadata';
  const tokenCol = (spec.column ?? '').trim();

  if (tokenCol && source[tokenCol] != null && String(source[tokenCol]).trim()) {
    return safeToken(source[tokenCol]);
  }
  if (source.deid != null && String(source.deid).trim()) {
    return safeToken(source.deid);
  }
  if (options.criteriaDeid && String(options.criteriaDeid).trim()) {
    return safeToken(options.criteriaDeid);
  }
  if (source.TokenID != null && String(source.TokenID).trim()) {
    return safeToken(source.TokenID);
  }

  if (sourceMode === 'fixed') {
    return safeToken(spec.fixedValue || '');
  }
  if (sourceMode === 'generated') {
    const base = safeToken(source?.ImageId || source?.ImageID || source?.SlideId || '');
    return base ? `CASE_${base}` : '';
  }
  if (sourceMode === 'from_column' && tokenCol) {
    return safeToken(source[tokenCol]);
  }

  if (source.Accession != null && String(source.Accession).trim()) {
    return safeToken(source.Accession);
  }
  return safeToken(getAccessionFromBarcodeId(source?.BarcodeId || ''));
}

/**
 * Build assembled name string from a file row or eSM slide object.
 */
export function buildAssembledName(source, assembly, options = {}) {
  if (!source) return '';
  const asm = { ...DEFAULT_ASSEMBLY, ...(assembly || {}) };
  const fields = Array.isArray(asm.fieldsOrder) ? asm.fieldsOrder : DEFAULT_ASSEMBLY.fieldsOrder;
  const separator = asm.separator ?? '_';
  const specimenId = computeSpecimenId(source, asm, options);
  const transformValue = options.transformValue;

  const parts = [];
  for (const rawField of fields) {
    const field = normalizeFieldKey(rawField);
    if (field === 'specimenId') {
      if (specimenId) {
        const v = typeof transformValue === 'function'
          ? transformValue(specimenId, 'specimenId')
          : specimenId;
        const tok = safeToken(v);
        if (tok) parts.push(tok);
      }
      continue;
    }
    const v = source?.[field];
    const vv = typeof transformValue === 'function' ? transformValue(v, field) : v;
    const tok = safeToken(vv);
    if (tok) parts.push(tok);
  }
  return parts.filter(Boolean).join(separator);
}

export function getAssemblyColumnName(config) {
  return config?.assembly?.columnName || DEFAULT_ASSEMBLY.columnName;
}

function reservedAssembledFallback(fileRow, colName) {
  return fileRow[colName]
    ?? fileRow.__reserved?.dsaAlias
    ?? fileRow.__reserved?.assembledName
    ?? '';
}

function resolveLabelTextFromRouting(fileRow, config, context) {
  const routing = config?.routing ?? {};
  const labelConfig = config?.label ?? {};
  const colName = getAssemblyColumnName(config);

  if (routing.labelText?.enabled) {
    const col = routing.labelText.column || colName;
    const fromCol = fileRow[col] ?? fileRow.__reserved?.dsaAlias ?? fileRow.__reserved?.assembledName;
    if (fromCol != null && String(fromCol).trim()) {
      return String(fromCol);
    }
  }

  const labelAsm = labelConfig.label_text_assembly;
  if (labelAsm?.mode && labelAsm.mode !== 'legacy') {
    return resolveAssembly(labelAsm, fileRow, context);
  }

  if (labelConfig.text_column_field?.value) {
    const field = labelConfig.text_column_field.value;
    if (field === 'AssembledName' || field === colName) {
      return reservedAssembledFallback(fileRow, colName);
    }
    if (field === 'rename' || field === '__reserved.rename') {
      return fileRow.__reserved?.rename ?? fileRow[colName] ?? '';
    }
    if (fileRow[field] != null) return String(fileRow[field]);
    if (field.startsWith('__reserved.') && fileRow.__reserved) {
      const key = field.replace('__reserved.', '');
      return String(fileRow.__reserved[key] ?? '');
    }
  }

  return '';
}

function resolveQrFromRouting(fileRow, config, context) {
  const routing = config?.routing ?? {};
  const colName = getAssemblyColumnName(config);

  if (routing.qr?.enabled && routing.qr.mode === 'same_column') {
    return String(reservedAssembledFallback(fileRow, colName));
  }

  const qrAsm = config?.label?.qr_assembly;
  if (qrAsm?.mode && qrAsm.mode !== 'legacy') {
    return resolveAssembly(qrAsm, fileRow, context);
  }

  return '';
}

/**
 * Apply assembly + routing to a file row; returns new row object.
 */
export function applyAssemblyAndRouting(fileRow, config, options = {}) {
  if (!fileRow) return fileRow;

  const assembly = config?.assembly ?? DEFAULT_ASSEMBLY;
  const routing = config?.routing ?? DEFAULT_ROUTING;
  const colName = getAssemblyColumnName(config);
  const reserved = { ...(fileRow.__reserved || {}) };

  const assembled = buildAssembledName(fileRow, assembly, {
    criteriaDeid: options.criteriaDeid,
    transformValue: options.transformValue,
  });

  const next = { ...fileRow, [colName]: assembled };

  const specimenId = computeSpecimenId(fileRow, assembly, options);
  const context = { specimenId };

  if (getFilenameSource(config) === 'computed') {
    reserved.rename = assembled;
  }

  let labelText = resolveLabelTextFromRouting(next, config, context);
  if (labelText) reserved.labelText = labelText;
  else delete reserved.labelText;

  let qrPayload = resolveQrFromRouting(next, config, context);
  if (qrPayload) reserved.qrPayload = qrPayload;
  else delete reserved.qrPayload;

  if (routing.dsaItemName?.enabled && assembled) {
    reserved.dsaAlias = assembled;
  } else if (config?.dsa_upload?.rename_item_after_upload && assembled) {
    reserved.dsaAlias = assembled;
  }

  next.__reserved = reserved;
  return next;
}

/**
 * Saga/helper: apply assembly with eSM transform rules from store.
 */
export function applyAssemblyAndRoutingWithStore(fileRow, config, esmState) {
  const profile = getActiveProfile(esmState);
  const selectedRules = getProfileTransformRules(profile);
  return applyAssemblyAndRouting(fileRow, config, {
    transformValue: (value, field) => applyRules(value, selectedRules, field),
  });
}

export { applyDuplicateStrategy } from './slide_naming.js';
