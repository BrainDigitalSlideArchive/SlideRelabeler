import React from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import InputText from '../controls/input/InputText';
import HelpIconPopover from '../controls/HelpIconPopover';
import { PlaceholderChips } from './ComputedFieldEditor';
import ConfigTestItOutSection from './ConfigTestItOutSection';
import ConfigPreviewRowEditor from './ConfigPreviewRowEditor';
import { OUTPUT_FILENAME_SOURCES } from '../../helpers/output_filename';

const OUTPUT_NAME_HELP = 'When a file is loaded directly from disk, or another method but a value for the desired output name is not provided, we need to define what the output should be named. You can choose to use a random UUID, keep the original filename, or build a custom pattern from placeholders and column values.';

const SOURCE_OPTIONS = [
  {
    value: 'uuid',
    label: 'Use a UUID (recommended for sharing)',
    helper: 'Assigns a random UUID as the output name for each file.',
    detail: 'A UUID is a randomly generated unique identifier. Using one as the output name helps deidentify slides for sharing, since it carries no patient or specimen information. Each file gets its own UUID when loaded.',
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

function renderSourceDetail(source) {
  if (source === 'uuid') {
    return SOURCE_OPTIONS.find((opt) => opt.value === 'uuid')?.detail;
  }
  if (source === 'original') {
    return (
      <>
        Keeps the source file&apos;s basename unchanged. Use this when the file has already been
        renamed to the desired deidentified name. To add a prefix or suffix (e.g.{' '}
        <code>deid-</code>), use <strong>Custom pattern</strong> instead.
      </>
    );
  }
  return null;
}

export default function OutputFilenameSection({
  config,
  filenameConfig,
  previewRow,
  disabled = false,
  hasLoadedFiles = false,
  reservedColumns = [],
  fileCols = [],
  onPreviewRowChange,
  onLoadPreviewFromFirstRow,
  onResetPreviewRow,
  onRecompute,
  recomputeNotice = null,
  placeholderCatalog = [],
  patternValidationMessages = [],
}) {
  const dispatch = useDispatch();
  const source = filenameConfig?.source || 'uuid';
  const pattern = filenameConfig?.pattern ?? '';

  function setFilename(partial) {
    dispatch({ type: config_actions.SET_FILENAME_CONFIG, payload: partial });
    if (onRecompute) onRecompute();
  }

  function selectSource(nextSource) {
    if (!OUTPUT_FILENAME_SOURCES.includes(nextSource)) return;
    setFilename({ source: nextSource });
  }

  function handlePatternInsert(token) {
    setFilename({ source: 'pattern', pattern: `${pattern}${token}` });
  }

  return (
    <section className="__config-control-section" id="config-output-filename">
      <div className="__config-control-section-title">Output name</div>
      <div className="__config-control-section-description">
        If the <strong>Output name</strong> column is empty when a file is loaded, how should we define it?
        {' '}
        <HelpIconPopover helpLabel="Output name defaults help" variant="onLight">
          {OUTPUT_NAME_HELP}
        </HelpIconPopover>
      </div>

      <div className="config-section-panel">
        {recomputeNotice && (
          <div className="config-recompute-notice" role="note">
            {recomputeNotice}
          </div>
        )}

        {patternValidationMessages.length > 0 && (
          <div className="config-pattern-validation" role="alert">
            {patternValidationMessages.map((msg) => (
              <div key={msg}>{msg}</div>
            ))}
          </div>
        )}

        <div className="output-filename-section">
        <div className="config-filename-style config-filename-style--compact">
          <div className="output-filename-section__modes-row">
            <div
              className="config-filename-style__modes config-filename-style__modes--compact"
              role="radiogroup"
              aria-label="Output filename mode"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="config-filename-style__option"
                  title={opt.helper}
                >
                  <input
                    type="radio"
                    name="filename-source"
                    disabled={disabled}
                    checked={source === opt.value}
                    onChange={() => selectSource(opt.value)}
                  />
                  <span className="config-filename-style__label">{opt.label}</span>
                  <span className="config-filename-style__helper config-filename-style__helper--sr-only">
                    {opt.helper}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="output-filename-section__detail" aria-live="polite">
            {source === 'pattern' ? (
              <>
                <div className="config-filename-field">
                  <span className="config-filename-field__label">Pattern</span>
                  <InputText
                    disabled={disabled}
                    omitLabel
                    variant="onLight"
                    ariaLabel="Output name pattern"
                    placeholder="{blockId}_{uuid}"
                    value={pattern}
                    onChange={(value) => setFilename({ source: 'pattern', pattern: value })}
                  />
                </div>
                <div className="computed-field-editor">
                  <PlaceholderChips
                    catalog={placeholderCatalog}
                    disabled={disabled}
                    onInsert={handlePatternInsert}
                  />
                </div>
              </>
            ) : (
              <p className="output-filename-section__detail-text">
                {renderSourceDetail(source)}
              </p>
            )}
          </div>
        </div>

        <ConfigTestItOutSection
          hint={(
            <>
              The highlighted <strong>Output name</strong> column shows what this file would be
              renamed to based on your selected option above.
            </>
          )}
          disabled={disabled}
          hasLoadedFiles={hasLoadedFiles}
          onLoadFromFirstRow={onLoadPreviewFromFirstRow}
          onResetToExample={onResetPreviewRow}
        >
          <ConfigPreviewRowEditor
            previewRow={previewRow}
            config={config}
            reservedColumns={reservedColumns}
            fileCols={fileCols}
            disabled={disabled}
            onRowChange={onPreviewRowChange}
            highlightColumnFields={['__reserved.rename']}
            variant="outputFilename"
          />
        </ConfigTestItOutSection>
        </div>
      </div>
    </section>
  );
}
