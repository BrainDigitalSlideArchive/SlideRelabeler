// helpers/esm_search_feedback.js — classify eSM search outcomes for in-modal feedback.

import { buildStagingSlides, normalizeAccessionKey } from './esm_results_filter';

export function makeEmptySearchFeedback() {
  return {
    level: 'none',
    messages: [],
    outcomes: [],
    stagingRowCount: 0,
    completed: false,
  };
}

/**
 * @param {Array<{ accession: string, status: string, slideCount?: number, apiSlideCount?: number, message?: string }>} outcomes
 * @param {number} stagingRowCount
 */
export function compileSearchFeedback(outcomes, stagingRowCount) {
  const list = Array.isArray(outcomes) ? outcomes : [];
  const messages = [];

  const errors = list.filter((o) => o.status === 'error');
  const empties = list.filter((o) => o.status === 'empty');
  const filtered = list.filter((o) => o.status === 'filtered');
  const ok = list.filter((o) => o.status === 'ok');

  for (const o of errors) {
    const detail = o.message ? `: ${o.message}` : '';
    messages.push(`Could not load slides for ${o.accession}${detail}`);
  }
  for (const o of empties) {
    messages.push(`No slides found for accession ${o.accession}.`);
  }
  for (const o of filtered) {
    messages.push(
      `Slides exist for ${o.accession}, but none matched your block/stain filters.`,
    );
  }

  let level = 'none';
  if (errors.length === list.length && list.length > 0) {
    level = 'error';
    if (messages.length === 0) {
      messages.push('Search failed. Check your connection and login, then try again.');
    }
  } else if (errors.length > 0) {
    level = 'warning';
  } else if (ok.length === 0 && (filtered.length > 0 || empties.length > 0)) {
    level = filtered.length > 0 ? 'warning' : 'info';
  }

  return {
    level,
    messages,
    outcomes: list,
    stagingRowCount: stagingRowCount ?? 0,
    completed: true,
  };
}

export function validationSearchFeedback(message) {
  return {
    level: 'error',
    messages: [message],
    outcomes: [],
    stagingRowCount: 0,
    completed: false,
  };
}

/**
 * Map accession string to per-row outcome for input error styling.
 * @param {Array<{ accession: string, status: string }>} outcomes
 * @returns {Map<string, string>} normalized accession key -> status
 */
export function outcomesByAccessionKey(outcomes) {
  const map = new Map();
  for (const o of outcomes || []) {
    const key = String(o?.accession ?? '').trim().toLowerCase();
    if (key) map.set(key, o.status);
  }
  return map;
}

/**
 * Refine API-level outcomes using staging filter results.
 * @param {Array<{ accession: string, status: string, message?: string }>} outcomes
 * @param {Record<string, unknown[]>} slidesByAccession
 */
export function refineOutcomesWithStaging(outcomes, searchRows, slidesByAccession, profile) {
  const staging = buildStagingSlides({ searchRows, slidesByAccession, profile });
  const stagingCountByAcc = new Map();
  for (const row of staging) {
    const accKey = normalizeAccessionKey(row.Accession || row.__esm?.criteriaRow?.accession);
    if (accKey) stagingCountByAcc.set(accKey, (stagingCountByAcc.get(accKey) || 0) + 1);
  }

  const byKey = slidesByAccession && typeof slidesByAccession === 'object' ? slidesByAccession : {};

  return (outcomes || []).map((o) => {
    if (o.status === 'error') return o;
    const key = normalizeAccessionKey(o.accession);
    const apiCount = Array.isArray(byKey[key]) ? byKey[key].length : 0;
    const stagingCount = stagingCountByAcc.get(key) || 0;
    if (apiCount === 0) {
      return { ...o, status: 'empty', apiSlideCount: 0, slideCount: 0 };
    }
    if (stagingCount === 0) {
      return { ...o, status: 'filtered', apiSlideCount: apiCount, slideCount: 0 };
    }
    return { ...o, status: 'ok', apiSlideCount: apiCount, slideCount: stagingCount };
  });
}
