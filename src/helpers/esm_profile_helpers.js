// helpers/esm_profile_helpers.js — eSM profile model, migration, and pattern application.

import { applyRules } from './esm_transform_rules.js';
import { buildEsmFieldTransforms, TRANSFORMABLE_ESM_FIELDS } from './esm_transform_cell.js';
import { buildColumnAliasMap, evaluateFieldPattern } from './pattern_engine.js';
import { getAccessionFromBarcodeId } from './esm_filename_helpers.js';
import { applyDuplicateStrategy } from './slide_naming.js';
import { markNamingFieldSource, NAMING_SOURCE } from './row_naming_defaults.js';
import { isHiddenFileTableColumn } from './file_table_columns.js';

export const ESM_OUTPUT_NAME_TARGET = '__reserved.rename';
export const ESM_LABEL_TEXT_TARGET = '__reserved.labelText';

export const ESM_STAIN_FILTER_ALL = 'all';
export const ESM_STAIN_FILTER_MATCH = 'match';

export const DUPLICATE_STRATEGIES = ['suffix-index', 'skip-duplicates'];

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function makeEsmStainPreset(partial = {}) {
  return {
    id: partial.id || makeId(),
    matchValue: partial.matchValue != null ? String(partial.matchValue) : '',
    label: partial.label != null ? String(partial.label) : '',
  };
}

export function makeEsmColumnMapping(partial = {}) {
  return {
    id: partial.id || makeId(),
    enabled: partial.enabled === true,
    targetColumn: partial.targetColumn != null ? String(partial.targetColumn) : '',
    pattern: partial.pattern != null ? String(partial.pattern) : '',
  };
}

export function makeEsmProfile(partial = {}) {
  return {
    id: partial.id || makeId(),
    name: partial.name != null ? String(partial.name) : 'New profile',
    description: partial.description != null ? String(partial.description) : '',
    url: partial.url != null ? String(partial.url) : '',
    proxyUrl: partial.proxyUrl != null ? String(partial.proxyUrl) : '',
    transformRules: Array.isArray(partial.transformRules) ? partial.transformRules : [],
    stainPresets: Array.isArray(partial.stainPresets)
      ? partial.stainPresets.map((p) => makeEsmStainPreset(p))
      : [],
    defaultStainPresetId: partial.defaultStainPresetId ?? null,
    duplicateStrategy: DUPLICATE_STRATEGIES.includes(partial.duplicateStrategy)
      ? partial.duplicateStrategy
      : 'suffix-index',
    outputNameMapping: {
      enabled: partial.outputNameMapping?.enabled === true,
      pattern: partial.outputNameMapping?.pattern != null ? String(partial.outputNameMapping.pattern) : '',
    },
    labelTextMapping: {
      enabled: partial.labelTextMapping?.enabled === true,
      pattern: partial.labelTextMapping?.pattern != null ? String(partial.labelTextMapping.pattern) : '',
    },
    extraColumnMappings: Array.isArray(partial.extraColumnMappings)
      ? partial.extraColumnMappings.map((m) => makeEsmColumnMapping(m))
      : [],
  };
}

/**
 * Deep-copy a profile with fresh top-level and nested ids for independent editing.
 * @param {ReturnType<typeof makeEsmProfile> | null | undefined} source
 */
export function cloneEsmProfile(source) {
  if (!source) return makeEsmProfile();

  const presetIdMap = new Map();
  const stainPresets = (source.stainPresets || []).filter(Boolean).map((p) => {
    const next = makeEsmStainPreset({ matchValue: p.matchValue, label: p.label });
    if (p.id) presetIdMap.set(p.id, next.id);
    return next;
  });

  const defaultStainPresetId = source.defaultStainPresetId
    ? (presetIdMap.get(source.defaultStainPresetId) ?? null)
    : null;

  const transformRules = (source.transformRules || []).filter(Boolean).map((r) => ({
    ...r,
    id: makeId(),
    steps: (r.steps || []).map((s) => ({ ...s })),
  }));

  return makeEsmProfile({
    name: `Copy of ${source.name?.trim() || 'Profile'}`,
    description: source.description,
    url: source.url,
    proxyUrl: source.proxyUrl,
    transformRules,
    stainPresets,
    defaultStainPresetId,
    duplicateStrategy: source.duplicateStrategy,
    outputNameMapping: source.outputNameMapping ? { ...source.outputNameMapping } : undefined,
    labelTextMapping: source.labelTextMapping ? { ...source.labelTextMapping } : undefined,
    extraColumnMappings: (source.extraColumnMappings || []).filter(Boolean).map((m) =>
      makeEsmColumnMapping({
        enabled: m.enabled,
        targetColumn: m.targetColumn,
        pattern: m.pattern,
      }),
    ),
  });
}

