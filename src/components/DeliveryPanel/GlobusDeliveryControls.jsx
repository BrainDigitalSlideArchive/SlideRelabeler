import React, { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import * as globus_actions from '../../actions/globus';
import * as modal_actions from '../../actions/modal';
import {
  displayPathWithoutEndpointUuid,
  isGlobusEndpointUuid,
} from '../../helpers/globus_helpers';
import GridHoverTooltip from '../AgGrid/GridHoverTooltip';
import { openConfigSettings } from '../config-v2/ConfigV2Nav';
import GlobusDeliveryAuth from './GlobusDeliveryAuth.jsx';
import GlobusEndpointChangeControl, {
  openGlobusSessionEndpointPicker,
} from './GlobusEndpointChangeControl.jsx';

import './upload-delivery.scss';

export default function GlobusDeliveryControls({ disabled = false }) {
  const dispatch = useDispatch();
  const store = useStore();
  const globus = useSelector((state) => state.globus);
  const {
    api_auth,
    source_endpoint,
    target_endpoint_id,
    target_endpoint_label,
    collection_path,
    globus_collection_exists,
    globus_collection_error_message,
    cli_available,
    login_error,
    login_error_message,
    login_pending,
    auth_check_pending,
  } = globus;

  // Populate cli_available and auth status (same light preflight as setup content).
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

  const loggedIn = Boolean(api_auth);
  const sourceTrimmed = String(source_endpoint || '').trim();
  const sourceMissing = !sourceTrimmed;
  const sourceInvalid = sourceTrimmed.length > 0 && !isGlobusEndpointUuid(sourceTrimmed);
  const hasTarget = Boolean(String(target_endpoint_id || '').trim());
  const hasPath = Boolean(String(collection_path || '').trim());
  const pathInvalid = globus_collection_exists === false;
  const pathDisplay =
    displayPathWithoutEndpointUuid(collection_path) || collection_path || '';
  const endpointLabel =
    target_endpoint_label || target_endpoint_id || '';
  const userLabel =
    api_auth?.username || api_auth?.sub || api_auth?.id || 'Authenticated';

  function openSettings() {
    openConfigSettings(dispatch, 'config-globus-upload');
  }

  function openFolderPicker() {
    dispatch({
      type: modal_actions.TOGGLE_MODAL,
      payload: { type: 'globusFolderPicker' },
    });
  }

  if (cli_available === false) {
    return (
      <div className="upload-delivery">
        <p className="upload-delivery__status">
          Globus CLI is not available. Install it or use a packaged build.
        </p>
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          Globus settings…
        </button>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="upload-delivery">
        <GlobusDeliveryAuth
          disabled={disabled}
          cliAvailable={cli_available}
          authCheckPending={auth_check_pending}
          loginPending={login_pending}
          errorMessage={login_error ? login_error_message : null}
        />
        {login_error && /ssl|certificate|tls/i.test(String(login_error_message || '')) ? (
          <p className="upload-delivery__error">
            SSL/certificate problem?{' '}
            <button
              type="button"
              className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
              disabled={disabled}
              onClick={openSettings}
            >
              Check Disable SSL Verification in Globus settings
            </button>
          </p>
        ) : null}
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          Globus settings…
        </button>
      </div>
    );
  }

  if (sourceMissing || sourceInvalid) {
    return (
      <div className="upload-delivery">
        <div className="upload-delivery__session">
          <div className="upload-delivery__identity" title={userLabel}>
            <span className="upload-delivery__user">{userLabel}</span>
          </div>
          <GridHoverTooltip content="Sign out" show="always" placement="below">
            <button
              type="button"
              className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
              aria-label="Sign out of Globus"
              disabled={disabled}
              onClick={() => dispatch({ type: globus_actions.LOGOUT })}
            >
              <i className="fi fi-rr-sign-out-alt" aria-hidden="true" />
            </button>
          </GridHoverTooltip>
        </div>
        <GridHoverTooltip
          content="This computer’s Globus Connect Personal endpoint UUID is set in Configuration → Output delivery."
          show="always"
          placement="below"
        >
          <p className="upload-delivery__error">
            {sourceInvalid
              ? 'Local Globus endpoint ID is not a valid UUID.'
              : 'Local Globus Connect Personal endpoint ID is not set.'}
          </p>
        </GridHoverTooltip>
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          Globus settings…
        </button>
      </div>
    );
  }

  if (!hasTarget) {
    return (
      <div className="upload-delivery">
        <div className="upload-delivery__session">
          <div className="upload-delivery__identity" title={userLabel}>
            <span className="upload-delivery__user">{userLabel}</span>
          </div>
          <GridHoverTooltip content="Sign out" show="always" placement="below">
            <button
              type="button"
              className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
              aria-label="Sign out of Globus"
              disabled={disabled}
              onClick={() => dispatch({ type: globus_actions.LOGOUT })}
            >
              <i className="fi fi-rr-sign-out-alt" aria-hidden="true" />
            </button>
          </GridHoverTooltip>
        </div>
        <button
          type="button"
          className={`delivery-panel__button${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={() => openGlobusSessionEndpointPicker(dispatch)}
        >
          Choose destination…
        </button>
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          Globus settings…
        </button>
      </div>
    );
  }

  return (
    <div className="upload-delivery">
      <div className="upload-delivery__session">
        <div className="upload-delivery__identity" title={`${userLabel} · ${endpointLabel}`}>
          <span className="upload-delivery__user">{userLabel}</span>
          <span className="upload-delivery__sep">·</span>
          <GlobusEndpointChangeControl
            disabled={disabled}
            showHostInline
            hostLabel={endpointLabel}
            hostTitle={target_endpoint_id}
          />
        </div>
        <GridHoverTooltip content="Sign out" show="always" placement="below">
          <button
            type="button"
            className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
            aria-label="Sign out of Globus"
            disabled={disabled}
            onClick={() => dispatch({ type: globus_actions.LOGOUT })}
          >
            <i className="fi fi-rr-sign-out-alt" aria-hidden="true" />
          </button>
        </GridHoverTooltip>
      </div>

      {pathInvalid ? (
        <p className="upload-delivery__error">
          {globus_collection_error_message ||
            'Globus folder was not found or is not accessible.'}
        </p>
      ) : null}

      {hasPath && !pathInvalid ? (
        <div className="upload-delivery__dest-row">
          <div className="delivery-panel__path" title={collection_path}>
            <i className="fi fi-rr-folder delivery-panel__path-icon" aria-hidden="true" />
            <span className="delivery-panel__path-text">{pathDisplay}</span>
          </div>
          <GridHoverTooltip content="Change folder" show="always" placement="below">
            <button
              type="button"
              className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
              aria-label="Change Globus folder"
              disabled={disabled}
              onClick={openFolderPicker}
            >
              <i className="fi fi-rr-arrows-repeat" aria-hidden="true" />
            </button>
          </GridHoverTooltip>
        </div>
      ) : (
        <button
          type="button"
          className={`delivery-panel__button${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openFolderPicker}
        >
          Choose folder…
        </button>
      )}

      <div className="upload-delivery__footer">
        {hasPath && !pathInvalid ? (
          <span className="upload-delivery__ready">Ready</span>
        ) : null}
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          Globus settings…
        </button>
      </div>
    </div>
  );
}
