// helpers/computed_field_config.js — normalize computed-field { mode, pattern } config.

export const DEFAULT_FIELD_SPEC = { mode: 'output_name', pattern: '' };

export const OUTPUT_NAME_MODES = ['original', 'uuid', 'pattern'];
export const LABEL_TEXT_MODES = ['output_name', 'none', 'pattern'];
export const QR_CONTENT_MODES = ['output_name', 'label_text', 'uuid', 'pattern'];
export const DSA_ALIAS_MODES = ['output_name', 'label_text', 'none', 'pattern'];

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
  let mode = dsaConfig.dsaAlias?.mode;
  let pattern = dsaConfig.dsaAlias?.pattern ?? '';

  if (!mode) {
    if (legacy?.mode === 'template' && legacy.template) {
      mode = 'pattern';
      pattern = legacy.template;
    } else if (legacy?.mode === 'same_as_label') {
      mode = 'label_text';
    } else {
      mode = 'output_name';
    }
  }

  const dsaAlias = dsaConfig.dsaAlias
    ? normalizeSpec(dsaConfig.dsaAlias, 'output_name')
    : { mode: mode ?? 'output_name', pattern: pattern ?? '' };

  return { ...dsaConfig, dsaAlias };
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
