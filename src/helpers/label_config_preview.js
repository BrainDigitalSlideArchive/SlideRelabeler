// helpers/label_config_preview.js — resolved label/QR strings for Configuration UI preview.

import {
  resolveDefaultLabelText,
  resolveDefaultOutputName,
  resolveDefaultQrPayload,
  NAMING_SOURCE,
} from './row_naming_defaults.js';
import { getLabelCompositionIssues } from './label_composition_issues.js';
import { truncate } from './label_composition_summaries.js';

export { getLabelCompositionIssues } from './label_composition_issues.js';

const TEXT_MODE_PREVIEW_LABELS = {
  output_name: 'Output name',
  none: 'Blank',
  pattern: 'Custom pattern',
};

const QR_MODE_PREVIEW_LABELS = {
  output_name: 'Output name',
  label_text: 'Label',
  uuid: 'UUID',
  pattern: 'Custom pattern',
};

function textDefaultModeLabel(labelConfig) {
  const mode = labelConfig?.labelText?.mode ?? labelConfig?.textDefault ?? 'output_name';
  if (mode === 'pattern') {
    const pattern = labelConfig?.labelText?.pattern ?? '';
    return pattern
      ? `Custom pattern (${truncate(pattern, 32)})`
      : TEXT_MODE_PREVIEW_LABELS.pattern;
  }
  return TEXT_MODE_PREVIEW_LABELS[mode] || TEXT_MODE_PREVIEW_LABELS.output_name;
}

function qrDefaultModeLabel(labelConfig) {
  const mode = labelConfig?.qrContent?.mode ?? labelConfig?.qrDefault ?? 'output_name';
  if (mode === 'pattern') {
    const pattern = labelConfig?.qrContent?.pattern ?? labelConfig?.qrPattern ?? '';
    return pattern
      ? `Custom pattern (${truncate(pattern, 32)})`
      : QR_MODE_PREVIEW_LABELS.pattern;
  }
  return QR_MODE_PREVIEW_LABELS[mode] || QR_MODE_PREVIEW_LABELS.output_name;
}

function formatSampleUuid(uuid) {
  if (!uuid) return 'unknown';
  const s = String(uuid);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

function isNamingFieldFromTable(reserved, field) {
  const keyMap = {
    labelText: 'labelTextSource',
    qrPayload: 'qrPayloadSource',
  };
  const source = reserved?.[keyMap[field]];
  return source === NAMING_SOURCE.USER
    || source === NAMING_SOURCE.CSV
    || source === NAMING_SOURCE.ESM;
}

function sampleRowPrefix(fileRow) {
  const uuid = fileRow?.__reserved?.uuid ?? '';
  return `Sample row · UUID ${formatSampleUuid(uuid)} · output name from Output name defaults`;
}

export function describePreviewTextProvenance(config, fileRow, options = {}) {
  const labelConfig = config?.label ?? {};
  const modeLabel = textDefaultModeLabel(labelConfig);

  if (options.usingSample) {
    return `${sampleRowPrefix(fileRow)} · Label default: ${modeLabel}`;
  }

  const reserved = fileRow?.__reserved ?? {};
  if (isNamingFieldFromTable(reserved, 'labelText')) {
    return 'Label: from table';
  }
  return `Label: default (column empty) — ${modeLabel}`;
}

export function describePreviewQrProvenance(config, fileRow, options = {}) {
  const labelConfig = config?.label ?? {};
  const modeLabel = qrDefaultModeLabel(labelConfig);

  if (options.usingSample) {
    return `${sampleRowPrefix(fileRow)} · QR default: ${modeLabel}`;
  }

  const reserved = fileRow?.__reserved ?? {};
  if (isNamingFieldFromTable(reserved, 'qrPayload')) {
    return 'QR: from table';
  }
  return `QR: default (column empty) — ${modeLabel}`;
}

/**
 * Resolve label text and QR payload for Configuration preview.
 */
export function previewLabelStrings(config, fileRow, options = {}) {
  const warnings = [];
  const usingSample = Boolean(options.usingSample);

  const reserved = fileRow?.__reserved ?? {};
  const rename = reserved.rename ?? resolveDefaultOutputName(fileRow, config);
  const computeContext = {
    outputName: rename,
    uuid: reserved.uuid ?? '',
  };
  const labelText = reserved.labelText ?? resolveDefaultLabelText(
    rename,
    config,
    fileRow,
    computeContext,
  );
  computeContext.labelText = labelText;
  const qrPayload = reserved.qrPayload ?? resolveDefaultQrPayload(
    computeContext,
    config,
    fileRow,
  );

  const resolved = {
    labelText: labelText != null ? String(labelText) : '',
    qrPayload: qrPayload != null ? String(qrPayload) : '',
  };

  const iconPath = config?.label?.icon_file?.source?.path ?? '';
  const issues = getLabelCompositionIssues(config?.label, resolved, iconPath);
  warnings.push(...issues.map((issue) => issue.message));

  const provenanceOptions = { usingSample };

  return {
    labelText: resolved.labelText,
    qrPayload: resolved.qrPayload,
    outputName: rename != null ? String(rename) : '',
    labelTextProvenance: describePreviewTextProvenance(config, fileRow, provenanceOptions),
    qrPayloadProvenance: describePreviewQrProvenance(config, fileRow, provenanceOptions),
    warnings,
    issues,
  };
}

export function getRename(config, fileRow) {
  const reserved = fileRow?.__reserved ?? {};
  if (reserved.rename != null && String(reserved.rename).trim()) {
    return String(reserved.rename);
  }
  return resolveDefaultOutputName(fileRow, config);
}

const SCHEMATIC_TEXT_BY_MODE = {
  output_name: '{outputName}',
  none: '(blank)',
};

const SCHEMATIC_QR_BY_MODE = {
  output_name: '{outputName}',
  label_text: '{labelText}',
  uuid: '{uuid}',
};

/**
 * Template placeholders for the label schematic (not resolved row values).
 */
export function getLabelSchematicTemplates(labelConfig = {}) {
  const textMode = labelConfig?.labelText?.mode ?? labelConfig?.textDefault ?? 'output_name';
  let labelText = SCHEMATIC_TEXT_BY_MODE.output_name;
  if (textMode === 'pattern') {
    const pattern = labelConfig?.labelText?.pattern ?? '';
    labelText = pattern.trim() || '{outputName}';
  } else {
    labelText = SCHEMATIC_TEXT_BY_MODE[textMode] ?? SCHEMATIC_TEXT_BY_MODE.output_name;
  }

  const qrMode = labelConfig?.qrContent?.mode ?? labelConfig?.qrDefault ?? 'output_name';
  let qrPayload = SCHEMATIC_QR_BY_MODE.output_name;
  if (qrMode === 'pattern') {
    const pattern = labelConfig?.qrContent?.pattern ?? labelConfig?.qrPattern ?? '';
    qrPayload = pattern.trim() || 'https://example.org?id={uuid}';
  } else {
    qrPayload = SCHEMATIC_QR_BY_MODE[qrMode] ?? SCHEMATIC_QR_BY_MODE.output_name;
  }

  return { labelText, qrPayload };
}
