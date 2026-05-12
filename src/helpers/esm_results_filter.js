// helpers/esm_results_filter.js

import { getAccessionFromBarcodeId, getEsmStagingSlideId } from './esm_filename_helpers';
import { applyRules, getSelectedTransformRules } from './esm_transform_rules';

export function normalizeAccessionKey(s) {
  return String(s ?? '').trim().toLowerCase();
}

/**
 * @param {string} str
 * @returns {{ ok: boolean, regex: RegExp | null, errorMessage: string | null }}
 */
export function compileStainFilterRegex(str) {
  const t = String(str ?? '').trim();
  if (!t) return { ok: true, regex: null, errorMessage: null };
  try {
    return { ok: true, regex: new RegExp(t), errorMessage: null };
  } catch (e) {
    const msg = e && typeof e.message === 'string' ? e.message : 'Invalid regex';
    return { ok: false, regex: null, errorMessage: msg };
  }
}

/**
 * Unique accession strings (trimmed) in first-seen order; keys are case-insensitive.
 * @param {Array<{ accession?: string }>} searchRows
 * @returns {string[]}
 */
export function uniqueAccessionSearchStrings(searchRows) {
  const seen = new Set();
  const out = [];
  for (const r of searchRows || []) {
    const t = String(r?.accession ?? '').trim();
    if (!t) continue;
    const k = normalizeAccessionKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/**
 * Staging rows for the eSM grid / apply: walk criteria rows in order, filter slides,
 * dedupe by stable slide id (first criteria row wins).
 *
 * @param {{
 *   searchRows: Array<{ id: string, accession?: string, blockId?: string, deid?: string, stain?: string }>,
 *   slidesByAccession: Record<string, unknown[]>,
 *   mappingConfig: object,
 *   transformRules: unknown[],
 *   selectedTransformRuleIds: string[],
 * }} args
 */
export function buildStagingSlides(args) {
  const {
    searchRows,
    slidesByAccession,
    mappingConfig,
    transformRules,
    selectedTransformRuleIds,
  } = args || {};

  const selectedRules = getSelectedTransformRules(transformRules, selectedTransformRuleIds);
  const transform = (v) => applyRules(v, selectedRules);

  const rxCompiled = compileStainFilterRegex(mappingConfig?.resultsFilterRegex);
  const stainRegex = rxCompiled.ok ? rxCompiled.regex : null;

  const byKey = slidesByAccession && typeof slidesByAccession === 'object' ? slidesByAccession : {};
  const seenIds = new Set();
  const out = [];

  for (const criteriaRow of searchRows || []) {
    const accKey = normalizeAccessionKey(criteriaRow?.accession);
    if (!accKey) continue;

    const slides = Array.isArray(byKey[accKey]) ? byKey[accKey] : [];
    const blockFilterRaw = String(criteriaRow?.blockId ?? '').trim();
    const stainCritRaw = String(criteriaRow?.stain ?? '').trim();
    const blockFilterT = blockFilterRaw ? transform(blockFilterRaw) : '';
    const stainCritT = stainCritRaw ? transform(stainCritRaw) : '';

    for (const s of slides) {
      const slide = s && typeof s === 'object' ? s : {};
      const id = getEsmStagingSlideId(slide);
      if (!id || seenIds.has(id)) continue;

      const blockT = transform(slide.BlockId ?? '');
      if (blockFilterT) {
        if (blockT.trim().toLowerCase() !== blockFilterT.trim().toLowerCase()) continue;
      }

      const stainT = transform(slide.StainId ?? '');
      if (stainCritT) {
        if (stainT.trim().toLowerCase() !== stainCritT.trim().toLowerCase()) continue;
      } else {
        const rxStr = String(mappingConfig?.resultsFilterRegex ?? '').trim();
        if (rxStr) {
          if (!stainRegex || !stainRegex.test(stainT)) continue;
        }
      }

      seenIds.add(id);
      const accession = getAccessionFromBarcodeId(slide?.BarcodeId);
      out.push({
        __esm: {
          id,
          criteriaRowId: criteriaRow.id,
          criteriaRow,
        },
        Accession: accession,
        BlockId: slide.BlockId || '',
        StainId: slide.StainId || '',
        SlideNum: slide.SlideNum || '',
        ImageId: slide.ImageId || '',
        SlideId: slide.SlideId || '',
        ScanDate: slide.ScanDate || '',
        BarcodeId: slide.BarcodeId || '',
        CompressedFileLocation: slide.CompressedFileLocation || '',
        __raw: slide,
      });
    }
  }

  return out;
}
