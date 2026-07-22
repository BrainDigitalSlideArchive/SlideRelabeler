import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import { discoverPatternColumnFields } from '../../helpers/pattern_engine.js';
import { PlaceholderChips } from './ComputedFieldEditor';

const METADATA_OPTIONS = [
  {
    value: 'none',
    label: 'None (default)',
    helper: 'Do not attach file-table metadata to the Girder item.',
  },
  {
    value: 'all_deid',
    label: 'Data columns',
    helper:
      'All scalar file-table columns; excludes original path/filename. Does not include computed Label/Output name unless they are table columns.',
  },
  {
    value: 'all_original',
    label: 'Data + original name',
    helper:
      'Same as Data columns, plus original basename as originalFileName.',
  },
  {
    value: 'column',
    label: 'Single column…',
    helper:
      'Attach one column as a string, or parse JSON object/array from the cell.',
  },
];

/**
 * Compact Attach metadata chips for Configuration → Output delivery.
 * Renders as grid children of .dsa-after-upload__rows (label | chips | optional detail).
 */
export default function DsaItemMetadataEditor({
  dsaUploadConfig,
  disabled = false,
  fileRows = [],
  fileCols = [],
  csvConfig = {},
  hasLoadedFiles = false,
}) {
  const dispatch = useDispatch();
  const itemMetadata = dsaUploadConfig?.itemMetadata ?? { mode: 'none', column: '' };
  const active = itemMetadata.mode ?? 'none';
  const selectedColumn = itemMetadata.column ?? '';

  const columnCatalog = useMemo(() => {
    if (!hasLoadedFiles) return [];
    const fields = discoverPatternColumnFields({
      fileRows,
      fileCols,
      csvConfig,
    });
    return fields.map((field) => ({
      token: field,
      label: field,
      insertValue: field,
      kind: 'column',
    }));
  }, [fileRows, fileCols, csvConfig, hasLoadedFiles]);

  const setItemMetadata = useCallback(
    (partial) => {
      dispatch({
        type: config_actions.SET_DSA_UPLOAD_CONFIG,
        payload: {
          itemMetadata: {
            mode: itemMetadata.mode ?? 'none',
            column: itemMetadata.column ?? '',
            ...partial,
          },
        },
      });
    },
    [dispatch, itemMetadata.mode, itemMetadata.column],
  );

  const onSelect = useCallback(
    (value) => {
      setItemMetadata({ mode: value });
    },
    [setItemMetadata],
  );

  return (
    <>
      <span className="dsa-after-upload__row-label" id="dsa-item-metadata-label">
        Attach metadata:
      </span>
      <div className="dsa-after-upload__controls config-filename-style config-filename-style--compact">
        <div
          className="config-filename-style__modes config-filename-style__modes--compact"
          role="radiogroup"
          aria-labelledby="dsa-item-metadata-label"
        >
          {METADATA_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="config-filename-style__option"
              title={opt.helper}
            >
              <input
                type="radio"
                name="dsa-item-metadata-mode"
                disabled={disabled}
                checked={active === opt.value}
                onChange={() => onSelect(opt.value)}
              />
              <span className="config-filename-style__label">{opt.label}</span>
              <span className="config-filename-style__helper config-filename-style__helper--sr-only">
                {opt.helper}
              </span>
            </label>
          ))}
        </div>
      </div>

      {active === 'column' ? (
        <div className="dsa-after-upload__detail" aria-live="polite">
          <p className="dsa-after-upload__detail-text">
            {selectedColumn
              ? (
                <>
                  Selected column: <code>{selectedColumn}</code>
                </>
              )
              : 'Choose a column. Nothing is attached until a column is selected.'}
          </p>
          <div className="computed-field-editor">
            <PlaceholderChips
              catalog={columnCatalog}
              disabled={disabled || !hasLoadedFiles}
              catalogLabel="Columns"
              helpText="Click a column to attach its cell value (plain text or JSON)."
              onInsert={(field) => setItemMetadata({ mode: 'column', column: field })}
            />
          </div>
          {!hasLoadedFiles ? (
            <p className="dsa-after-upload__hint">Load files to list available columns.</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
