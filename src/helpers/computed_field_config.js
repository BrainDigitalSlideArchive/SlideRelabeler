// helpers/computed_field_config.js — normalize computed-field { mode, pattern } config.

export const DEFAULT_FIELD_SPEC = { mode: 'output_name', pattern: '' };

export const OUTPUT_NAME_MODES = ['original', 'uuid', 'pattern'];
export const LABEL_TEXT_MODES = ['output_name', 'none', 'pattern'];
export const QR_CONTENT_MODES = ['output_name', 'label_text', 'uuid', 'pattern'];
/** Active rename modes after Same-as-file migration (legacy output_name/none coerce to rename off). */
export const DSA_ALIAS_MODES = ['label_text', 'pattern'];
export const DSA_ALIAS_LEGACY_SAME_AS_FILE_MODES = ['output_name', 'none'];

export const ITEM_METADATA_MODES = ['none', 'all_deid', 'all_original', 'column'];

function normalizeSpec(spec, fallbackMode) {
  if (typeof spec === 'string') {
    return { mode: spec, pattern: '' };
  }
  if (spec && typeof spec === 'object') {
    return {
      mode: spec.mode ?? fallbackMode,
      pattern: spec.pattern ?? '',
    };
  }
  return { mode: fallbackMode, pattern: '' };
}

function normalizeItemMetadata(dsaConfig = {}) {
  const existing = dsaConfig.itemMetadata;
  if (existing && typeof existing === 'object' && existing.mode) {
    const mode = ITEM_METADATA_MODES.includes(existing.mode) ? existing.mode : 'none';
    return {
      mode,
      column: existing.column != null ? String(existing.column) : '',
    };
  }
  if (dsaConfig.set_item_metadata === true) {
    return { mode: 'all_deid', column: '' };
  }
  return { mode: 'none', column: '' };
}

/**
 * Migrate legacy label.textDefault / qrDefault / qrPattern into labelText / qrContent specs.
 */
export function normalizeLabelConfig(labelConfig = {}) {
  const labelText = labelConfig.labelText
    ? normalizeSpec(labelConfig.labelText, 'output_name')
    : normalizeSpec(labelConfig.textDefault ?? 'output_name', 'output_name');

  let qrMode = labelConfig.qrContent?.mode ?? labelConfig.qrDefault ?? 'output_name';
  let qrPattern = labelConfig.qrContent?.pattern ?? labelConfig.qrPattern ?? '';
  if (qrMode === 'pattern' && !qrPattern && labelConfig.qrPattern) {
    qrPattern = labelConfig.qrPattern;
  }
  const qrContent = labelConfig.qrContent
    ? normalizeSpec(labelConfig.qrContent, 'output_name')
    : { mode: qrMode, pattern: qrPattern };

  return {
    ...labelConfig,
    labelText,
    qrContent,
    textDefault: labelText.mode,
    qrDefault: qrContent.mode,
    qrPattern: qrContent.pattern,
  };
}

export function normalizeDsaUploadConfig(dsaConfig = {}) {
  const legacy = dsaConfig.item_name_assembly;
  let inferredMode = dsaConfig.dsaAlias?.mode;
  let inferredPattern = dsaConfig.dsaAlias?.pattern ?? '';

  if (!inferredMode) {
    if (legacy?.mode === 'template' && legacy.template) {
      inferredMode = 'pattern';
      inferredPattern = legacy.template;
    } else if (legacy?.mode === 'same_as_label') {
      inferredMode = 'label_text';
    } else {
      inferredMode = 'label_text';
    }
  }

  let dsaAlias = dsaConfig.dsaAlias
    ? normalizeSpec(dsaConfig.dsaAlias, 'label_text')
    : { mode: inferredMode, pattern: inferredPattern };

  let rename_item_after_upload = Boolean(dsaConfig.rename_item_after_upload);

  // Legacy output_name / none mean Same as file (do not rename).
  if (DSA_ALIAS_LEGACY_SAME_AS_FILE_MODES.includes(dsaAlias.mode)) {
    rename_item_after_upload = false;
    dsaAlias = { mode: 'label_text', pattern: dsaAlias.pattern ?? '' };
  } else if (!DSA_ALIAS_MODES.includes(dsaAlias.mode)) {
    dsaAlias = { mode: 'label_text', pattern: dsaAlias.pattern ?? '' };
  }

  const itemMetadata = normalizeItemMetadata(dsaConfig);
  const { set_item_metadata: _legacyMeta, ...rest } = dsaConfig;

  return {
    ...rest,
    default_api_url: dsaConfig.default_api_url ?? '',
    rename_item_after_upload,
    dsaAlias,
    itemMetadata,
  };
}

export function normalizeFilenamePatternConfig(filenameConfig = {}) {
  const pattern = filenameConfig.pattern ?? '';
  let source = filenameConfig.source ?? 'uuid';
  let resolvedPattern = pattern;
  if (source === 'column' && filenameConfig.column) {
    source = 'pattern';
    if (!resolvedPattern) {
      resolvedPattern = `{field:${filenameConfig.column}}`;
    }
  }
  if (source === 'computed') {
    source = 'pattern';
    if (!resolvedPattern) {
      resolvedPattern = '{field:AssembledName}';
    }
  }
  return { ...filenameConfig, source, pattern: resolvedPattern };
}

/**
 * Fold legacy prefix/suffix flags into a single Custom pattern string.
 */
export function migrateAffixesToPattern(filenameConfig = {}) {
  const fc = { ...filenameConfig };
  const usePrefix = Boolean(fc.use_prefix);
  const useSuffix = Boolean(fc.use_suffix);
  if (!usePrefix && !useSuffix) return fc;

  const prefixStr = usePrefix && fc.prefix ? String(fc.prefix) : '';
  const suffixStr = useSuffix && fc.suffix ? String(fc.suffix) : '';

  let source = fc.source ?? 'uuid';
  let core = fc.pattern ?? '';

  if (source === 'uuid') {
    core = '{uuid}';
  } else if (source === 'original') {
    core = '{originalBasename}';
  } else if (source === 'pattern') {
    core = core || '{uuid}';
  } else if (source === 'column') {
    const col = (fc.column ?? '').trim();
    core = col ? `{field:${col}}` : '{uuid}';
  } else if (source === 'computed') {
    core = core || '{field:AssembledName}';
  } else {
    core = core || '{uuid}';
  }

  return {
    ...fc,
    source: 'pattern',
    pattern: `${prefixStr}${core}${suffixStr}`,
    use_prefix: false,
    use_suffix: false,
  };
}

export function getOutputNameFieldSpec(config) {
  const filename = normalizeFilenamePatternConfig(config?.filename ?? {});
  return {
    mode: filename.source ?? 'uuid',
    pattern: filename.pattern ?? '',
  };
}

export function getLabelTextFieldSpec(config) {
  return normalizeLabelConfig(config?.label).labelText;
}

export function getQrContentFieldSpec(config) {
  return normalizeLabelConfig(config?.label).qrContent;
}

export function getDsaAliasFieldSpec(config) {
  return normalizeDsaUploadConfig(config?.dsa_upload).dsaAlias;
}

export function isPatternMode(spec) {
  return spec?.mode === 'pattern';
}

export function migrateConfigV3(config) {
  if (!config || typeof config !== 'object') return config;
  const next = { ...config };
  next.label = normalizeLabelConfig(next.label);
  next.dsa_upload = normalizeDsaUploadConfig(next.dsa_upload);
  next.filename = migrateAffixesToPattern(normalizeFilenamePatternConfig(next.filename));
  next.configVersion = Math.max(next.configVersion ?? 2, 3);
  return next;
}
