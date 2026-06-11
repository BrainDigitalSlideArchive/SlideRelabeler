// helpers/template_engine.js — evaluate label/QR/item name templates from row metadata.

const PLACEHOLDER_RE = /\{(uuid|deidToken|field:([^}]+))\}/g;

function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * Read a dotted path or top-level key from a file row.
 * @param {object} fileRow
 * @param {string} fieldPath e.g. "BlockId" or "__reserved.rename"
 */
export function getRowFieldValue(fileRow, fieldPath) {
  if (!fileRow || !fieldPath) return '';
  if (fieldPath === 'deidToken') return toStr(fileRow.__reserved?.deidToken);
  if (fieldPath === 'uuid') return toStr(fileRow.__reserved?.uuid);
  if (fieldPath.startsWith('__reserved.')) {
    const parts = fieldPath.split('.');
    let cur = fileRow;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return '';
      cur = cur[p];
    }
    return toStr(cur);
  }
  if (fieldPath === 'rename' || fieldPath === '__reserved.rename') {
    return toStr(fileRow.__reserved?.rename ?? fileRow.AssembledName);
  }
  if (fieldPath === 'AssembledName') {
    return toStr(fileRow.AssembledName ?? fileRow.__reserved?.assembledName);
  }
  if (fieldPath in fileRow) return toStr(fileRow[fieldPath]);
  return '';
}

/**
 * @param {object} fileRow
 * @param {string} template
 * @param {{ deidToken?: string }} context
 */
export function evaluateTemplate(fileRow, template, context = {}) {
  const tpl = toStr(template).trim();
  if (!tpl) return '';

  return tpl.replace(PLACEHOLDER_RE, (_match, key, fieldName) => {
    if (key === 'uuid') return toStr(fileRow.__reserved?.uuid);
    if (key === 'deidToken') return toStr(context.deidToken ?? fileRow.__reserved?.deidToken);
    if (fieldName) return getRowFieldValue(fileRow, fieldName.trim());
    return '';
  });
}

/**
 * @param {object} fileRow
 * @param {string[]} fieldsOrder
 * @param {string} separator
 * @param {{ deidToken?: string }} context
 */
export function assembleFromFields(fileRow, fieldsOrder, separator, context = {}) {
  if (!Array.isArray(fieldsOrder) || fieldsOrder.length === 0) return '';

  const parts = [];
  for (const field of fieldsOrder) {
    if (field === 'deidToken') {
      const tok = toStr(context.deidToken ?? fileRow.__reserved?.deidToken).trim();
      if (tok) parts.push(tok);
      continue;
    }
    if (field === 'Accession') {
      const tok = toStr(context.deidToken ?? fileRow.__reserved?.deidToken).trim();
      if (tok) parts.push(tok);
      continue;
    }
    const val = getRowFieldValue(fileRow, field).trim();
    if (val) parts.push(val);
  }
  return parts.join(separator ?? '_');
}

/**
 * @param {{ mode?: string, template?: string, fieldsOrder?: string[], separator?: string }} assemblyConfig
 * @param {object} fileRow
 * @param {{ deidToken?: string }} context
 * @returns {string}
 */
export function resolveAssembly(assemblyConfig, fileRow, context = {}) {
  const mode = assemblyConfig?.mode || 'legacy';
  if (mode === 'legacy' || mode === 'off' || mode === 'same_as_label') {
    return '';
  }
  if (mode === 'template') {
    return evaluateTemplate(fileRow, assemblyConfig?.template, context);
  }
  if (mode === 'fields') {
    return assembleFromFields(
      fileRow,
      assemblyConfig?.fieldsOrder,
      assemblyConfig?.separator ?? '_',
      context,
    );
  }
  return '';
}
