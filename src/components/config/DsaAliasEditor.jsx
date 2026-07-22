import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import InputText from '../controls/input/InputText';
import { PlaceholderChips } from './ComputedFieldEditor';

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

function selectedItemNameMode(dsaUploadConfig) {
  if (!dsaUploadConfig?.rename_item_after_upload) return 'file';
  const mode = dsaUploadConfig?.dsaAlias?.mode;
  if (mode === 'pattern') return 'pattern';
  if (mode === 'label_text') return 'label_text';
  return 'file';
}

/**
 * Compact Item name chips for Configuration → Output delivery.
 * Renders as grid children of .dsa-after-upload__rows (label | chips | optional detail).
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
    <>
      <span className="dsa-after-upload__row-label" id="dsa-item-name-label">
        Item name:
      </span>
      <div className="dsa-after-upload__controls config-filename-style config-filename-style--compact">
        <div
          className="config-filename-style__modes config-filename-style__modes--compact"
          role="radiogroup"
          aria-labelledby="dsa-item-name-label"
        >
          {ITEM_NAME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="config-filename-style__option"
              title={opt.helper}
            >
              <input
                type="radio"
                name="dsa-item-name-mode"
                disabled={disabled}
                checked={active === opt.value}
                onChange={() => applySelection(opt.value)}
              />
              <span className="config-filename-style__label">{opt.label}</span>
              <span className="config-filename-style__helper config-filename-style__helper--sr-only">
                {opt.helper}
              </span>
            </label>
          ))}
        </div>
      </div>

      {active === 'pattern' ? (
        <div className="dsa-after-upload__detail" aria-live="polite">
          <p className="dsa-after-upload__detail-label">
            Values from one or more columns can be used by including the column name within curly
            brackets
          </p>
          <InputText
            disabled={disabled}
            omitLabel
            variant="onLight"
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
        </div>
      ) : null}
    </>
  );
}