/**
 * @param {import('../reducers/esm/default_state').default} esmState
 */
export function getActiveProfile(esmState) {
  const profiles = Array.isArray(esmState?.profiles) ? esmState.profiles : [];
  const activeId = esmState?.activeProfileId;
  if (activeId) {
    const found = profiles.find((p) => p && p.id === activeId);
    if (found) return found;
  }
  return profiles[0] || null;
}

export function getActiveProfileUrl(esmState) {
  return getEsmRequestBase(getActiveProfile(esmState));
}

export function normalizeEsmBaseUrl(url) {
  const t = String(url ?? '').trim();
  if (!t) return '';
  return t.replace(/\/$/, '');
}

export function getEsmCanonicalUrl(profile) {
  return normalizeEsmBaseUrl(profile?.url);
}

export function getEsmProxyUrl(profile) {
  return normalizeEsmBaseUrl(profile?.proxyUrl);
}

export function getEsmRequestBase(profile) {
  const proxy = getEsmProxyUrl(profile);
  if (proxy) return proxy;
  return getEsmCanonicalUrl(profile);
}

/**
 * Resolve canonical + proxy URLs for eSM requests.
 */
export function inferEsmConnectionConfig(profile) {
  const canonicalUrl = getEsmCanonicalUrl(profile);
  const proxyUrl = getEsmProxyUrl(profile);
  const requestBase = proxyUrl || canonicalUrl;
  return {
    canonicalUrl,
    proxyUrl,
    requestBase,
    usingRelay: Boolean(proxyUrl),
  };
}

/**
 * @param {import('../reducers/esm/default_state').default} esmState
 */
export function getEsmConnectionConfig(esmState) {
  return inferEsmConnectionConfig(getActiveProfile(esmState));
}

export function getProfileTransformRules(profile) {
  return Array.isArray(profile?.transformRules) ? profile.transformRules.filter((r) => r && r.enabled !== false) : [];
}

function simpleRegexToPreset(regexStr) {
  const t = String(regexStr ?? '').trim();
  if (!t) return null;
  const stripped = t.replace(/^\^/, '').replace(/\$$/, '');
  if (!stripped || /[\\[\]()+?*|{}]/.test(stripped)) return null;
  return makeEsmStainPreset({ matchValue: stripped, label: stripped });
}

/**
 * Migrate legacy singleton esm state into profiles[].
 */
