import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import ESMAgGrid from '../AgGrid/ESMAgGrid';

import './esm_light_panel.scss';

export default function ESMStagingPanel({ disabled = false }) {
  const dispatch = useDispatch();
  const selectedIds = useSelector((s) => s.esm.selectedIds);
  const slidesByAccession = useSelector((s) => s.esm.slidesByAccession);

  const hasStagingKeys =
    slidesByAccession && typeof slidesByAccession === 'object' && Object.keys(slidesByAccession).length > 0;
  const applySelectionDisabled =
    disabled || !hasStagingKeys || !Array.isArray(selectedIds) || selectedIds.length === 0;

  return (
    <div className="esm-staging-panel">
      <div className="esm-light-panel__card">
        <div className="esm-light-panel__card-header">Staging results</div>
        <p className="esm-light-panel__hint">
          Use the table filters to narrow rows, then use the header checkbox to select all visible rows. Add selected
          slides to the main file list when ready.
        </p>

        <div className="esm-light-panel__actions-row">
          <button
            type="button"
            className="esm-light-panel__btn esm-light-panel__btn--primary"
            disabled={applySelectionDisabled}
            onClick={() => dispatch({ type: esm_actions.ESM_APPLY_SELECTION })}
          >
            {`Add selected (${selectedIds?.length || 0}) to file list`}
          </button>
          <button
            type="button"
            className="esm-light-panel__btn esm-light-panel__btn--secondary"
            disabled={disabled}
            onClick={() => dispatch({ type: esm_actions.ESM_CLEAR_RESULTS })}
          >
            Clear results
          </button>
        </div>

        <div className="esm-staging-panel__grid-wrap">
          <ESMAgGrid
            autoSizeStrategy={{ type: 'fitCellContents' }}
            suppressMovableColumns={true}
            ensureDomOrder={true}
            suppressDragLeaveHidesColumns={true}
            enableCellTextSelection={true}
          />
        </div>
      </div>
    </div>
  );
}
