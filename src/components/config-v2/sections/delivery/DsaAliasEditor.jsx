import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import { PlaceholderChips } from '../../../config/ComputedFieldEditor';
import ConfigChoiceChips from '../../primitives/ConfigChoiceChips';
import ConfigDetailPanel from '../../primitives/ConfigDetailPanel';
import ConfigField from '../../primitives/ConfigField';
import ConfigHelperText from '../../primitives/ConfigHelperText';
import ConfigLabeledRow from '../../primitives/ConfigLabeledRow';

const ITEM_NAME_OPTIONS = [
  {
    value: 'file',
    label: 'Same as file (default)',
    helper: 'Keep the Girder item name matching the uploaded file (from Output name).',
  },
  {
    value: 'label_text',
    label: 'Label text',
    helper: "Use each row's Label text as the DSA item display name.",
  },
  {
    value: 'pattern',
    label: 'Column or custom pattern',
    helper: 'Build the item name from placeholders and column values.',
    patternPlaceholder: '{labelText}',
  },
];

const CHIP_OPTIONS = ITEM_NAME_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
  helper: opt.helper,
}));

function selectedItemNameMode(dsaUploadConfig) {
  if (!dsaUploadConfig?.rename_item_after_upload) return 'file';
  const mode = dsaUploadConfig?.dsaAlias?.mode;
  if (mode === 'pattern') return 'pattern';
  if (mode === 'label_text') return 'label_text';
  return 'file';
}

/**
 * DSA item name chips + optional pattern detail (config-v2 kit).
 */
export default function DsaAliasEditor({
  dsaUploadConfig,
  disabled,
  placeholderCatalog = [],
  onRecompute,
}) {
  const dispatch = useDispatch();
  const spec = dsaUploadConfig?.dsaAlias ?? { mode: 'label_text', pattern: '' };
  const active = selectedItemNameMode(dsaUploadConfig);
  const activeOpt = ITEM_NAME_OPTIONS.find((o) => o.value === active);

  const applySelection = useCallback(
    (value) => {
      if (value === 'file') {
        dispatch({
          type: config_actions.SET_DSA_UPLOAD_CONFIG,
          payload: { rename_item_after_upload: false },
        });
      } else {
        dispatch({
          type: config_actions.SET_DSA_UPLOAD_CONFIG,
          payload: {
            rename_item_after_upload: true,
            dsaAlias: { mode: value, pattern: spec.pattern ?? '' },
          },
        });
      }
      if (onRecompute) onRecompute();
    },
    [dispatch, onRecompute, spec.pattern],
  );

  const onPatternChange = useCallback(
    (value) => {
      dispatch({
        type: config_actions.SET_DSA_UPLOAD_CONFIG,
        payload: {
          rename_item_after_upload: true,
          dsaAlias: { mode: 'pattern', pattern: value },
        },
      });
      if (onRecompute) onRecompute();
    },
    [dispatch, onRecompute],
  );

  const handlePatternInsert = useCallback(
    (token) => {
      onPatternChange(`${spec.pattern ?? ''}${token}`);
    },
    [onPatternChange, spec.pattern],
  );

  return (
    <ConfigLabeledRow
      label="Item name:"
      labelId="dsa-item-name-label-v2"
    >
      <ConfigChoiceChips
        name="dsa-item-name-mode-v2"
        value={active}
        options={CHIP_OPTIONS}
        disabled={disabled}
        ariaLabelledBy="dsa-item-name-label-v2"
        onChange={applySelection}
      />
      {active === 'pattern' ? (
        <ConfigDetailPanel aria-live="polite">
          <ConfigHelperText>
            Values from one or more columns can be used by including the column name within curly
            brackets
          </ConfigHelperText>
          <ConfigField
            size="fill"
            omitLabel
            disabled={disabled}
            ariaLabel="DSA item name pattern"
            placeholder={activeOpt?.patternPlaceholder ?? '{labelText}'}
            value={spec.pattern ?? ''}
            onChange={onPatternChange}
          />
          <div className="computed-field-editor">
            <PlaceholderChips
              catalog={placeholderCatalog}
              disabled={disabled}
              catalogLabel="Columns"
              helpText="Click a column to insert it into the pattern."
              onInsert={handlePatternInsert}
            />
          </div>
        </ConfigDetailPanel>
      ) : null}
    </ConfigLabeledRow>
  );
}
