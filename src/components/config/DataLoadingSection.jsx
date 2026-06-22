import React from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import Button from '../controls/button/Button';
import HelpIconPopover from '../controls/HelpIconPopover';
import CsvColumnMappingField from './CsvColumnMappingField';

const DATA_LOADING_HELP = (
  <>
    Use this section when slide rows arrive from a spreadsheet instead of loading files one at a time.
    Enter the exact header names from your CSV (case-sensitive). If your file uses different labels,
    map them here—for example, set File path to <code>file location</code> when that column holds slide paths.
    Any other CSV columns are added to the file table as metadata for use in Output name and Label patterns.
  </>
);

const CSV_IMPORT_HELP = (
  <>
    On import, SlideRelabeler matches your configured header names to reserved file-table fields.
    Mapped values override the defaults set in Output name and Copy To when a row includes data.
    If a configured header is missing from your file, import pauses so you can pick the correct column.
    The downloadable template includes label and QR columns for reference; per-row import mapping for
    those fields is planned for a later release.
  </>
);

const TEMPLATE_HELPER = (
  <>
    Downloads a CSV with column headers SlideRelabeler expects for{' '}
    <strong>file path</strong>, <strong>output folder</strong>, <strong>output name</strong>,{' '}
    <strong>label</strong>, and <strong>QR content</strong>. Use it as a starting point for your
    import spreadsheet; adjust the header names above if your file uses different labels.
  </>
);

export default function DataLoadingSection({
  csvConfig,
  disabled = false,
}) {
  const dispatch = useDispatch();

  return (
    <section className="__config-control-section data-loading-section" id="config-data-loading">
      <div className="__config-control-section-title">Data loading</div>
      <div className="__config-control-section-description">
        How slide rows and metadata enter the file table before processing.
        {' '}
        <HelpIconPopover helpLabel="Data loading help" variant="onLight">
          {DATA_LOADING_HELP}
        </HelpIconPopover>
      </div>

      <div className="config-section-panel">
        <div className="data-loading-section__subsection csv-import-section" id="config-csv-import">
          <div className="data-loading-section__subsection-header">
            <h3 className="data-loading-section__subsection-title">CSV import</h3>
            <HelpIconPopover helpLabel="CSV import column mapping help" variant="onLight">
              {CSV_IMPORT_HELP}
            </HelpIconPopover>
          </div>

          <p className="csv-import-section__lead">
            Enter the <strong>exact header names</strong> from your CSV (case-sensitive).
          </p>

          <div className="csv-import-section__mappings">
            <CsvColumnMappingField
              label="File path"
              required
              helper="Which CSV column contains the slide file path. Used to load each row into the file table."
              value={csvConfig?.file_path_column}
              disabled={disabled}
              onChange={(value) => dispatch({
                type: config_actions.CHANGE_FILE_PATH_COLUMN,
                payload: value,
              })}
            />
            <CsvColumnMappingField
              label="Output name"
              helper="If present in a row, overrides Output name defaults above. Leave blank to ignore."
              value={csvConfig?.file_rename_column}
              disabled={disabled}
              onChange={(value) => dispatch({
                type: config_actions.CHANGE_FILE_RENAME_COLUMN,
                payload: value,
              })}
            />
            <CsvColumnMappingField
              label="Copy to folder"
              helper="Per-row output folder (Copy To column). Leave blank to use the app output directory."
              value={csvConfig?.file_destination_directory_column}
              disabled={disabled}
              onChange={(value) => dispatch({
                type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN,
                payload: value,
              })}
            />
          </div>

          <div className="csv-import-section__template">
            <Button
              text="Generate CSV template"
              disabled={disabled}
              onClick={() => dispatch({ type: config_actions.EXPORT_SAMPLE_CSV_TEMPLATE })}
            />
            <p className="csv-import-section__template-helper">{TEMPLATE_HELPER}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
