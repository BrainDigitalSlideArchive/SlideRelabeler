import React from 'react';

import Button from '../controls/button/Button';
import InputText from '../controls/input/InputText';

import './GlobusLoginFlow.scss';

/**
 * Shared Globus OAuth UI (browser URL + authorization code).
 * Used by ModalGlobusLogin; callers own Redux wiring.
 */
export default function GlobusLoginFlow({
  disabled = false,
  cliAvailable = null,
  authCheckPending = false,
  loginPending = false,
  loginUrl = null,
  accessCode = null,
  authorizationCodeInput = '',
  errorMessage = null,
  onLogin,
  onCheckAuth,
  onSubmitCode,
  onAuthorizationCodeInputChange,
  onCancel,
}) {
  const isBusy = !!authCheckPending;
  const cliMissing = cliAvailable === false;
  const canLogin = !disabled && !isBusy && !cliMissing;

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(String(text || ''));
    } catch (e) {
      // best-effort
    }
  }

  function openLoginUrl() {
    if (!loginUrl) return;
    try {
      window.open(loginUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // best-effort
    }
  }

  if (cliMissing) {
    return (
      <div className="globus-login-flow">
        <div className="globus-login-flow__error" role="alert">
          Globus CLI is not available. Install Globus CLI (globus-cli) or use a packaged build,
          then try again.
        </div>
        {onCancel ? (
          <div className="globus-login-flow__footer">
            <button
              type="button"
              className="globus-login-flow__text-btn"
              disabled={disabled}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (authCheckPending && !loginPending) {
    return (
      <div className="globus-login-flow">
        <p className="globus-login-flow__status">Starting Globus login…</p>
      </div>
    );
  }

  if (loginPending) {
    return (
      <div className="globus-login-flow">
        <p className="globus-login-flow__step">Waiting for browser…</p>
        {loginUrl ? (
          <p className="globus-login-flow__hint">
            Finish sign-in in your browser, then paste the authorization code below.
          </p>
        ) : (
          <div className="globus-login-flow__error" role="alert">
            Login pending but no URL was received. Try Login again.
          </div>
        )}

        {loginUrl ? (
          <div className="globus-login-flow__primary-row">
            <Button
              variant="onLight"
              extra_class_name="Button--filled"
              text="Open browser"
              disabled={disabled}
              onClick={openLoginUrl}
            />
            <div className="globus-login-flow__quiet-links">
              <button
                type="button"
                className="globus-login-flow__text-btn"
                disabled={disabled}
                onClick={() => copyText(loginUrl)}
              >
                Copy URL
              </button>
              {accessCode ? (
                <button
                  type="button"
                  className="globus-login-flow__text-btn"
                  disabled={disabled}
                  onClick={() => copyText(accessCode)}
                >
                  Copy access code
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="globus-login-flow__code-row">
          <InputText
            omitLabel
            variant="onLight"
            inputId="globus-login-authorization-code"
            ariaLabel="Authorization code from browser"
            placeholder="Authorization code"
            disabled={disabled || isBusy}
            value={authorizationCodeInput || ''}
            onChange={(value) => onAuthorizationCodeInputChange?.(value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && authorizationCodeInput?.trim()) onSubmitCode?.();
            }}
          />
          <Button
            variant="onLight"
            extra_class_name="Button--filled"
            text="Submit"
            disabled={disabled || isBusy || !authorizationCodeInput?.trim()}
            onClick={onSubmitCode}
          />
        </div>

        <div className="globus-login-flow__footer">
          <button
            type="button"
            className="globus-login-flow__text-btn"
            disabled={disabled || isBusy}
            onClick={onCheckAuth}
          >
            Check status
          </button>
          {onCancel ? (
            <button
              type="button"
              className="globus-login-flow__text-btn"
              disabled={disabled}
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="globus-login-flow__error" role="alert">
            {errorMessage}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="globus-login-flow">
      <p className="globus-login-flow__hint">
        A browser window will open to finish Globus sign-in.
      </p>
      <div className="globus-login-flow__primary-row">
        <Button
          variant="onLight"
          extra_class_name="Button--filled"
          text={isBusy ? 'Starting…' : 'Login with Globus'}
          disabled={!canLogin}
          onClick={onLogin}
        />
        {onCancel ? (
          <button
            type="button"
            className="globus-login-flow__text-btn"
            disabled={disabled}
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <div className="globus-login-flow__error" role="alert">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
