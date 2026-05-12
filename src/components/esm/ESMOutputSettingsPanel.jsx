import React from 'react';

import ESMFilenameMappingPanel from './ESMFilenameMappingPanel';
import ESMTransformRulesEditor from './ESMTransformRulesEditor';

import './esm_light_panel.scss';

/**
 * Single light card: filename mapping + transform rules (configure before search).
 */
export default function ESMOutputSettingsPanel({ disabled = false }) {
  return (
    <div className="esm-output-settings">
      <div className="esm-light-panel__card esm-output-settings__card">
        <p className="esm-light-panel__hint">
          Set these options before you search. They apply to the staging preview and to files added from eSM.
        </p>

        <ESMFilenameMappingPanel disabled={disabled} />

        <hr className="esm-light-panel__divider" aria-hidden="true" />

        <ESMTransformRulesEditor disabled={disabled} />
      </div>
    </div>
  );
}
