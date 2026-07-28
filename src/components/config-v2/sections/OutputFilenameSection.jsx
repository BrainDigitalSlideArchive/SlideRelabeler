import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../actions/config';
import { OUTPUT_FILENAME_SOURCES } from '../../../helpers/output_filename';
import { getPatternPlaceholderCatalog } from '../../../helpers/pattern_engine.js';
import { selectPatternValidationFromState } from '../../../helpers/pattern_validation.js';
import { PlaceholderChips } from '../../config/ComputedFieldEditor';
import ConfigPreviewRowEditor from '../../config/ConfigPreviewRowEditor';
import { useConfigPreviewSandbox } from '../preview/ConfigPreviewSandbox';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigChoiceChips from '../primitives/ConfigChoiceChips';
import ConfigDetailPanel from '../primitives/ConfigDetailPanel';
import ConfigField from '../primitives/ConfigField';
import ConfigCallout from '../primitives/ConfigCallout';
import ConfigWarnText from '../primitives/ConfigWarnText';
import ConfigTestPreview from '../primitives/ConfigTestPreview';

const OUTPUT_NAME_HELP = (
  <>
    When a slide is loaded and an output name is not provided, you can choose to use a
    random unique ID (UUID), keep the original filename, or build a custom pattern using column
    values. If an output name is provided, for example from a CSV import or loading from an API,
    that value will be used instead.
  </>
);

const SOURCE_OPTIONS = [
  {
    value: 'uuid',
    label: 'Use a UUID (recommended for sharing)',
    helper: 'Assigns a random unique ID (UUID) as the Output name for each file.',
    detail: 'A UUID is a randomly generated unique identifier. Using one as the output name helps de-identify slides for sharing, since it carries no patient or specimen details. Each slide gets its own UUID when loaded, which you can use in various places if desired.',
  },
  {
    value: 'original',
    label: 'Keep original filename',
    helper: 'Use the source file\u2019s name unchanged.',
  },
  {
    value: 'pattern',
    label: 'Custom pattern',
    helper: 'Build the output name from placeholders and column values (e.g. deid_{uuid}).',
  },
];

const CHIP_OPTIONS = SOURCE_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
  helper: opt.helper,
}));

function renderSourceDetail(source) {
  if (source === 'uuid') {
    return SOURCE_OPTIONS.find((opt) => opt.value === 'uuid')?.detail;
  }
  if (source === 'original') {
    return (
      <>
        Keeps the source file&apos;s name. Use this when the file is already named appropriately for sharing. To add a prefix or suffix (e.g. deid-), use Custom pattern instead.
      </>
    );
  }
  return null;
}

/**
 * Output name — Phase 2c.
 * Recipe: Section → Panel → ChoiceChips → DetailPanel → TestPreview.
 */
export default function OutputFilenameSection() {
  const dispatch = useDispatch();
  const {
    enrichedConfig,
    filenameConfig,
    fileRows,
    fileCols,
    reservedColumns,
    hasLoadedFiles,
    controlsDisabled,
    activePreviewRow,
    recomputeNotice,
    triggerRecompute,
    onPreviewRowChange,
    loadPreviewFromFirstRow,
    resetPreviewRow,
  } = useConfigPreviewSandbox();

  const csvConfig = useSelector((state) => state.config.csv);
  const source = filenameConfig?.source || 'uuid';
  const pattern = filenameConfig?.pattern ?? '';
  const disabled = controlsDisabled;

  const placeholderCatalog = useMemo(
    () => getPatternPlaceholderCatalog({
      field: 'outputName',
      fileRows,
      fileCols,
      hasLoadedFiles,
      csvConfig,
    }),
    [fileRows, fileCols, hasLoadedFiles, csvConfig],
  );

  const patternValidationMessages = useMemo(
    () => selectPatternValidationFromState({
      config: enrichedConfig,
      file_rows: fileRows,
      file_cols: fileCols,
    }).messages,
    [enrichedConfig, fileRows, fileCols],
  );

  function setFilename(partial) {
    dispatch({ type: config_actions.SET_FILENAME_CONFIG, payload: partial });
    triggerRecompute();
  }

  function selectSource(nextSource) {
    if (!OUTPUT_FILENAME_SOURCES.includes(nextSource)) return;
    setFilename({ source: nextSource });
  }

  function handlePatternInsert(token) {
    setFilename({ source: 'pattern', pattern: `${pattern}${token}` });
  }

  return (
    <ConfigSection
      id="config-output-filename"
      title="Output name"
      description={(
        <>
          When the <strong>Output name</strong> column is empty for a loaded slide, how should it be filled in?
        </>
      )}
      help={OUTPUT_NAME_HELP}
      helpLabel="Output name defaults help"
    >
      <ConfigSectionPanel>
        {recomputeNotice ? (
          <ConfigCallout variant="tinted" role="note" className="cfg-callout--flush">
            {recomputeNotice}
          </ConfigCallout>
        ) : null}

        {patternValidationMessages.length > 0 ? (
          <div className="cfg-pattern-validation" role="alert">
            {patternValidationMessages.map((msg) => (
              <ConfigWarnText key={msg}>{msg}</ConfigWarnText>
            ))}
          </div>
        ) : null}

        <ConfigChoiceChips
          name="filename-source"
          value={source}
          options={CHIP_OPTIONS}
          disabled={disabled}
          ariaLabel="Output filename mode"
          onChange={selectSource}
        />

        <ConfigDetailPanel aria-live="polite">
          {source === 'pattern' ? (
            <>
              <div className="cfg-pattern-field">
                <span className="cfg-pattern-field__label">Pattern</span>
                <ConfigField
                  size="fill"
                  omitLabel
                  disabled={disabled}
                  ariaLabel="Output name pattern"
                  placeholder="{blockId}_{uuid}"
                  value={pattern}
                  onChange={(value) => setFilename({ source: 'pattern', pattern: value })}
                />
              </div>
              <div className="computed-field-editor">
                <PlaceholderChips
                  catalog={placeholderCatalog}
                  hasLoadedFiles={hasLoadedFiles}
                  disabled={disabled}
                  onInsert={handlePatternInsert}
                />
              </div>
            </>
          ) : (
            <p className="cfg-detail-panel__text">{renderSourceDetail(source)}</p>
          )}
        </ConfigDetailPanel>

        <ConfigTestPreview
          hint={(
            <>
              The highlighted <strong>Output name</strong> column shows what this file would be
              renamed to based on your selected option above.
            </>
          )}
          disabled={disabled}
          hasLoadedFiles={hasLoadedFiles}
          onLoadFromFirstRow={loadPreviewFromFirstRow}
          onResetToExample={resetPreviewRow}
        >
          <ConfigPreviewRowEditor
            previewRow={activePreviewRow}
            config={enrichedConfig}
            reservedColumns={reservedColumns}
            fileCols={fileCols}
            disabled={disabled}
            onRowChange={onPreviewRowChange}
            highlightColumnFields={['__reserved.rename']}
            variant="outputFilename"
          />
        </ConfigTestPreview>
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
