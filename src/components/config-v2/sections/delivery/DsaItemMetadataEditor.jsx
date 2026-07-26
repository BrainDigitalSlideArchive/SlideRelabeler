import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import { discoverPatternColumnFields } from '../../../../helpers/pattern_engine.js';
import { PlaceholderChips } from '../../../config/ComputedFieldEditor';
import ConfigChoiceChips from '../../primitives/ConfigChoiceChips';
import ConfigDetailPanel from '../../primitives/ConfigDetailPanel';
import ConfigField from '../../primitives/ConfigField';
import ConfigHelperText from '../../primitives/ConfigHelperText';
import ConfigLabeledRow from '../../primitives/ConfigLabeledRow';

const METADATA_OPTIONS = [
  {
    value: 'none',
    label: 'None (default)',
    helper: 'Nothing from the file list is added to the DSA item.',
  },
  {
    value: 'all_deid',
    label: 'Data columns',
    helper:
      'Add every simple text and number column from the file list (skips original path and filename).',
  },
  {
    value: 'all_original',
    label: 'Data + original name',
    helper: 'Same as Data columns, and also add the original file name.',
  },
  {
    value: 'column',
    label: 'Single column…',
    helper:
      "Add one column's value—plain text, or JSON from the cell if it is an object or array.",
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
  const activeHelper =
    METADATA_OPTIONS.find((opt) => opt.value === active)?.helper
    ?? METADATA_OPTIONS[0].helper;

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
      <ConfigHelperText>{activeHelper}</ConfigHelperText>
      {active === 'column' ? (
        <ConfigDetailPanel aria-live="polite">
          {!selectedColumn.trim() ? (
            <ConfigHelperText>
              Nothing is attached until a column name is entered.
            </ConfigHelperText>
          ) : null}
          <ConfigField
            size="fill"
            omitLabel
            disabled={disabled}
            ariaLabel="Column name"
            placeholder="columnName"
            value={selectedColumn}
            onChange={(value) => setItemMetadata({ column: value })}
          />
          {columnCatalog.length > 0 ? (
            <div className="computed-field-editor">
              <PlaceholderChips
                catalog={columnCatalog}
                disabled={disabled}
                catalogLabel="Columns"
                helpText="Click a column to use its name."
                onInsert={(field) => setItemMetadata({ mode: 'column', column: field })}
              />
            </div>
          ) : (
            <ConfigHelperText>
              When files are loaded, you can pick a column from a list here.
            </ConfigHelperText>
          )}
        </ConfigDetailPanel>
      ) : null}
    </ConfigLabeledRow>
  );
}
