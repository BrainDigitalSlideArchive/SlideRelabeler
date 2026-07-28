import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import * as globus_actions from '../../../../actions/globus';
import {
  GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND,
  interpretGlobusLocalEndpointFailure,
} from '../../../../helpers/globus_error_interpretation.js';
import { isGlobusEndpointUuid } from '../../../../helpers/globus_helpers';
import { openGlobusLogin } from '../../../../helpers/globus_login_modal.js';
import HelpIconPopover from '../../../controls/HelpIconPopover';
import Button from '../../../controls/button/Button';
import ConfigField from '../../primitives/ConfigField';
import ConfigStatusField from '../../primitives/ConfigStatusField';
import ConfigTextButton from '../../primitives/ConfigTextButton';
import ConfigWarnText from '../../primitives/ConfigWarnText';
import {
  GlobusCliUnavailableMessage,
  GlobusGcpUnavailableMessage,
  GlobusLocalEndpointUnsetMessage,
} from './globus_cli_copy.jsx';

function formatDetectError(raw) {
  const interpreted = interpretGlobusLocalEndpointFailure(raw);
  if (interpreted.kind === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.CLI_UNAVAILABLE) {
    return <GlobusCliUnavailableMessage />;
  }
  if (
    interpreted.kind === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.GCP_UNAVAILABLE
    || interpreted.kind === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.INVALID_RESPONSE
  ) {
    return <GlobusGcpUnavailableMessage />;
  }
  if (interpreted.userDetail) {
    return `${interpreted.userSummary} ${interpreted.userDetail}`.trim();
  }
  return interpreted.userSummary || String(raw?.message || raw || 'Could not read the local endpoint ID.');
}

const SOURCE_HELP = (
  <>
    The Globus Connect Personal endpoint ID for this computer (a UUID, not a display name).
    De-identified files are read from here during upload. Use Auto-detect to look it up with Globus
    tools for the current user.
  </>
);

/**
 * Durable local GCP endpoint ID for Globus uploads (config-v2 kit).
 */
export default function GlobusSourceEndpointField({ disabled = false }) {
  const dispatch = useDispatch();
  const store = useStore();
  const sourceEndpoint = useSelector(
    (state) => state.config?.globus_upload?.source_endpoint || '',
  );
  const cliAvailable = useSelector((state) => state.globus?.cli_available);
  const apiAuth = useSelector((state) => state.globus?.api_auth);
  const authCheckPending = useSelector((state) => state.globus?.auth_check_pending);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);

  const sourceTrimmed = sourceEndpoint.trim();
  const invalid = sourceTrimmed.length > 0 && !isGlobusEndpointUuid(sourceTrimmed);
  const sourceEmpty = !sourceTrimmed;
  const cliMissing = cliAvailable === false;
  const authChecked = cliAvailable === true && !authCheckPending;
  const needsLogin = authChecked && !apiAuth;
  const autoDetectDisabled =
    disabled || detecting || cliMissing || needsLogin || (cliAvailable === true && authCheckPending);

  useEffect(() => {
    let cancelled = false;
    async function checkCliAndAuth() {
      try {
        const response = await window.electronAPI.globusCheckCliAvailable();
        if (cancelled) return;
        const available = !!(response && response[0]);
        dispatch({ type: globus_actions.CHECK_CLI_AVAILABLE, payload: available });

        if (available) {
          const state = store.getState();
          const disableSsl = !!state?.globus?.disable_ssl_verification;
          try {
            await window.electronAPI.globusSetSslVerification(disableSsl);
          } catch (e) {
            // best-effort
          }
          dispatch({ type: globus_actions.SET_AUTH_CHECK_PENDING, payload: true });
          dispatch({ type: globus_actions.CHECK_AUTH });
        }
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: globus_actions.CHECK_CLI_AVAILABLE, payload: false });
      }
    }
    checkCliAndAuth();
    return () => {
      cancelled = true;
    };
  }, [dispatch, store]);

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
      setDetectError(<GlobusCliUnavailableMessage />);
      return;
    }
    if (!apiAuth) {
      setDetectError(
        formatDetectError({
          code: 'login_required',
          message: 'Sign in to Globus before Auto-detect can read this computer’s endpoint ID.',
        }),
      );
      return;
    }
    setDetecting(true);
    try {
      const response = await window.electronAPI.globusGetLocalEndpointId();
      if (!response || !response[0]) {
        setDetectError(formatDetectError(response?.[1] || {
          message: 'Could not read the local Globus Connect Personal endpoint ID.',
        }));
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

  let standingStatus = null;
  if (cliMissing) {
    standingStatus = (
      <ConfigWarnText role="status">
        <GlobusCliUnavailableMessage trailing=". Auto-detect is disabled until they are installed." />
      </ConfigWarnText>
    );
  } else if (needsLogin) {
    standingStatus = (
      <ConfigWarnText role="status">
        Sign in to Globus before Auto-detect can read this computer’s endpoint ID.{' '}
        <ConfigTextButton
          onClick={() => openGlobusLogin(dispatch, store.getState)}
          disabled={disabled}
        >
          Sign in
        </ConfigTextButton>
      </ConfigWarnText>
    );
  } else if (authChecked && sourceEmpty && !detectError) {
    standingStatus = (
      <ConfigWarnText role="status">
        <GlobusLocalEndpointUnsetMessage />
      </ConfigWarnText>
    );
  }

  return (
    <div>
      <ConfigStatusField
        label={(
          <>
            This computer&apos;s Globus endpoint ID
            <HelpIconPopover helpLabel="Local Globus endpoint help" variant="onLight">
              {SOURCE_HELP}
            </HelpIconPopover>
          </>
        )}
        action={(
          <Button
            variant="onLight"
            text={detecting ? 'Detecting…' : 'Auto-detect local ID'}
            disabled={autoDetectDisabled}
            onClick={detectLocalEndpoint}
          />
        )}
      >
        <ConfigField
          size="fill"
          omitLabel
          ariaLabel="This computer's Globus endpoint ID"
          value={sourceEndpoint}
          disabled={disabled}
          error={invalid}
          placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          onChange={setSource}
        />
      </ConfigStatusField>
      {standingStatus}
      {detectError ? (
        <ConfigWarnText role="alert">{detectError}</ConfigWarnText>
      ) : null}
      {invalid ? (
        <ConfigWarnText role="alert">Enter a valid Globus endpoint ID (UUID).</ConfigWarnText>
      ) : null}
    </div>
  );
}
