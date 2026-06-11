import React from 'react';

import ESMPreviewImportPanel from './ESMPreviewImportPanel';
import ESMStainFilterPanel from './ESMStainFilterPanel';
import ESMTransformRulesEditor from './ESMTransformRulesEditor';

import './esm_light_panel.scss';

/**
 * Transform rules + stain filter (assembly rules in Configuration).
 */
export default function ESMOutputSettingsPanel({ disabled = false }) {
  return (
    <div className="esm-output-settings">
      <div className="esm-light-panel__card esm-output-settings__card">
        <ESMPreviewImportPanel disabled={disabled} />

        <hr className="esm-light-panel__divider" aria-hidden="true" />

        <ESMStainFilterPanel disabled={disabled} />

        <hr className="esm-light-panel__divider" aria-hidden="true" />

        <ESMTransformRulesEditor disabled={disabled} />
      </div>
    </div>
  );
}
