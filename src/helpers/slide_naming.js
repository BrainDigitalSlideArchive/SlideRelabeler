// helpers/slide_naming.js — de-id token and optional template assembly for file rows.

import { applyAssemblyAndRouting, applyAssemblyAndRoutingWithStore } from './assembly_routing.js';

export function safeToken(value) {
  const s = (value ?? '').toString().trim();
  if (!s) return '';
  return s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '_');
}

export function getAccessionFromBarcodeId(barcodeId) {
  if (!barcodeId) return '';
  const s = barcodeId.toString();
  return s.split(';')[0] || '';
}

export function getEsmStagingSlideId(slide) {
  const accession = getAccessionFromBarcodeId(slide?.BarcodeId);
  return (
    slide?.ImageId ??
    slide?.SlideId ??
    `${accession}:${slide?.SlideNum ?? ''}:${slide?.CompressedFileLocation ?? ''}`
  ).toString();
}

/**
 * eSM slide + criteria row (staging / apply_selection).
 */
export function computeAccessionToken(slide, mappingConfig, criteriaRow) {
  const mode = mappingConfig?.accessionMode || 'original';
  if (mode === 'manual') {
    const rowDeid = criteriaRow && String(criteriaRow.deid ?? '').trim();
    if (rowDeid) return safeToken(rowDeid);
    return safeToken(mappingConfig?.accessionToken || '');
  }
  if (mode === 'auto') {
    const base = safeToken(slide?.ImageId || slide?.SlideId || '');
    return base ? `CASE_${base}` : '';
  }
  return safeToken(getAccessionFromBarcodeId(slide?.BarcodeId));
}

/**
 * De-identified accession token for a file row (CSV, eSM-applied, manual add).
 */
export function computeDeidToken(fileRow, namingConfig) {
  const mode = namingConfig?.accessionMode || 'original';
  const tokenCol = (namingConfig?.tokenIdColumn ?? '').trim();

  if (tokenCol && fileRow[tokenCol] != null && String(fileRow[tokenCol]).trim()) {
    return safeToken(fileRow[tokenCol]);
  }
  if (fileRow.deid != null && String(fileRow.deid).trim()) {
    return safeToken(fileRow.deid);
  }
  if (fileRow.TokenID != null && String(fileRow.TokenID).trim()) {
    return safeToken(fileRow.TokenID);
  }
  if (fileRow.__reserved?.deidToken) {
    return safeToken(fileRow.__reserved.deidToken);
  }

  if (mode === 'manual') {
    return safeToken(namingConfig?.accessionToken || '');
  }
  if (mode === 'auto') {
    const base = safeToken(
      fileRow?.ImageId || fileRow?.SlideId || fileRow?.ImageID || '',
    );
    return base ? `CASE_${base}` : '';
  }

  if (fileRow.Accession != null && String(fileRow.Accession).trim()) {
    return safeToken(fileRow.Accession);
  }
  return safeToken(getAccessionFromBarcodeId(fileRow?.BarcodeId || ''));
}

export function buildBaseFilename(slide, accessionToken, mappingConfig, transformValue) {
  const fields = Array.isArray(mappingConfig?.fieldsOrder) ? mappingConfig.fieldsOrder : [];
  const parts = [];
  for (const field of fields) {
    if (field === 'Accession') {
      if (accessionToken) {
        const v =
          typeof transformValue === 'function'
            ? transformValue(accessionToken, field)
            : accessionToken;
        parts.push(safeToken(v));
      }
      continue;
    }
    const v = slide?.[field];
    const vv = typeof transformValue === 'function' ? transformValue(v, field) : v;
    const tok = safeToken(vv);
    if (tok) parts.push(tok);
  }
  return parts.filter(Boolean).join('_');
}

export function applyDuplicateStrategy(items, duplicateStrategy) {
  const strat = duplicateStrategy || 'suffix-index';
  const seen = new Map();
  const out = [];

  for (const it of items) {
    const key = it.baseName;
    const prev = seen.get(key) || 0;
    if (prev === 0) {
      seen.set(key, 1);
      out.push({ ...it, finalBaseName: it.baseName });
      continue;
    }
    if (strat === 'skip-duplicates') {
      continue;
    }
    const nextIndex = prev + 1;
    seen.set(key, nextIndex);
    out.push({ ...it, finalBaseName: `${it.baseName}_${nextIndex}` });
  }
  return out;
}

/**
 * Apply assembly + routing to a file row (config v2).
 */
export function applyTemplatesToRow(fileRow, config, options = {}) {
  return applyAssemblyAndRouting(fileRow, config, options);
}

/**
 * Convenience for sagas: pull transform rules from store slices.
 */
export function applyTemplatesToRowWithStore(fileRow, config, esmState) {
  return applyAssemblyAndRoutingWithStore(fileRow, config, esmState);
}
