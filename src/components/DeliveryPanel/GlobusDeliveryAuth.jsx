import React from 'react';
import { useDispatch, useStore } from 'react-redux';

import { openGlobusLogin } from '../../helpers/globus_login_modal.js';

/**
 * Compact Globus auth strip for the Delivery panel.
 * Opens the shared Globus login modal for the full OAuth flow.
 */
export default function GlobusDeliveryAuth({
  disabled = false,
  cliAvailable = null,
  authCheckPending = false,
  loginPending = false,
  errorMessage = null,
}) {
  const dispatch = useDispatch();
  const store = useStore();
  const isBusy = !!authCheckPending && !loginPending;
  const canOpen = !disabled && !isBusy && cliAvailable !== false;

  function openLogin() {
    openGlobusLogin(dispatch, store.getState);
  }

  if (isBusy) {
    return <p className="upload-delivery__status">Checking credentials…</p>;
  }

  return (
    <div className="upload-delivery__oauth">
      <div className="upload-delivery__login-row">
        <span className="upload-delivery__status">
          {loginPending ? 'Login in progress…' : 'Not signed in'}
        </span>
        <button
          type="button"
          className={`delivery-panel__button upload-delivery__login-btn${
            disabled || !canOpen ? ' _disabled' : ''
          }`}
          disabled={!canOpen}
          onClick={openLogin}
        >
          {loginPending ? 'Continue login…' : 'Login'}
        </button>
      </div>
      {errorMessage ? (
        <p className="upload-delivery__error">{errorMessage}</p>
      ) : null}
    </div>
  );
}
