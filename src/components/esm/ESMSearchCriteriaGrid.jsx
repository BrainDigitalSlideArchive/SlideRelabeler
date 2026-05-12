import React, { useCallback, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import { parseEsmSearchCriteriaCsv } from '../../helpers/esm_search_criteria_csv';
import InputText from '../controls/input/InputText';

import './ESMSearchCriteriaGrid.scss';

function hasAnyAccession(rows) {
  if (!Array.isArray(rows)) return false;
  return rows.some((r) => String(r?.accession ?? '').trim());
}

/**
 * Spreadsheet-style search criteria: accession, optional block, optional de-ID, optional stain.
 * Search runs one eSM query per distinct accession and merges results for staging.
 */
function ESMSearchCriteriaGrid({ authenticated, disableChanges, searchLoading, searchError }) {
  const dispatch = useDispatch();
  const searchRows = useSelector((s) => s.esm.searchRows);
  const rows = Array.isArray(searchRows) ? searchRows : [];

  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);

  const disabled = !authenticated || disableChanges || searchLoading;
  const canRemoveRow = rows.length > 1;
  const searchDisabled = !authenticated || !hasAnyAccession(rows) || disableChanges || searchLoading;

  const runSearch = useCallback(() => {
    if (authenticated && hasAnyAccession(rows)) {
      dispatch({ type: esm_actions.ESM_SEARCH_BATCH });
    }
  }, [authenticated, dispatch, rows]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && hasAnyAccession(rows) && authenticated && !searchLoading && !disableChanges) {
        runSearch();
      }
    },
    [authenticated, disableChanges, runSearch, rows, searchLoading]
  );

  const onPickCsv = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const onCsvSelected = (e) => {
    const file = e.target?.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseEsmSearchCriteriaCsv(text);
      if (parsed.ok) {
        setImportError(null);
        dispatch({ type: esm_actions.ESM_SET_SEARCH_ROWS, payload: parsed.rows });
      } else {
        setImportError(parsed.error || 'Import failed.');
      }
    };
    reader.onerror = () => setImportError('Could not read the file.');
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="esm-search-criteria">
      <div className="esm-search-criteria__panel">
        <div className="esm-search-criteria__panel-header">
          <span className="esm-search-criteria__panel-title">Search criteria</span>
          <div className="esm-search-criteria__panel-header-actions">
            <button
              type="button"
              className="esm-search-criteria__btn esm-search-criteria__btn--secondary"
              disabled={disabled}
              onClick={onPickCsv}
            >
              Import CSV…
            </button>
            <button
              type="button"
              className="esm-search-criteria__btn esm-search-criteria__btn--primary"
              disabled={searchDisabled}
              onClick={runSearch}
            >
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        <p className="esm-search-criteria__hint-panel">
          One row per specimen. Search loads every distinct accession, then each row filters by optional block and
          stain (see filename mapping for stain-regex when stain is left blank). Earlier rows win when the same slide
          matches multiple rows.
        </p>

        {importError && <div className="esm-search-criteria__import-error">{importError}</div>}

        <input
          ref={fileInputRef}
          type="file"
          className="esm-search-criteria__hidden-file"
          accept=".csv,text/csv"
          aria-hidden
          tabIndex={-1}
          onChange={onCsvSelected}
        />

        <div className="esm-search-criteria__table" role="group" aria-label="Search criteria table">
          <div className="esm-search-criteria__thead">
            <div className="esm-search-criteria__th">Accession</div>
            <div className="esm-search-criteria__th">Block (optional)</div>
            <div className="esm-search-criteria__th">De-identification (optional)</div>
            <div className="esm-search-criteria__th">Stain (optional)</div>
            <div className="esm-search-criteria__th esm-search-criteria__th--action" aria-hidden="true" />
          </div>
          <div
            className="esm-search-criteria__body-scroll"
            role="group"
            aria-label="Search criteria rows"
          >
            {rows.map((row, rowIndex) => (
              <div className="esm-search-criteria__data-row" key={row.id}>
                <div className="esm-search-criteria__cell">
                  <InputText
                    omitLabel
                    compact
                    variant="onLight"
                    ariaLabel={`Accession, row ${rowIndex + 1}`}
                    inputId={`esm-search-acc-${row.id}`}
                    disabled={disabled}
                    error={searchError && Boolean(String(row.accession ?? '').trim())}
                    value={row.accession}
                    onChange={(v) =>
                      dispatch({ type: esm_actions.ESM_UPDATE_SEARCH_ROW, payload: { id: row.id, accession: v } })
                    }
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="esm-search-criteria__cell">
                  <InputText
                    omitLabel
                    compact
                    variant="onLight"
                    ariaLabel={`Block, row ${rowIndex + 1}`}
                    inputId={`esm-search-block-${row.id}`}
                    disabled={disabled}
                    value={row.blockId}
                    onChange={(v) =>
                      dispatch({ type: esm_actions.ESM_UPDATE_SEARCH_ROW, payload: { id: row.id, blockId: v } })
                    }
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="esm-search-criteria__cell">
                  <InputText
                    omitLabel
                    compact
                    variant="onLight"
                    ariaLabel={`De-identification, row ${rowIndex + 1}`}
                    inputId={`esm-search-deid-${row.id}`}
                    disabled={disabled}
                    value={row.deid}
                    onChange={(v) =>
                      dispatch({ type: esm_actions.ESM_UPDATE_SEARCH_ROW, payload: { id: row.id, deid: v } })
                    }
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="esm-search-criteria__cell">
                  <InputText
                    omitLabel
                    compact
                    variant="onLight"
                    ariaLabel={`Stain, row ${rowIndex + 1}`}
                    inputId={`esm-search-stain-${row.id}`}
                    disabled={disabled}
                    value={row.stain}
                    onChange={(v) =>
                      dispatch({ type: esm_actions.ESM_UPDATE_SEARCH_ROW, payload: { id: row.id, stain: v } })
                    }
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="esm-search-criteria__cell esm-search-criteria__cell--action">
                  <button
                    type="button"
                    className="esm-search-criteria__btn-remove"
                    disabled={disabled || !canRemoveRow}
                    onClick={() => dispatch({ type: esm_actions.ESM_REMOVE_SEARCH_ROW, payload: row.id })}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="esm-search-criteria__panel-footer">
          <button
            type="button"
            className="esm-search-criteria__btn esm-search-criteria__btn--primary"
            disabled={disabled}
            onClick={() => dispatch({ type: esm_actions.ESM_ADD_SEARCH_ROW })}
          >
            Add row
          </button>
        </div>
      </div>
    </div>
  );
}

export default ESMSearchCriteriaGrid;
