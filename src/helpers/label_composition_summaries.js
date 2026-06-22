// helpers/label_composition_summaries.js — semantic chip labels for label composer rows.

export function truncate(str, max = 48) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

const TEXT_DEFAULT_LABELS = {
  output_name: 'Output name when empty',
  none: 'Blank when empty',
  pattern: 'Custom pattern when empty',
};

const QR_DEFAULT_LABELS = {
  output_name: 'Output name when empty',
  label_text: 'Label when empty',
  uuid: 'UUID when empty',
  pattern: 'Custom pattern when empty',
};

export function describeTextConfig(labelConfig) {
  const mode = labelConfig?.labelText?.mode ?? labelConfig?.textDefault ?? 'output_name';
  if (mode === 'pattern' && labelConfig?.labelText?.pattern) {
    return truncate(`Custom: ${labelConfig.labelText.pattern}`, 40);
  }
  if (mode === 'none') return TEXT_DEFAULT_LABELS.none;
  return TEXT_DEFAULT_LABELS[mode] || TEXT_DEFAULT_LABELS.output_name;
}

export function describeQrConfig(labelConfig) {
  const mode = labelConfig?.qrContent?.mode ?? labelConfig?.qrDefault ?? 'output_name';
  const pattern = labelConfig?.qrContent?.pattern ?? labelConfig?.qrPattern ?? '';
  if (mode === 'pattern' && pattern) {
    return truncate(`Custom: ${pattern}`, 40);
  }
  if (mode === 'pattern') return QR_DEFAULT_LABELS.pattern;
  return QR_DEFAULT_LABELS[mode] || QR_DEFAULT_LABELS.output_name;
}

export function describeIconConfig(iconPath) {
  if (!iconPath) return 'Not set';
  const parts = String(iconPath).split(/[/\\]/);
  return truncate(parts[parts.length - 1] || iconPath, 24);
}

export function featureRowSummary(featureKey, labelConfig, _routingConfig, _assemblyConfig, iconPath, resolvedPreview) {
  let chip = '';
  let tooltip = '';

  if (featureKey === 'text') {
    chip = describeTextConfig(labelConfig);
    tooltip = chip;
  } else if (featureKey === 'qr') {
    chip = describeQrConfig(labelConfig);
    tooltip = chip;
  } else if (featureKey === 'icon') {
    chip = describeIconConfig(iconPath);
    tooltip = iconPath || chip;
  }

  return { chip, tooltip };
}

// Legacy exports kept for any remaining references.
export function describeSpecimenConfig() {
  return 'Not used';
}

export function labelTextSummary(text) {
  return truncate(text);
}

export function qrSummary(text) {
  return truncate(text);
}

export function iconSummary(iconPath) {
  return describeIconConfig(iconPath);
}

export function specimenIdSummary() {
  return 'Not used';
}

export function chipTooltip(chip, tooltip) {
  return tooltip || chip;
}

export function featureRowSummaryLegacy(featureKey, labelConfig, routingConfig, assemblyConfig, iconPath, resolvedPreview) {
  return featureRowSummary(featureKey, labelConfig, routingConfig, assemblyConfig, iconPath, resolvedPreview);
}
