// helpers/esm_transform_rules.js

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

/**
 * Replace first occurrence of `find` in `value` (literal).
 */
function replaceFirst(value, find, replace) {
  const idx = value.indexOf(find);
  if (idx === -1) return value;
  return value.slice(0, idx) + replace + value.slice(idx + find.length);
}

/**
 * Replace all occurrences of `find` in `value` (literal, case-sensitive).
 * Using split/join is fastest and safe for literal find.
 */
function replaceAll(value, find, replace) {
  return value.split(find).join(replace);
}

/**
 * Replace all occurrences of `find` in `value` (literal, case-insensitive).
 * Avoid regex so user input is always treated literally.
 */
function replaceAllCaseInsensitive(value, find, replace, firstOnly) {
  const haystack = value;
  const needle = find;
  if (!needle) return haystack;

  const lowerHay = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();

  let out = "";
  let i = 0;
  while (i < haystack.length) {
    const idx = lowerHay.indexOf(lowerNeedle, i);
    if (idx === -1) {
      out += haystack.slice(i);
      break;
    }
    out += haystack.slice(i, idx) + replace;
    i = idx + needle.length;
    if (firstOnly) {
      out += haystack.slice(i);
      break;
    }
  }
  return out;
}

/**
 * step: { find, replace, matchMode: "all"|"first", caseSensitive: boolean }
 */
export function applyFindReplace(value, step) {
  const s = toStr(value);
  const find = toStr(step?.find);
  if (!isNonEmptyString(find)) return s;
  const replace = toStr(step?.replace);
  const matchMode = step?.matchMode === "first" ? "first" : "all";
  const caseSensitive = step?.caseSensitive !== false; // default true

  if (caseSensitive) {
    if (matchMode === "first") return replaceFirst(s, find, replace);
    return replaceAll(s, find, replace);
  }

  return replaceAllCaseInsensitive(s, find, replace, matchMode === "first");
}

export function applyRule(value, rule) {
  let s = toStr(value);
  if (!rule || rule.enabled === false) return s;
  const steps = Array.isArray(rule.steps) ? rule.steps : [];
  for (const step of steps) {
    s = applyFindReplace(s, step);
  }
  return s;
}

export function applyRules(value, rules) {
  let s = toStr(value);
  const list = Array.isArray(rules) ? rules : [];
  for (const rule of list) {
    s = applyRule(s, rule);
  }
  return s;
}

/**
 * Apply transform rules and return provenance for UI tooltips.
 * @returns {{ value: string, original: string, changed: boolean, appliedRules: Array<{ id: string, name: string }> }}
 */
export function applyRulesWithProvenance(value, rules) {
  const original = toStr(value);
  let current = original;
  const appliedRules = [];
  const list = Array.isArray(rules) ? rules : [];

  for (const rule of list) {
    const next = applyRule(current, rule);
    if (next !== current) {
      appliedRules.push({
        id: rule?.id != null ? String(rule.id) : '',
        name: rule?.name?.trim() ? String(rule.name).trim() : '(unnamed rule)',
      });
      current = next;
    }
  }

  return {
    value: current,
    original,
    changed: current !== original,
    appliedRules,
  };
}

export function applyFieldTransform(value, rules) {
  return applyRulesWithProvenance(value, rules);
}

export function getSelectedTransformRules(transformRules, selectedIds) {
  const rules = Array.isArray(transformRules) ? transformRules : [];
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  const byId = new Map(rules.filter(Boolean).map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean).filter((r) => r.enabled !== false);
}

const SUMMARY_TRUNCATE = 24;

function truncateSummaryText(text) {
  const s = String(text ?? '');
  if (s.length <= SUMMARY_TRUNCATE) return s;
  return `${s.slice(0, SUMMARY_TRUNCATE - 1)}…`;
}

/**
 * One-line summary of a transform rule's steps for collapsed config UI.
 */
export function summarizeTransformRuleSteps(rule) {
  const steps = (Array.isArray(rule?.steps) ? rule.steps : [])
    .filter((step) => String(step?.find ?? '').trim());

  if (steps.length === 0) return 'No steps';

  if (steps.length === 1) {
    const find = truncateSummaryText(steps[0].find);
    const replace = truncateSummaryText(steps[0].replace ?? '');
    return `"${find}" → "${replace}"`;
  }

  const first = steps[0];
  const firstFind = truncateSummaryText(first.find);
  const firstReplace = truncateSummaryText(first.replace ?? '');
  return `${steps.length} steps: "${firstFind}" → "${firstReplace}", …`;
}