export function migrateEsmStateToProfiles(incoming = {}) {
  const base = { ...incoming };

  if (Array.isArray(base.profiles) && base.profiles.length > 0) {
    base.profiles = base.profiles.map((p) => makeEsmProfile(p));
    if (!base.activeProfileId && base.profiles[0]) {
      base.activeProfileId = base.profiles[0].id;
    }
    return base;
  }

  const legacyRules = Array.isArray(incoming.transformRules) ? incoming.transformRules : [];
  const selectedIds = Array.isArray(incoming.selectedTransformRuleIds) ? incoming.selectedTransformRuleIds : [];
  let orderedRules = legacyRules;
  if (selectedIds.length > 0) {
    const byId = new Map(legacyRules.filter(Boolean).map((r) => [r.id, r]));
    orderedRules = selectedIds.map((id) => byId.get(id)).filter(Boolean);
    for (const r of legacyRules) {
      if (r && !selectedIds.includes(r.id)) orderedRules.push(r);
    }
  }

  const regex = incoming.mappingConfig?.resultsFilterRegex ?? '';
  const presetFromRegex = simpleRegexToPreset(regex);
  const stainPresets = presetFromRegex ? [presetFromRegex] : [];

  const assemblyFields = incoming.mappingConfig?.fieldsOrder
    ?? ['Accession', 'BlockId', 'StainId', 'SlideNum'];
  const patternParts = assemblyFields.map((f) => {
    if (f === 'Accession' || f === 'specimenId') return '{deid}';
    if (f === 'BlockId') return '{blockId}';
    if (f === 'StainId') return '{stainId}';
    if (f === 'SlideNum') return '{slideNum}';
    return `{${f}}`;
  });
  const legacyOutputPattern = patternParts.join('_');

  const profile = makeEsmProfile({
    id: makeId(),
    name: 'Default',
    description: 'Migrated from previous eSlideManager settings',
    url: incoming.url ?? '',
    transformRules: orderedRules,
    stainPresets,
    defaultStainPresetId: presetFromRegex?.id ?? null,
    duplicateStrategy: incoming.mappingConfig?.duplicateStrategy ?? 'suffix-index',
    outputNameMapping: {
      enabled: Boolean(legacyOutputPattern),
      pattern: legacyOutputPattern,
    },
    labelTextMapping: { enabled: false, pattern: '' },
    extraColumnMappings: [],
  });

  base.profiles = [profile];
  base.activeProfileId = profile.id;
  delete base.url;
  delete base.transformRules;
  delete base.selectedTransformRuleIds;
  delete base.mappingConfig;

  if (incoming.username && base.rememberUsername === undefined) {
    base.rememberUsername = true;
  }

  return base;
}

export const ESM_PATTERN_PLACEHOLDERS = [
  { token: 'accession', label: 'Accession', insertValue: '{accession}' },
  { token: 'blockId', label: 'Block ID', insertValue: '{blockId}' },
  { token: 'stainId', label: 'Stain ID', insertValue: '{stainId}' },
  { token: 'slideNum', label: 'Slide number', insertValue: '{slideNum}' },
  { token: 'imageId', label: 'Image ID', insertValue: '{imageId}' },
  { token: 'slideId', label: 'Slide ID', insertValue: '{slideId}' },
  { token: 'scanDate', label: 'Scan date', insertValue: '{scanDate}' },
  {
    token: 'deid',
    label: 'De-identification',
    insertValue: '{deid}',
    hint: 'Inserts {deid} — the de-identification code from the matching search row (a value you assign so slides can be tracked without using patient identifiers).',
  },
  {
    token: 'uuid',
    label: 'UUID',
    insertValue: '{uuid}',
    hint: 'Assigned when slides are added to the file list. Preview shows {uuid} literally until then.',
  },
];

export function buildEsmPatternRow(slide, criteriaRow, options = {}) {
  const accession = getAccessionFromBarcodeId(slide?.BarcodeId);
  const transform = options.transformValue ?? ((v) => v);
  return {
    Accession: accession,
    BlockId: transform(slide?.BlockId ?? ''),
    StainId: transform(slide?.StainId ?? ''),
    SlideNum: transform(slide?.SlideNum ?? ''),
    ImageId: slide?.ImageId ?? '',
    SlideId: slide?.SlideId ?? '',
    ScanDate: slide?.ScanDate ?? '',
    deid: criteriaRow?.deid ?? '',
    __reserved: {
      uuid: options.uuid ?? '',
    },
  };
}

export function getEnabledMappings(profile) {
  if (!profile) return [];
  const out = [];
  if (profile.outputNameMapping?.enabled && profile.outputNameMapping.pattern?.trim()) {
    out.push({
      targetColumn: ESM_OUTPUT_NAME_TARGET,
      pattern: profile.outputNameMapping.pattern,
      reservedField: 'rename',
    });
  }
  if (profile.labelTextMapping?.enabled && profile.labelTextMapping.pattern?.trim()) {
    out.push({
      targetColumn: ESM_LABEL_TEXT_TARGET,
      pattern: profile.labelTextMapping.pattern,
      reservedField: 'labelText',
    });
  }
  for (const m of profile.extraColumnMappings || []) {
    if (m?.enabled && m.targetColumn?.trim() && m.pattern?.trim()) {
      out.push({
        targetColumn: m.targetColumn.trim(),
        pattern: m.pattern,
        reservedField: null,
      });
    }
  }
  return out;
}

