import React from 'react';

import GridHoverTooltip from '../AgGrid/GridHoverTooltip';

import './esm_portal.scss';

const CONFIGURE_TOOLTIP = 'Create and manage profiles in Configuration.';

export default function ESMLoginCard({
  profiles = [],
  activeProfileId,
  username,
  password,
  rememberUsername,
  authenticated,
  profileSwitchOpen,
  sameHostAsOrigin,
  loading,
  error,
  errorMessage,
  requestBase,
  disabled = false,
  onProfileChange,
  onUsernameChange,
  onPasswordChange,
  onRememberChange,
  onSignIn,
  onConfirmSwitch,
  onCancelSwitch,
  onOpenConfig,
  onPasswordKeyPress,
}) {
  const hasProfiles = profiles.length > 0;
  const showSameHostSwitch = profileSwitchOpen && authenticated && sameHostAsOrigin;
  const showCredentials = !showSameHostSwitch && hasProfiles;
  const showRememberMe = !profileSwitchOpen;
  const canSignIn = Boolean(
    requestBase
    && username !== ''
    && password !== ''
    && !loading
    && !disabled
    && showCredentials
    && !showSameHostSwitch,
  );
  const canConfirmSwitch = Boolean(
    hasProfiles
    && !disabled
    && !loading
    && showSameHostSwitch,
  );

  return (
    <div className="esm-login-card">
      <div className="esm-login-card__header">
        <h2 className="esm-login-card__title">
          {profileSwitchOpen ? 'Switch profile' : 'Sign in'}
        </h2>
        {profileSwitchOpen && authenticated ? (
          <button
            type="button"
            className="esm-login-card__cancel"
            disabled={disabled || loading}
            onClick={onCancelSwitch}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="esm-login-card__error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {hasProfiles ? (
        <div className="esm-login-card__profile-row">
          <select
            id="esm-active-profile"
            className="esm-login-card__select"
            aria-label="Profile"
            disabled={disabled || loading}
            value={activeProfileId ?? ''}
            onChange={onProfileChange}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <GridHoverTooltip
            content={CONFIGURE_TOOLTIP}
            show="always"
            placement="below"
            className="esm-login-card__gear-wrap"
          >
            <button
              type="button"
              className="esm-icon-btn esm-login-card__gear"
              aria-label={CONFIGURE_TOOLTIP}
              disabled={disabled}
              onClick={onOpenConfig}
            >
              <i className="fi fi-rr-settings" aria-hidden="true" />
            </button>
          </GridHoverTooltip>
        </div>
      ) : (
        <p className="esm-login-card__empty">
          No profiles configured.
        </p>
      )}

      {!hasProfiles ? (
        <GridHoverTooltip content={CONFIGURE_TOOLTIP} show="always" placement="below">
          <button
            type="button"
            className="esm-login-card__submit"
            onClick={onOpenConfig}
          >
            Open Configuration
          </button>
        </GridHoverTooltip>
      ) : null}

      {showSameHostSwitch ? (
        <>
          <p className="esm-login-card__already-in">You are already logged in.</p>
          <button
            type="button"
            className="esm-login-card__submit"
            disabled={!canConfirmSwitch}
            onClick={onConfirmSwitch}
          >
            Switch to this profile
          </button>
        </>
      ) : null}

      {showCredentials && !showSameHostSwitch ? (
        <>
          <div className="esm-login-card__fields">
            <div className="esm-login-card__field">
              <label className="esm-login-card__label" htmlFor="esm-login-username">
                Username
              </label>
              <input
                id="esm-login-username"
                className="esm-login-card__input"
                type="text"
                autoComplete="username"
                disabled={disabled || loading}
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                onKeyPress={onPasswordKeyPress}
              />
            </div>
            <div className="esm-login-card__field">
              <label className="esm-login-card__label" htmlFor="esm-login-password">
                Password
              </label>
              <input
                id="esm-login-password"
                className={error ? 'esm-login-card__input _error' : 'esm-login-card__input'}
                type="password"
                autoComplete="current-password"
                disabled={disabled || loading}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onKeyPress={onPasswordKeyPress}
              />
            </div>
            {showRememberMe ? (
              <label className="esm-login-card__remember">
                <input
                  type="checkbox"
                  disabled={disabled || loading}
                  checked={rememberUsername}
                  onChange={onRememberChange}
                />
                Remember me
              </label>
            ) : null}
          </div>
          <button
            type="button"
            className="esm-login-card__submit"
            disabled={!canSignIn}
            onClick={onSignIn}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </>
      ) : null}
    </div>
  );
}
