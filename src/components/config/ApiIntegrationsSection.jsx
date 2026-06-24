import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import HelpIconPopover from '../controls/HelpIconPopover';
import EsmDataLoadingSection from './EsmDataLoadingSection';

const API_INTEGRATIONS_HELP = (
  <>
    Connect SlideRelabeler to external APIs for loading slides. Enable an integration to configure
    its connection and import rules here.
  </>
);

export default function ApiIntegrationsSection({ disabled = false }) {
  const dispatch = useDispatch();
  const esmEnabled = useSelector((state) => state.esm?.integrationEnabled !== false);

  return (
    <div
      className="data-loading-section__subsection api-integrations-section"
      id="config-api-integrations"
    >
      <div className="data-loading-section__subsection-header">
        <h3 className="data-loading-section__subsection-title">API Integrations</h3>
        <HelpIconPopover helpLabel="API integrations help" variant="onLight">
          {API_INTEGRATIONS_HELP}
        </HelpIconPopover>
      </div>

      <div className="api-integrations-section__controls config-filename-style config-filename-style--compact">
        <div className="api-integrations-section__row">
          <span className="api-integrations-section__row-label" id="esm-integration-enabled-label">
            eSlideManager:
          </span>
          <div
            className="config-filename-style__modes config-filename-style__modes--compact"
            role="radiogroup"
            aria-labelledby="esm-integration-enabled-label"
          >
            <label className="config-filename-style__option">
              <input
                type="radio"
                name="esm-integration-enabled"
                disabled={disabled}
                checked={esmEnabled}
                onChange={() => dispatch({
                  type: esm_actions.SET_ESM_INTEGRATION_ENABLED,
                  payload: true,
                })}
              />
              <span className="config-filename-style__label">Enabled</span>
            </label>
            <label className="config-filename-style__option">
              <input
                type="radio"
                name="esm-integration-enabled"
                disabled={disabled}
                checked={!esmEnabled}
                onChange={() => dispatch({
                  type: esm_actions.SET_ESM_INTEGRATION_ENABLED,
                  payload: false,
                })}
              />
              <span className="config-filename-style__label">Disabled</span>
            </label>
          </div>
        </div>
      </div>

      {esmEnabled && (
        <div className="api-integrations-section__esm-config">
          <EsmDataLoadingSection disabled={disabled} />
        </div>
      )}
    </div>
  );
}
