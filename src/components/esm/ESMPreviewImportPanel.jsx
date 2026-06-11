import React from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import * as modal_actions from '../../actions/modal';
import Button from '../controls/button/Button';

import './esm_light_panel.scss';

/**
 * eSM preview panel: assembled names come from global Configuration.
 */
export default function ESMPreviewImportPanel({ disabled = false }) {
  const dispatch = useDispatch();

  function openAssemblyConfig() {
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'config' } });
  }

  function useAssembledNameForLabel() {
    dispatch({ type: config_actions.USE_ASSEMBLED_NAME_FOR_LABEL });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  return (
    <section className="esm-preview-import-panel" aria-labelledby="esm-preview-import-title">
      <h3 id="esm-preview-import-title" className="esm-light-panel__subsection-title">
        Preview import names
      </h3>
      <p className="esm-light-panel__hint">
        Assembled names use <strong>Configuration → Assembled name</strong>. Search below; the staging table shows the
        result before adding slides.
      </p>
      <div className="esm-light-panel__actions-row">
        <button
          type="button"
          className="esm-light-panel__btn esm-light-panel__btn--secondary"
          disabled={disabled}
          onClick={openAssemblyConfig}
        >
          Edit assembly rules in Configuration…
        </button>
        <Button
          disabled={disabled}
          text="Use assembled name for label text"
          onClick={useAssembledNameForLabel}
        />
      </div>
    </section>
  );
}
