import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import Checkbox from '../controls/checkbox/Checkbox';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';
import AssemblyBuildControls from './AssemblyBuildControls';
import {
  OUTPUT_FILENAME_SOURCES,
  resolveOutputBasename,
  applyFilenameAffixes,
} from '../../helpers/output_filename';

const SOURCE_OPTIONS = [
  {
    value: 'original',
    label: 'Keep original filename',
    helper: 'Use the source file\u2019s basename unchanged.',
  },
  {
    value: 'uuid',
    label: 'Use a UUID (recommended for sharing)',
    helper: 'Assigns a random UUID as the output basename for each file.',
  },
  {
    value: 'column',
    label: 'Use one column',
    helper:
      'Works with CSV imports and other imported metadata. Pick the column that holds the desired output name.',
  },
  {
    value: 'computed',
    label: 'Compute from multiple columns',
    helper: 'Combine slide fields (CSV or imported metadata) into one basename.',
  },
];

export default function OutputFilenameSection({
  config,
  filenameConfig,
  assemblyConfig,
  columnOptions = [],
  activePreviewRow,
  disabled = false,
  exampleFilename = '1234.tiff',
  exampleExt = 'tiff',
  exampleUuid = 'acde070d-8c4c-4f0d-9d8a-162843c10333',
  onRecompute,
}) {
  const dispatch = useDispatch();
  const source = filenameConfig?.source || 'uuid';

  const outputBasename = useMemo(
    () => resolveOutputBasename(activePreviewRow, config),
    [activePreviewRow, config],
  );

  const savedFilenameStem = useMemo(
    () => applyFilenameAffixes(outputBasename, config),
    [outputBasename, config],
  );

  const columnItem = filenameConfig?.column
    ? columnOptions.find((o) => o.value === filenameConfig.column) || {
        label: filenameConfig.column,
        value: filenameConfig.column,
      }
    : null;

  function setFilename(partial) {
    dispatch({ type: config_actions.SET_FILENAME_CONFIG, payload: partial });
    if (onRecompute) onRecompute();
  }

  function setAssembly(partial) {
    dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
    if (onRecompute) onRecompute();
  }

  function selectSource(nextSource) {
    if (!OUTPUT_FILENAME_SOURCES.includes(nextSource)) return;
    setFilename({ source: nextSource });
  }

  return (
    <section className="__config-control-section config-guided-section" id="config-output-filename">
      <div className="__config-control-section-title">Output filename</div>
      <div className="__config-control-section-description">
        Choose how each saved file is named on disk. Optional prefix and suffix apply to all modes.
        Does not change the slide label.
      </div>

      <div className="config-filename-style">
        <div className="config-filename-style__modes" role="radiogroup" aria-label="Output filename mode">
          {SOURCE_OPTIONS.map((opt) => (
            <label key={opt.value} className="config-filename-style__option">
              <input
                type="radio"
                name="filename-source"
                disabled={disabled}
                checked={source === opt.value}
                onChange={() => selectSource(opt.value)}
              />
              <span className="config-filename-style__label">{opt.label}</span>
              <span className="config-filename-style__helper">{opt.helper}</span>
            </label>
          ))}
        </div>

        {source === 'column' && (
          <div className="config-filename-style__panel">
            <div className="config-filename-style__column-fields">
              <div className="config-filename-field">
                <span className="config-filename-field__label" id="config-filename-column-label">
                  Column from loaded data
                </span>
                <Dropdown
                  disabled={disabled}
                  items={columnOptions}
                  omitLabel
                  width="100%"
                  ariaLabel="Column from loaded data"
                  placeholder="Select column"
                  selectedItems={columnItem ? [columnItem] : []}
                  onSelect={(item) => setFilename({ source: 'column', column: item.value })}
                />
              </div>
              {columnOptions.length === 0 && (
                <p className="config-filename-sources" role="note">
                  Load files to populate this list from your data, or type a column header below.
                </p>
              )}
              <div className="config-filename-field">
                <label className="config-filename-field__label" htmlFor="config-filename-column-text">
                  Or type column header
                </label>
                <InputText
                  disabled={disabled}
                  omitLabel
                  variant="onLight"
                  inputId="config-filename-column-text"
                  ariaLabel="Or type column header"
                  placeholder="e.g. output_name"
                  value={filenameConfig?.column || ''}
                  onChange={(value) => setFilename({ source: 'column', column: value })}
                />
              </div>
            </div>
          </div>
        )}

        {source === 'computed' && (
          <div className="config-filename-style__panel">
            <div className="__config-control-subsection-title">Build name from metadata columns</div>
            <AssemblyBuildControls
              assembly={assemblyConfig}
              disabled={disabled}
              columnOptions={columnOptions}
              sampleRow={activePreviewRow}
              onAssemblyChange={setAssembly}
              compact
            />
          </div>
        )}

        <div className="config-filename-style__affixes">
          <div className="config-filename-style__affix-row">
            <Checkbox
              disabled={disabled}
              label="Add prefix"
              checked={filenameConfig?.use_prefix}
              onClick={() => setFilename({ use_prefix: !filenameConfig?.use_prefix })}
            />
            <InputText
              disabled={disabled || !filenameConfig?.use_prefix}
              omitLabel
              variant="onLight"
              ariaLabel="Prefix text"
              placeholder="deid_"
              value={filenameConfig?.prefix || ''}
              onChange={(value) => dispatch({ type: config_actions.CHANGE_PREFIX, payload: value })}
            />
          </div>
          <div className="config-filename-style__affix-row">
            <Checkbox
              disabled={disabled}
              label="Add suffix"
              checked={filenameConfig?.use_suffix}
              onClick={() => setFilename({ use_suffix: !filenameConfig?.use_suffix })}
            />
            <InputText
              disabled={disabled || !filenameConfig?.use_suffix}
              omitLabel
              variant="onLight"
              ariaLabel="Suffix text"
              placeholder="_deid"
              value={filenameConfig?.suffix || ''}
              onChange={(value) => dispatch({ type: config_actions.CHANGE_SUFFIX, payload: value })}
            />
          </div>
        </div>
      </div>

      <div className="config-filename-preview">
        <div className="config-filename-preview__title">Example for one file</div>
        <dl className="config-filename-preview__grid">
          <div className="config-filename-preview__cell">
            <dt className="config-filename-preview__label">Original file</dt>
            <dd className="config-filename-preview__value">{exampleFilename}</dd>
          </div>
          <div className="config-filename-preview__cell">
            <dt className="config-filename-preview__label">Output basename</dt>
            <dd className="config-filename-preview__value">{outputBasename || '(empty)'}</dd>
          </div>
          <div className="config-filename-preview__cell">
            <dt className="config-filename-preview__label">Saved filename</dt>
            <dd className="config-filename-preview__value">
              {savedFilenameStem || '(empty)'}.{exampleExt}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
