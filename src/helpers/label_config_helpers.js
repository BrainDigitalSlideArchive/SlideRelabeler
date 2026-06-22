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

function usesSpecimenIdPlaceholder(labelConfig) {
  const textAsm = labelConfig.label_text_assembly || {};
  const qrAsm = labelConfig.qr_assembly || {};
  const specimenPattern = /\{(deidToken|specimenId)\}/;

  if (textAsm.mode === 'template' && specimenPattern.test(textAsm.template || '')) return true;
  if (textAsm.mode === 'fields' && (textAsm.fieldsOrder || []).some(
    (f) => f === 'specimenId' || f === 'deidToken',
  )) return true;

  if (qrAsm.mode === 'template' && specimenPattern.test(qrAsm.template || '')) return true;
  if (qrAsm.mode === 'fields' && (qrAsm.fieldsOrder || []).some(
    (f) => f === 'specimenId' || f === 'deidToken',
  )) return true;

  return false;
}

export function needsSpecimenId(labelConfig) {
  if (!labelConfig) return false;
  const textField = labelConfig.text_column_field?.value;

  if (textField === 'specimenId' || textField === 'deidToken') return true;
  if (usesSpecimenIdPlaceholder(labelConfig)) return true;

  const qrMode = labelConfig.qr_mode?.value;
  if (labelConfig.qr_assembly?.mode === 'legacy' && qrMode === 'column_field') {
    const f = labelConfig.qr_column_field?.value;
    if (f === 'specimenId' || f === 'deidToken') return true;
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
