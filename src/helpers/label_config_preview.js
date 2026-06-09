// helpers/label_config_preview.js — resolved label/QR strings for Configuration UI preview.

import { getRowFieldValue, resolveAssembly } from './template_engine.js';
import { computeDeidToken } from './slide_naming.js';

function getRename(config, fileRow) {
  const filenameConfig = config?.filename ?? {};
  const reserved = fileRow?.__reserved ?? {};
  const useUuid = filenameConfig.use_uuid !== false;
  const uuid = reserved.uuid;
  const rename = reserved.rename;

  if (useUuid && uuid) return String(uuid);
  if (!useUuid && rename) return String(rename);
  if (uuid) return String(uuid);
  if (rename) return String(rename);
  if (reserved.source?.filename) {
    const name = String(reserved.source.filename);
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(0, dot) : name;
  }
  return '';
}

function previewLegacyLabelText(labelConfig, fileRow) {
  const field = labelConfig?.text_column_field?.value;
  if (!field) return '';
  const val = getRowFieldValue(fileRow, field);
  return val != null ? String(val) : '';
}

function previewLegacyQrPayload(labelConfig, config, fileRow) {
  const qrMode = labelConfig?.qr_mode?.value;
  if (!qrMode || qrMode === 'none') return '';

  switch (qrMode) {
    case 'uuid':
      return String(fileRow?.__reserved?.uuid ?? '');
    case 'column_field': {
      const field = labelConfig?.qr_column_field?.value;
      if (!field) return '';
      return String(getRowFieldValue(fileRow, field) ?? '');
    }
    case 'column_fields': {
      const fields = labelConfig?.qr_column_fields;
      if (!Array.isArray(fields) || fields.length === 0) return '';
      const qrData = {};
      for (const item of fields) {
        const field = item?.value ?? item;
        if (field) qrData[field] = getRowFieldValue(fileRow, field);
      }
      return JSON.stringify(qrData);
    }
    case 'user_defined':
      return getRename(config, fileRow);
    default:
      return '';
  }
}

function usesDeidTokenInAssembly(assemblyConfig) {
  const mode = assemblyConfig?.mode || 'legacy';
  if (mode === 'legacy') return false;
  if (mode === 'template') {
    return /\{deidToken\}/.test(assemblyConfig?.template || '');
  }
  if (mode === 'fields') {
    return (assemblyConfig?.fieldsOrder || []).includes('deidToken');
  }
  return false;
}

/**
 * Resolve label text and QR payload for Configuration preview.
 * @param {object} config full app config slice
 * @param {object} fileRow preview row
 * @param {{ usingSample?: boolean }} options
 * @returns {{ labelText: string, qrPayload: string, deidToken: string, warnings: string[] }}
 */
export function previewLabelStrings(config, fileRow, options = {}) {
  const warnings = [];
  const labelConfig = config?.label ?? {};
  const namingConfig = config?.naming ?? {};

  if (options.usingSample) {
    warnings.push('No files loaded — using sample row.');
  }

  const deidToken = computeDeidToken(fileRow, namingConfig);
  const context = { deidToken };

  let labelText = '';
  let qrPayload = '';

  const labelAsm = labelConfig?.label_text_assembly;
  if (labelAsm?.mode && labelAsm.mode !== 'legacy') {
    labelText = resolveAssembly(labelAsm, fileRow, context);
  } else if (fileRow?.__reserved?.labelText) {
    labelText = String(fileRow.__reserved.labelText);
  } else {
    labelText = previewLegacyLabelText(labelConfig, fileRow);
  }

  const qrAsm = labelConfig?.qr_assembly;
  if (qrAsm?.mode && qrAsm.mode !== 'legacy') {
    qrPayload = resolveAssembly(qrAsm, fileRow, context);
  } else if (fileRow?.__reserved?.qrPayload) {
    qrPayload = String(fileRow.__reserved.qrPayload);
  } else {
    qrPayload = previewLegacyQrPayload(labelConfig, config, fileRow);
  }

  const needsToken =
    usesDeidTokenInAssembly(labelAsm) || usesDeidTokenInAssembly(qrAsm);
  if (needsToken && !deidToken) {
    warnings.push('De-ID token is empty but used in label or QR builder.');
  }

  return { labelText, qrPayload, deidToken, warnings };
}

export { getRename };
