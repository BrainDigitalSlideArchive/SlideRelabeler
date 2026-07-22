import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../actions/config';
import * as globus_actions from '../../actions/globus';
import HelpIconPopover from '../controls/HelpIconPopover';
import Button from '../controls/button/Button';
import { openGlobusDurableEndpointPicker } from '../DeliveryPanel/GlobusEndpointChangeControl.jsx';

const DEFAULT_EP_HELP = (
  <>
    Default remote Globus collection used when Upload → Via Globus is enabled.
    The Delivery panel can override the endpoint for this session without changing this default.
  </>
);

/**
 * Durable default Globus destination endpoint (Configuration).
 */
export default function GlobusDefaultEndpointField({ disabled = false }) {
  const dispatch = useDispatch();
  const id = useSelector(
    (state) => state.config?.globus_upload?.default_target_endpoint_id || '',
  );
  const label = useSelector(
    (state) => state.config?.globus_upload?.default_target_endpoint_label || '',
  );
  const cliAvailable = useSelector((state) => state.globus?.cli_available);
  const hasDefault = Boolean(String(id || '').trim());
  const display = label || id;
  const cliMissing = cliAvailable === false;
  const pickerDisabled = disabled || cliMissing;

  useEffect(() => {
    let cancelled = false;
    async function ensureCliStatus() {
      if (cliAvailable != null) return;
      try {
        const response = await window.electronAPI.globusCheckCliAvailable();
        if (cancelled) return;
        dispatch({
          type: globus_actions.CHECK_CLI_AVAILABLE,
          payload: !!(response && response[0]),
        });
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: globus_actions.CHECK_CLI_AVAILABLE, payload: false });
      }
    }
    ensureCliStatus();
    return () => {
      cancelled = true;
    };
  }, [cliAvailable, dispatch]);

  function clearDefault() {
    dispatch({
      type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
      payload: {
        default_target_endpoint_id: '',
        default_target_endpoint_label: '',
      },
    });
  }

  return (
    <div className="output-delivery-section__dsa-url-field">
      <div className="output-delivery-section__dsa-url-label-row">
        <span className="output-delivery-section__dsa-url-label">
          Default destination endpoint
        </span>
        <HelpIconPopover helpLabel="Default Globus destination help" variant="onLight">
          {DEFAULT_EP_HELP}
        </HelpIconPopover>
      </div>
      {cliMissing ? (
        <p className="output-delivery-section__warn" role="status">
          Globus CLI is not available. Endpoint search is disabled until the CLI is installed.
        </p>
      ) : null}
      {hasDefault ? (
        <div className="output-delivery-section__inline-actions">
          <div className="output-delivery-section__path" title={`${display} (${id})`}>
            <i className="fi fi-rr-cloud-upload" aria-hidden="true" />
            <span className="output-delivery-section__path-text">
              {display}
              {id && display !== id ? ` (${id})` : ''}
            </span>
          </div>
          <Button
            variant="onLight"
            text="Change default…"
            disabled={pickerDisabled}
            onClick={() => openGlobusDurableEndpointPicker(dispatch)}
          />
          <button
            type="button"
            className={`output-delivery-section__text-btn${disabled ? ' _disabled' : ''}`}
            disabled={disabled}
            onClick={clearDefault}
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="output-delivery-section__inline-actions">
          <span className="output-delivery-section__inline-empty">
            No default endpoint configured.
          </span>
          <Button
            variant="onLight"
            text="Choose default…"
            disabled={pickerDisabled}
            onClick={() => openGlobusDurableEndpointPicker(dispatch)}
          />
        </div>
      )}
    </div>
  );
}