export function profileMappingHeaderName(mapping) {
  if (mapping.targetColumn === ESM_OUTPUT_NAME_TARGET) return 'Output name';
  if (mapping.targetColumn === ESM_LABEL_TEXT_TARGET) return 'Label text';
  return mapping.targetColumn;
}

export function esmProfileImportMappingSummary(profile) {
  const parts = [];
  if (profile?.outputNameMapping?.enabled) parts.push('Output file name');
  if (profile?.labelTextMapping?.enabled) parts.push('Label text');
  const extraCount = (profile?.extraColumnMappings || []).filter((m) => m.enabled).length;
  if (extraCount > 0) parts.push(`${extraCount} custom column${extraCount === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' · ') : 'Using app defaults';
}

function buildEsmPatternAliasMap(patternRow) {
  return buildColumnAliasMap({
    fileRows: [patternRow],
    fileCols: [],
    csvConfig: {},
  });
}

function evaluateEsmMappingPattern(patternRow, pattern, options = {}) {
  const aliasMap = buildEsmPatternAliasMap(patternRow);
  return evaluateFieldPattern(
    patternRow,
    pattern,
    {
      outputName: patternRow.__reserved?.rename ?? '',
      uuid: patternRow.__reserved?.uuid ?? '',
      labelText: patternRow.__reserved?.labelText ?? '',
    },
    aliasMap,
    options,
  );
}

function writeMappingValueToPatternRow(patternRow, mapping, value) {
  if (mapping.targetColumn.startsWith('__reserved.')) {
    const key = mapping.targetColumn.slice('__reserved.'.length);
    patternRow.__reserved = { ...(patternRow.__reserved || {}), [key]: value };
  } else {
    patternRow[mapping.targetColumn] = value;
  }
}

/**
 * Evaluate all enabled profile mappings in order (eSM-native tokens only).
 * @returns {Map<string, string>} targetColumn → evaluated value
 */
export function evaluateEsmProfileMappings(profile, slide, criteriaRow, options = {}) {
  const { preview = false, uuid = '' } = options;
  const rules = getProfileTransformRules(profile);
  const transformValue = (v) => applyRules(v, rules);
  const patternRow = buildEsmPatternRow(slide, criteriaRow, { transformValue, uuid });
  const evalOptions = preview ? { preserveUnresolvedTokens: ['uuid'] } : {};
  const values = new Map();

  for (const mapping of getEnabledMappings(profile)) {
    const value = evaluateEsmMappingPattern(patternRow, mapping.pattern, evalOptions);
    values.set(mapping.targetColumn, value != null ? String(value) : '');
    if (value != null && String(value).trim()) {
      writeMappingValueToPatternRow(patternRow, mapping, String(value));
    }
  }

  return values;
}

export function previewStagingMappingValues(profile, slide, criteriaRow) {
  return evaluateEsmProfileMappings(profile, slide, criteriaRow, { preview: true });
}

/**
 * Column fields to register when importing eSM slides into the file table.
 */
export function collectEsmImportColumnFields(profile, fileRows) {
  const fields = new Set(ESM_IMPORT_COLUMNS);

  for (const mapping of getEnabledMappings(profile)) {
    if (!mapping.targetColumn.startsWith('__reserved.')) {
      fields.add(mapping.targetColumn);
    }
  }

  return [...fields].filter((field) => {
    if (isHiddenFileTableColumn(field)) return false;
    return fileRows.some((r) => r[field] != null && String(r[field]).trim());
  });
}

const ESM_IMPORT_COLUMNS = [
  'Accession',
  'BlockId',
  'StainId',
  'SlideNum',
  'ImageId',
  'SlideId',
  'ScanDate',
  'deid',
];

export function previewProfileOutputName(profile, slide, criteriaRow) {
  if (!profile?.outputNameMapping?.enabled) return '';
  const values = previewStagingMappingValues(profile, slide, criteriaRow);
  return values.get(ESM_OUTPUT_NAME_TARGET) ?? '';
}

export function applyProfilePatternsToFileRow(fileRow, profile, slide, criteriaRow) {
  if (!fileRow || !profile) return fileRow;

  const mappingValues = evaluateEsmProfileMappings(profile, slide, criteriaRow, {
    preview: false,
    uuid: fileRow.__reserved?.uuid ?? '',
  });

  let next = { ...fileRow };
  let reserved = { ...(next.__reserved || {}) };

  for (const mapping of getEnabledMappings(profile)) {
    const value = mappingValues.get(mapping.targetColumn);
    if (mapping.targetColumn.startsWith('__reserved.')) {
      const key = mapping.targetColumn.slice('__reserved.'.length);
      if (value != null && String(value).trim()) {
        reserved[key] = String(value);
        if (mapping.reservedField) {
          reserved = markNamingFieldSource(reserved, mapping.reservedField, NAMING_SOURCE.ESM);
        }
      }
    } else {
      next[mapping.targetColumn] = value != null ? String(value) : '';
    }
  }

  const rules = getProfileTransformRules(profile);
  const { values: transformed, transforms } = buildEsmFieldTransforms(slide, rules);
  for (const field of TRANSFORMABLE_ESM_FIELDS) {
    if (transformed[field] != null) {
      next[field] = String(transformed[field]);
    }
  }
  if (transforms) {
    next.__esmTransforms = transforms;
  }

  next.__reserved = reserved;
  return next;
}

export function resolveOutputNamesForStaging(profile, stagingRows) {
  const duplicateStrategy = profile?.duplicateStrategy || 'suffix-index';
  const items = stagingRows.map((row) => {
    const slide = row.__raw;
    const criteriaRow = row.__esm?.criteriaRow;
    const id = row.__esm?.id;
    const extMatch = (slide?.CompressedFileLocation || '').match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : '';
    let baseName = '';
    if (profile?.outputNameMapping?.enabled) {
      baseName = previewProfileOutputName(profile, slide, criteriaRow);
    }
    return { id, baseName, ext, slide, criteriaRow };
  });

  const withNames = items.filter((it) => it.baseName);
  if (withNames.length === 0) {
    return new Map(items.map((it) => [it.id, '']));
  }

  const deduped = applyDuplicateStrategy(
    withNames.map((it) => ({ id: it.id, baseName: it.baseName, ext: it.ext })),
    duplicateStrategy,
  );

  const renameById = new Map();
  for (const it of items) {
    renameById.set(it.id, '');
  }
  for (const it of deduped) {
    const base = it.finalBaseName || it.baseName || '';
    renameById.set(it.id, base);
  }
  return renameById;
}

export function normalizeSearchRowStain(raw) {
  if (!raw || typeof raw !== 'object') return { stainMode: ESM_STAIN_FILTER_ALL, stain: '' };
  const stain = raw.stain != null ? String(raw.stain) : '';
  if (raw.stainMode === ESM_STAIN_FILTER_MATCH || (stain.trim() && raw.stainMode !== ESM_STAIN_FILTER_ALL)) {
    return { stainMode: ESM_STAIN_FILTER_MATCH, stain };
  }
  if (stain.trim()) {
    return { stainMode: ESM_STAIN_FILTER_MATCH, stain };
  }
  return { stainMode: ESM_STAIN_FILTER_ALL, stain: '' };
}

export function defaultStainForNewSearchRow(profile) {
  const presetId = profile?.defaultStainPresetId;
  if (!presetId) return { stainMode: ESM_STAIN_FILTER_ALL, stain: '' };
  const preset = (profile.stainPresets || []).find((p) => p && p.id === presetId);
  if (!preset?.matchValue?.trim()) return { stainMode: ESM_STAIN_FILTER_ALL, stain: '' };
  return { stainMode: ESM_STAIN_FILTER_MATCH, stain: preset.matchValue };
}
