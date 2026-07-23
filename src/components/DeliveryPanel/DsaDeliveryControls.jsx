import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as dsa_actions from '../../actions/dsa';
import * as modal_actions from '../../actions/modal';
import { formatDsaBaseUrl } from '../../helpers/dsa_url.js';
import GridHoverTooltip from '../AgGrid/GridHoverTooltip';
import { openConfigSettings } from '../config-v2/ConfigV2Nav';
import DsaUrlChangeControl from './DsaUrlChangeControl.jsx';

import './upload-delivery.scss';

export default function DsaDeliveryControls({ disabled = false }) {
  const dispatch = useDispatch();
  const dsa = useSelector((state) => state.dsa);
  const {
    api_url,
    api_auth,
    username,
    password,
    login_error,
    login_error_message,
    folder_id,
    folder_path,
    dsa_folder_exists,
    dsa_folder_error_message,
  } = dsa;

  const hasUrl = Boolean(String(api_url || '').trim());
  const loggedIn = Boolean(api_auth?.authToken);
  const baseUrl = formatDsaBaseUrl(api_url);
  const hasFolder = Boolean(String(folder_id || '').trim());
  const pathDisplay = folder_path || folder_id || '';
  const folderInvalid = dsa_folder_exists === false;

  function openFolderPicker() {
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'dsaFolderPicker' } });
  }

  function login() {
    dispatch({ type: dsa_actions.LOGIN });
  }

  function openSettings() {
    openConfigSettings(dispatch, 'config-dsa-upload');
  }

  if (!hasUrl) {
    return (
      <div className="upload-delivery">
        <p className="upload-delivery__status">DSA server not configured</p>
        <button
          type="button"
          className={`delivery-panel__button${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          Set up DSA…
        </button>
        <div className="upload-delivery__url-row">
          <DsaUrlChangeControl disabled={disabled} currentUrl="" />
          <span className="upload-delivery__url-hint">Or set a temporary URL</span>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="upload-delivery">
        <div className="upload-delivery__url-row">
          <DsaUrlChangeControl
            disabled={disabled}
            currentUrl={api_url}
            showHostInline
            hostLabel={baseUrl || api_url}
            hostTitle={api_url}
          />
        </div>
        <div className="upload-delivery__login-row">
          <input
            type="text"
            className="upload-delivery__input"
            placeholder="Username"
            aria-label="DSA username"
            autoComplete="username"
            disabled={disabled}
            value={username || ''}
            onChange={(e) => dispatch({ type: dsa_actions.SET_DSA_USERNAME, payload: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && username && password) login();
            }}
          />
          <input
            type="password"
            className="upload-delivery__input"
            placeholder="Password"
            aria-label="DSA password"
            autoComplete="current-password"
            disabled={disabled}
            value={password || ''}
            onChange={(e) => dispatch({ type: dsa_actions.SET_DSA_PASSWORD, payload: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && username && password) login();
            }}
          />
          <button
            type="button"
            className={`delivery-panel__button upload-delivery__login-btn${disabled ? ' _disabled' : ''}`}
            disabled={disabled || !username || !password}
            onClick={login}
          >
            Login
          </button>
        </div>
        {login_error ? (
          <p className="upload-delivery__error">{login_error_message || 'Login failed'}</p>
        ) : null}
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          DSA settings…
        </button>
      </div>
    );
  }

  return (
    <div className="upload-delivery">
      <div className="upload-delivery__session">
        <div className="upload-delivery__identity" title={`${username} @ ${baseUrl || api_url}`}>
          <span className="upload-delivery__user">{username}</span>
          <span className="upload-delivery__sep">·</span>
          <DsaUrlChangeControl
            disabled={disabled}
            currentUrl={api_url}
            showHostInline
            hostLabel={baseUrl || api_url}
            hostTitle={api_url}
          />
        </div>
        <GridHoverTooltip content="Sign out" show="always" placement="below">
          <button
            type="button"
            className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
            aria-label="Sign out of DSA"
            disabled={disabled}
            onClick={() => dispatch({ type: dsa_actions.LOGOUT })}
          >
            <i className="fi fi-rr-sign-out-alt" aria-hidden="true" />
          </button>
        </GridHoverTooltip>
      </div>

      {folderInvalid ? (
        <p className="upload-delivery__error">
          {dsa_folder_error_message || 'DSA folder was not found or is not accessible.'}
        </p>
      ) : null}

      {hasFolder && !folderInvalid ? (
        <div className="upload-delivery__dest-row">
          <div className="delivery-panel__path" title={pathDisplay}>
            <i className="fi fi-rr-folder delivery-panel__path-icon" aria-hidden="true" />
            <span className="delivery-panel__path-text">{pathDisplay}</span>
          </div>
          <GridHoverTooltip content="Change folder" show="always" placement="below">
            <button
              type="button"
              className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
              aria-label="Change DSA folder"
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
        {hasFolder && !folderInvalid ? (
          <span className="upload-delivery__ready">Ready</span>
        ) : null}
        <button
          type="button"
          className={`upload-delivery__text-btn${disabled ? ' _disabled' : ''}`}
          disabled={disabled}
          onClick={openSettings}
        >
          DSA settings…
        </button>
      </div>
    </div>
  );
}
