import React from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import ComputedFieldEditor from './ComputedFieldEditor';

const DSA_ALIAS_OPTIONS = [
  {
    value: 'output_name',
    label: 'Use Output name',
    helper: 'Use each row\'s Output name as the DSA item display name.',
  },
  {
    value: 'label_text',
    label: 'Use Label',
    helper: 'Use each row\'s Label text as the DSA item display name.',
  },
  {
    value: 'none',
    label: 'Leave blank',
    helper: 'Do not set a display name from computed defaults.',
  },
  {
    value: 'pattern',
    label: 'Custom pattern',
    helper: 'Build the DSA alias from placeholders and column values.',
    hasPatternField: true,
    patternPlaceholder: '{outputName}',
  },
];

export default function DsaAliasEditor({
  dsaUploadConfig,
  disabled,
  placeholderCatalog = [],
  previewValue,
  onRecompute,
}) {
  const dispatch = useDispatch();
  const spec = dsaUploadConfig?.dsaAlias ?? { mode: 'output_name', pattern: '' };
  const active = spec.mode ?? 'output_name';

  function onChange(partial) {
    dispatch({
      type: config_actions.SET_DSA_UPLOAD_CONFIG,
      payload: { dsaAlias: partial },
    });
    if (onRecompute) onRecompute();
  }

  function select(value) {
    onChange({ mode: value, pattern: spec.pattern ?? '' });
  }

  function onPatternChange(value) {
    onChange({ mode: active, pattern: value });
  }

  if (!dsaUploadConfig?.rename_item_after_upload && !dsaUploadConfig?.set_item_metadata) {
    return null;
  }

  return (
    <div className="dsa-alias-editor">
      <div className="__config-control-subsection-title">DSA alias</div>
      <div className="__config-control-subsection-description">
        Default for the Girder item display name when renaming after upload.
      </div>
      <ComputedFieldEditor
        name="dsa-alias"
        options={DSA_ALIAS_OPTIONS}
        active={active}
        disabled={disabled}
        onSelect={select}
        patternValue={spec.pattern ?? ''}
        onPatternChange={onPatternChange}
        catalog={active === 'pattern' ? placeholderCatalog : []}
        previewValue={previewValue}
      />
    </div>
  );
}
