import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import HelpIconPopover from '../controls/HelpIconPopover';
import CsvReservedFieldCard from './CsvReservedFieldCard';
import {
  CSV_RESERVED_FIELD_SPECS,
  getCsvFieldAliases,
  normalizeCsvConfig,
} from '../../helpers/csv_column_config.js';

const CSV_IMPORT_HELP = (
  <>
    On import, SlideRelabeler matches your configured column names to special CSV fields. Mapped
    values override Output name and Slide label defaults when a row includes data. If a required
    column is missing, import pauses so you can pick the correct column. Any other CSV headers become
    file-table columns for use in patterns.
  </>
);

function hasAnyCsvAlternates(normalized) {
  return CSV_RESERVED_FIELD_SPECS.some(
    (spec) => getCsvFieldAliases(normalized, spec.key).length > 0,
  );
}

export default function CsvImportSection({
  csvConfig,
  disabled = false,
}) {
  const dispatch = useDispatch();
  const normalized = normalizeCsvConfig(csvConfig);
  const hasAlternates = hasAnyCsvAlternates(normalized);
  const [mappingsExpanded, setMappingsExpanded] = useState(hasAlternates);
  const hadAlternatesRef = useRef(hasAlternates);

  useEffect(() => {
    if (hasAlternates) {
      setMappingsExpanded(true);
    } else if (hadAlternatesRef.current) {
      setMappingsExpanded(false);
    }
    hadAlternatesRef.current = hasAlternates;
  }, [hasAlternates]);

  function setAliases(fieldKey, aliases) {
    dispatch({
      type: config_actions.SET_CSV_RESERVED_ALIASES,
      payload: { fieldKey, aliases },
    });
  }

  function exportTemplate() {
    dispatch({ type: config_actions.EXPORT_SAMPLE_CSV_TEMPLATE });
  }

  const showMappings = hasAlternates || mappingsExpanded;

  return (
    <div className="data-loading-section__subsection csv-import-section" id="config-csv-import">
      <div className="data-loading-section__subsection-header">
        <h3 className="data-loading-section__subsection-title">CSV import</h3>
        <HelpIconPopover helpLabel="CSV import column mapping help" variant="onLight">
          {CSV_IMPORT_HELP}
        </HelpIconPopover>
      </div>

      <p className="csv-import-section__lead">
        SlideRelabeler can use data loaded from a CSV file to populate the table of WSI files. This is
        useful in multiple ways: for example, you can easily add files from multiple locations.
        Additionally, the CSV file can define output names, label text, and QR content for each file.
        Get started with a{' '}
        <button
          type="button"
          className="csv-import-section__template-link"
          disabled={disabled}
          onClick={exportTemplate}
        >
          template CSV file
        </button>{' '}
        you can save to the location of your choosing. If you have existing data in a CSV file that
        uses different header names, you can map them to the appropriate columns below.
      </p>

      {!showMappings && (
        <button
          type="button"
          className="csv-import-section__expand-mappings-btn"
          disabled={disabled}
          onClick={() => setMappingsExpanded(true)}
        >
          Define alternative column headers
        </button>
      )}

      {showMappings && (
        <div className="csv-import-section__mappings">
          {CSV_RESERVED_FIELD_SPECS.map((spec) => (
            <CsvReservedFieldCard
              key={spec.key}
              role={spec.role}
              helper={spec.helper}
              defaultHeader={spec.defaultHeader}
              required={spec.required}
              alternates={getCsvFieldAliases(normalized, spec.key)}
              disabled={disabled}
              onAlternatesChange={(nextAlternates) => setAliases(spec.key, nextAlternates)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
