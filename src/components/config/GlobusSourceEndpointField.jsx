import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../actions/config';
import {
  GLOBUS_LS_FAILURE_KIND,
  interpretGlobusCliFailure,
} from '../../helpers/globus_error_interpretation.js';
import { isGlobusEndpointUuid } from '../../helpers/globus_helpers';
import HelpIconPopover from '../controls/HelpIconPopover';
import Button from '../controls/button/Button';
import InputText from '../controls/input/InputText';

function formatDetectError(raw) {
  const interpreted = interpretGlobusCliFailure(raw);
  if (interpreted.kind === GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE) {
    return `${interpreted.userSummary} ${interpreted.userDetail}`.trim();
  }
  if (interpreted.userDetail) {
    return `${interpreted.userSummary} ${interpreted.userDetail}`.trim();
  }
  return interpreted.userSummary || String(raw || 'Could not read the local endpoint ID.');
}

const SOURCE_HELP = (
  <>
    Globus Connect Personal endpoint UUID for this machine — not a display name.
    De-identified files are read from here during upload. Use Auto-detect to run{' '}
    <code>globus endpoint local-id</code> for the current user.
  </>
);

/**
 * Durable local GCP endpoint ID for Globus uploads (Configuration).
 */
export default function GlobusSourceEndpointField({ disabled = false }) {
  const dispatch = useDispatch();
  const sourceEndpoint = useSelector(
    (state) => state.config?.globus_upload?.source_endpoint || '',
  );
  const cliAvailable = useSelector((state) => state.globus?.cli_available);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);

  const invalid = sourceEndpoint.trim().length > 0 && !isGlobusEndpointUuid(sourceEndpoint.trim());

  function setSource(value) {
    setDetectError(null);
    dispatch({
      type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
      payload: { source_endpoint: value },
    });
  }

  async function detectLocalEndpoint() {
    setDetectError(null);
    if (cliAvailable === false) {
      setDetectError(
        'Globus CLI is not available. Install Globus CLI (globus-cli) or use a packaged build.',
      );
      return;
    }
    setDetecting(true);
    try {
      const response = await window.electronAPI.globusGetLocalEndpointId();
      if (!response || !response[0]) {
        setDetectError(
          formatDetectError(
            response?.[1]?.message || 'Could not read the local Globus Connect Personal endpoint ID.',
          ),
        );
        return;
      }
      const id = response[1]?.id ? String(response[1].id).trim() : '';
      if (!id) {
        setDetectError('No endpoint ID was returned.');
        return;
      }
      setSource(id);
    } catch (e) {
      setDetectError(formatDetectError(e));
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="output-delivery-section__dsa-url-field">
      <div className="output-delivery-section__dsa-url-label-row">
        <span className="output-delivery-section__dsa-url-label">
          This computer&apos;s Globus endpoint ID
        </span>
        <HelpIconPopover helpLabel="Local Globus endpoint help" variant="onLight">
          {SOURCE_HELP}
        </HelpIconPopover>
      </div>
      <div className="output-delivery-section__dsa-url-input-row">
        <InputText
          omitLabel
          ariaLabel="This computer's Globus endpoint ID"
          value={sourceEndpoint}
          disabled={disabled}
          error={invalid}
          placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          compact
          variant="onLight"
          onChange={setSource}
        />
        <Button
          variant="onLight"
          text={detecting ? 'Detecting…' : 'Auto-detect local ID'}
          disabled={disabled || detecting || cliAvailable === false}
          onClick={detectLocalEndpoint}
        />
      </div>
      {detectError ? (
        <p className="output-delivery-section__warn" role="alert">{detectError}</p>
      ) : null}
      {invalid ? (
        <p className="output-delivery-section__warn" role="alert">
          Enter a valid Globus endpoint UUID.
        </p>
      ) : null}
    </div>
  );
}
