// helpers/label_config_helpers.js — conditional visibility for guided label config.

export function assemblyModeToGoal(mode) {
  if (mode === 'fields') return 'combine_fields';
  if (mode === 'template') return 'custom_pattern';
  return 'one_column';
}

export function goalToAssemblyMode(goal) {
  if (goal === 'combine_fields') return 'fields';
  if (goal === 'custom_pattern') return 'template';
  return 'legacy';
}

export function needsSpecimenId(labelConfig) {
  if (!labelConfig) return false;
  const textAsm = labelConfig.label_text_assembly || {};
  const qrAsm = labelConfig.qr_assembly || {};
  const textField = labelConfig.text_column_field?.value;

  if (textField === 'deidToken' || textField === 'specimenId') return true;
  if (textAsm.mode === 'template' && /\{deidToken\}/.test(textAsm.template || '')) return true;
  if (textAsm.mode === 'fields' && (textAsm.fieldsOrder || []).includes('deidToken')) return true;

  if (qrAsm.mode === 'template' && /\{deidToken\}/.test(qrAsm.template || '')) return true;
  if (qrAsm.mode === 'fields' && (qrAsm.fieldsOrder || []).includes('deidToken')) return true;

  const qrMode = labelConfig.qr_mode?.value;
  if (labelConfig.qr_assembly?.mode === 'legacy' && qrMode === 'column_field') {
    const f = labelConfig.qr_column_field?.value;
    if (f === 'deidToken') return true;
  }
  return false;
}

export function countLabelSteps(labelConfig) {
  let n = 1;
  if (labelConfig?.add_text) n += 1;
  if (needsSpecimenId(labelConfig)) n += 1;
  if (labelConfig?.add_qr) n += 1;
  if (labelConfig?.add_icon) n += 1;
  n += 1;
  return n;
}
