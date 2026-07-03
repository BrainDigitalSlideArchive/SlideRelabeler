// helpers/esm_results_filter.js

import { getAccessionFromBarcodeId, getEsmStagingSlideId } from './esm_filename_helpers';
import { applyRules } from './esm_transform_rules';
import { buildEsmFieldTransforms } from './esm_transform_cell';
import { getProfileTransformRules, ESM_STAIN_FILTER_ALL, ESM_STAIN_FILTER_MATCH } from './esm_profile_helpers';

export function normalizeAccessionKey(s) {
  return String(s ?? '').trim().toLowerCase();
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
 *   searchRows: Array<{ id: string, accession?: string, blockId?: string, deid?: string, stain?: string, stainMode?: string }>,
 *   slidesByAccession: Record<string, unknown[]>,
 *   profile: object | null,
 * }} args
 */
export function buildStagingSlides(args) {
  const { searchRows, slidesByAccession, profile } = args || {};

  const rules = getProfileTransformRules(profile);
  const transform = (v) => applyRules(v, rules);

  const byKey = slidesByAccession && typeof slidesByAccession === 'object' ? slidesByAccession : {};
  const seenIds = new Set();
  const out = [];

  for (const criteriaRow of searchRows || []) {
    const accKey = normalizeAccessionKey(criteriaRow?.accession);
    if (!accKey) continue;

    const slides = Array.isArray(byKey[accKey]) ? byKey[accKey] : [];
    const blockFilterRaw = String(criteriaRow?.blockId ?? '').trim();
    const stainMode = criteriaRow?.stainMode === ESM_STAIN_FILTER_MATCH
      ? ESM_STAIN_FILTER_MATCH
      : (String(criteriaRow?.stain ?? '').trim() ? ESM_STAIN_FILTER_MATCH : ESM_STAIN_FILTER_ALL);
    const stainCritRaw = stainMode === ESM_STAIN_FILTER_MATCH ? String(criteriaRow?.stain ?? '').trim() : '';
    const blockFilterT = blockFilterRaw ? transform(blockFilterRaw) : '';
    const stainCritT = stainCritRaw ? transform(stainCritRaw) : '';

    for (const s of slides) {
      const slide = s && typeof s === 'object' ? s : {};
      const id = getEsmStagingSlideId(slide);
      if (!id || seenIds.has(id)) continue;

      const { values: transformed, transforms } = buildEsmFieldTransforms(slide, rules);
      const blockT = transformed.BlockId ?? '';
      const stainT = transformed.StainId ?? '';

      if (blockFilterT) {
        if (blockT.trim().toLowerCase() !== blockFilterT.trim().toLowerCase()) continue;
      }

      if (stainCritT) {
        if (stainT.trim().toLowerCase() !== stainCritT.trim().toLowerCase()) continue;
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
        BlockId: blockT,
        StainId: stainT,
        SlideNum: transformed.SlideNum ?? slide.SlideNum ?? '',
        ImageId: slide.ImageId || '',
        SlideId: slide.SlideId || '',
        ScanDate: slide.ScanDate || '',
        BarcodeId: slide.BarcodeId || '',
        CompressedFileLocation: slide.CompressedFileLocation || '',
        ...(transforms ? { __esmTransforms: transforms } : {}),
        __raw: slide,
      });
    }
  }

  return out;
}
