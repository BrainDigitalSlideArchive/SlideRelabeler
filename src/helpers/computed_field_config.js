// helpers/computed_field_config.js — normalize computed-field { mode, pattern } config.

export const DEFAULT_FIELD_SPEC = { mode: 'output_name', pattern: '' };

export const OUTPUT_NAME_MODES = ['original', 'uuid', 'pattern'];
export const LABEL_TEXT_MODES = ['output_name', 'none', 'pattern'];
export const QR_CONTENT_MODES = ['output_name', 'label_text', 'uuid', 'pattern'];
export const LABEL_FONT_SIZE_MODES = ['auto', 'manual'];
export const LABEL_FONT_SIZE_MIN = 0.01;
export const LABEL_FONT_SIZE_MAX = 0.35;
export const LABEL_FONT_SIZE_DEFAULT = 0.15;
/** Unitless UI scale for manual font size (maps linearly onto LABEL_FONT_SIZE_MIN..MAX). */
export const LABEL_FONT_SIZE_UI_MIN = 1;
export const LABEL_FONT_SIZE_UI_MAX = 100;
export const LABEL_WIDTH_DEFAULT = 750;
export const LABEL_WIDTH_MIN = 100;
export const LABEL_WIDTH_MAX = 1500;

/**
 * Map stored fraction (0.01–0.35) → unitless UI size (1–100).
 */
export function fontSizeFractionToUi(fraction) {
  const n = Number(fraction);
  const clamped = Number.isFinite(n)
    ? Math.min(LABEL_FONT_SIZE_MAX, Math.max(LABEL_FONT_SIZE_MIN, n))
    : LABEL_FONT_SIZE_DEFAULT;
  const span = LABEL_FONT_SIZE_MAX - LABEL_FONT_SIZE_MIN;
  const t = (clamped - LABEL_FONT_SIZE_MIN) / span;
  return Math.round(t * (LABEL_FONT_SIZE_UI_MAX - LABEL_FONT_SIZE_UI_MIN) + LABEL_FONT_SIZE_UI_MIN);
}

/**
 * Map unitless UI size (1–100) → stored fraction (0.01–0.35).
 */
export function fontSizeUiToFraction(uiSize) {
  const n = Number(uiSize);
  const clamped = Number.isFinite(n)
    ? Math.min(LABEL_FONT_SIZE_UI_MAX, Math.max(LABEL_FONT_SIZE_UI_MIN, Math.round(n)))
    : fontSizeFractionToUi(LABEL_FONT_SIZE_DEFAULT);
  const span = LABEL_FONT_SIZE_MAX - LABEL_FONT_SIZE_MIN;
  const t = (clamped - LABEL_FONT_SIZE_UI_MIN) / (LABEL_FONT_SIZE_UI_MAX - LABEL_FONT_SIZE_UI_MIN);
  return LABEL_FONT_SIZE_MIN + t * span;
}
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
 * Normalize label fontSizeMode / fontSize (fraction of label width).
 */
export function normalizeLabelFontSize(labelConfig = {}) {
  const mode = LABEL_FONT_SIZE_MODES.includes(labelConfig.fontSizeMode)
    ? labelConfig.fontSizeMode
    : 'auto';
  let fontSize = LABEL_FONT_SIZE_DEFAULT;
  if (labelConfig.fontSize != null && labelConfig.fontSize !== '') {
    const n = Number(labelConfig.fontSize);
    if (Number.isFinite(n)) {
      fontSize = Math.min(LABEL_FONT_SIZE_MAX, Math.max(LABEL_FONT_SIZE_MIN, n));
    }
  }
  return { fontSizeMode: mode, fontSize };
}

/**
 * Normalize stored label canvas width in pixels (clamped).
 */
export function normalizeLabelWidthValue(labelConfig = {}) {
  let labelWidth = LABEL_WIDTH_DEFAULT;
  if (labelConfig.labelWidth != null && labelConfig.labelWidth !== '') {
    const n = Number(labelConfig.labelWidth);
    if (Number.isFinite(n)) {
      labelWidth = Math.min(LABEL_WIDTH_MAX, Math.max(LABEL_WIDTH_MIN, Math.round(n)));
    }
  }
  return labelWidth;
}

/**
 * Effective canvas width: default unless customizeLabelWidth is on.
 */
export function getEffectiveLabelWidth(labelConfig = {}) {
  if (!labelConfig?.customizeLabelWidth) {
    return LABEL_WIDTH_DEFAULT;
  }
  return normalizeLabelWidthValue(labelConfig);
}

/** @deprecated use normalizeLabelWidthValue / getEffectiveLabelWidth */
export function normalizeLabelWidth(labelConfig = {}) {
  return getEffectiveLabelWidth(labelConfig);
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

  const { fontSizeMode, fontSize } = normalizeLabelFontSize(labelConfig);
  const labelWidth = normalizeLabelWidthValue(labelConfig);
  const customizeLabelWidth = Boolean(labelConfig.customizeLabelWidth);

  return {
    ...labelConfig,
    labelText,
    qrContent,
    textDefault: labelText.mode,
    qrDefault: qrContent.mode,
    qrPattern: qrContent.pattern,
    fontSizeMode,
    fontSize,
    labelWidth,
    customizeLabelWidth,
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
