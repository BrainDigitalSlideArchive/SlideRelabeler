// helpers/pattern_validation.js — row-level pattern validation for process readiness.

import {
  getDsaAliasFieldSpec,
  getLabelTextFieldSpec,
  getOutputNameFieldSpec,
  getQrContentFieldSpec,
  isPatternMode,
} from './computed_field_config.js';
import { validatePatternForRows, validateOutputNamePatternBuiltins } from './pattern_engine.js';
import { NAMING_SOURCE, rowUsesDefaultNamingSource } from './row_naming_defaults.js';

const FIELD_LABELS = {
  outputName: 'Output name',
  labelText: 'Label text',
  qrContent: 'QR content',
  dsaAlias: 'DSA alias',
};

function dsaAliasActive(config) {
  return Boolean(config?.dsa_upload?.rename_item_after_upload)
    || Boolean(config?.dsa_upload?.set_item_metadata);
}

function rowFilterForField(field) {
  return (row) => rowUsesDefaultNamingSource(row?.__reserved, field);
}

function validateFieldPattern(config, fileRows, fileCols, fieldKey, spec) {
  if (!isPatternMode(spec)) {
    return { blocking: false, failingRowCount: 0, messages: [], failingRows: [] };
  }
  const result = validatePatternForRows(spec.pattern, fileRows, {
    fileCols,
    csvConfig: config?.csv,
    rowFilter: rowFilterForField(fieldKey === 'outputName' ? 'rename' : fieldKey),
  });
  const label = FIELD_LABELS[fieldKey] ?? fieldKey;
  return {
    ...result,
    field: fieldKey,
    messages: result.failingRowCount > 0
      ? [`${label}: ${result.messages[0]}`]
      : [],
  };
}

/**
 * Validate all active pattern-mode fields against loaded rows.
 */
export function selectPatternValidationFromState({ config = {}, file_rows, file_cols }) {
  const fileRows = file_rows ?? [];
  const fileCols = file_cols ?? [];
  if (fileRows.length === 0) {
    return { blocking: false, messages: [], failingRowCount: 0, fields: [] };
  }

  const enrichedConfig = { ...config, fileCols };
  const outputNameSpec = getOutputNameFieldSpec(config);
  const advisoryMessages = isPatternMode(outputNameSpec)
    ? validateOutputNamePatternBuiltins(outputNameSpec.pattern)
    : [];

  const checks = [
    validateFieldPattern(enrichedConfig, fileRows, fileCols, 'outputName', getOutputNameFieldSpec(config)),
    validateFieldPattern(enrichedConfig, fileRows, fileCols, 'labelText', getLabelTextFieldSpec(config)),
    validateFieldPattern(enrichedConfig, fileRows, fileCols, 'qrContent', getQrContentFieldSpec(config)),
  ];

  if (dsaAliasActive(config)) {
    checks.push(
      validateFieldPattern(enrichedConfig, fileRows, fileCols, 'dsaAlias', getDsaAliasFieldSpec(config)),
    );
  }

  const failing = checks.filter((c) => c.blocking);
  const messages = [...advisoryMessages, ...failing.flatMap((c) => c.messages)];
  const failingRowCount = Math.max(...checks.map((c) => c.failingRowCount), 0);

  return {
    blocking: failing.length > 0,
    messages,
    failingRowCount,
    fields: failing,
  };
}

export { NAMING_SOURCE };
