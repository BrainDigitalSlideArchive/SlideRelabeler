import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import { discoverPatternColumnFields } from '../../../../helpers/pattern_engine.js';
import { PlaceholderChips } from '../../../config/ComputedFieldEditor';
import ConfigChoiceChips from '../../primitives/ConfigChoiceChips';
import ConfigDetailPanel from '../../primitives/ConfigDetailPanel';
import ConfigHelperText from '../../primitives/ConfigHelperText';
import ConfigLabeledRow from '../../primitives/ConfigLabeledRow';

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

const CHIP_OPTIONS = METADATA_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
  helper: opt.helper,
}));

/**
 * DSA attach-metadata chips + optional column detail (config-v2 kit).
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

  return (
    <ConfigLabeledRow
      label="Attach metadata:"
      labelId="dsa-item-metadata-label-v2"
    >
      <ConfigChoiceChips
        name="dsa-item-metadata-mode-v2"
        value={active}
        options={CHIP_OPTIONS}
        disabled={disabled}
        ariaLabelledBy="dsa-item-metadata-label-v2"
        onChange={(value) => setItemMetadata({ mode: value })}
      />
      {active === 'column' ? (
        <ConfigDetailPanel aria-live="polite">
          <ConfigHelperText>
            {selectedColumn
              ? (
                <>
                  Selected column: <code>{selectedColumn}</code>
                </>
              )
              : 'Choose a column. Nothing is attached until a column is selected.'}
          </ConfigHelperText>
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
            <ConfigHelperText>Load files to list available columns.</ConfigHelperText>
          ) : null}
        </ConfigDetailPanel>
      ) : null}
    </ConfigLabeledRow>
  );
}
