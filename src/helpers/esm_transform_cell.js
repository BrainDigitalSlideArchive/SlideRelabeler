// helpers/esm_transform_cell.js — transform provenance metadata for grid cells.

import { applyRulesWithProvenance } from './esm_transform_rules.js';

export const TRANSFORMABLE_ESM_FIELDS = ['BlockId', 'StainId', 'SlideNum'];

/**
 * @param {object} slide
 * @param {object[]} rules
 * @returns {{ values: Record<string, string>, transforms?: Record<string, { original: string, appliedRules: Array<{ id: string, name: string }> }> }}
 */
export function buildEsmFieldTransforms(slide, rules) {
  const values = {};
  const transforms = {};

  for (const field of TRANSFORMABLE_ESM_FIELDS) {
    const result = applyRulesWithProvenance(slide?.[field] ?? '', rules);
    values[field] = result.value;
    if (result.changed) {
      transforms[field] = {
        original: result.original,
        appliedRules: result.appliedRules,
      };
    }
  }

  return {
    values,
    transforms: Object.keys(transforms).length > 0 ? transforms : undefined,
  };
}

export function getTransformMeta(row, field) {
  if (!row || !field) return null;
  const meta = row.__esmTransforms?.[field];
  if (!meta || !meta.appliedRules?.length) return null;
  return meta;
}

export function isTransformedCell(row, field) {
  return getTransformMeta(row, field) != null;
}
