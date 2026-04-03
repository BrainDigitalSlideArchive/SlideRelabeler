import React from 'react';

import Checkbox from '../controls/checkbox/Checkbox';
import InputText from '../controls/input/InputText';
import Button from '../controls/button/Button';

import './GlobusAuthPanel.scss';

function GlobusAuthPanel(props) {
  const {
    mode,
    cliAvailable,
    authStatus,
    currentUser,
    authCheckPending,
    loginPending,
    loginUrl,
    accessCode,
    authorizationCodeInput,
    disableSslVerification,
    errorMessage,
    connectionWarning,
    busy,
    onLogin,
    onLogout,
    onCheckAuth,
    onSubmitCode,
    onAuthorizationCodeInputChange,
    onToggleSsl,
    // Dev-only toggles (test mode)
    verboseLogin,
    enablePyiDebug,
    showRawCliOutput,
    lastLoginDebug,
    onToggleVerboseLogin,
    onToggleEnablePyiDebug,
    onToggleShowRawCliOutput
  } = props;

  const isTest = mode === 'test';
  const isBusy = !!busy;

  const sslCheckbox = (
    <Checkbox
      label="Disable SSL Verification"
      helpVariant="onLight"
      checked={disableSslVerification || false}
      onClick={() => onToggleSsl(!disableSslVerification)}
      tooltip={
        <>
          <strong>When to use:</strong> Some corporate firewalls perform SSL/TLS inspection (they decrypt and
          re-encrypt traffic), which replaces the server&apos;s certificate with one signed by your organization.
          If your machine does not trust that certificate, verification fails and login may not work. Disabling
          verification is a workaround that reduces security. The better long-term approach is to work with your
          corporate IT to install the organization&apos;s root or intermediate CA certificate on your machine
          so that verification can remain enabled.
        </>
      }
    />
  );

  return (
    <div className="GlobusAuthPanel">
      <div className={"__config-control-section-title"}>Authentication</div>
      <div className={"__config-control-section-description"}>
        Login to Globus to authenticate for file transfers.
      </div>

      {!authStatus && <div className="GlobusAuthPanel__sslRow">{sslCheckbox}</div>}

      {authStatus ? (
        <div className="GlobusAuthPanel__authWithSsl">
          <div className="GlobusAuthPanel__authLeft">
            <div className="GlobusAuthPanel__card GlobusAuthPanel__card--white">
              <strong>Authenticated as:</strong> {currentUser}
            </div>

            <Button
              text="Logout"
              onClick={onLogout}
              disabled={isBusy}
              extra_class_name="_align-center"
            />
          </div>
          <div className="GlobusAuthPanel__authRight">
            <div className="GlobusAuthPanel__sslRow GlobusAuthPanel__sslRow--authAside">{sslCheckbox}</div>
          </div>
        </div>
      ) : (
        <div>
          {authCheckPending ? (
            <div className="GlobusAuthPanel__card GlobusAuthPanel__card--info">
              <strong>Checking credentials…</strong>
              <p>
                Verifying authentication status. Please wait.
              </p>
            </div>
          ) : loginPending ? (
            <div className="GlobusAuthPanel__card GlobusAuthPanel__card--info">
              {loginUrl ? (
                <div className="GlobusAuthPanel__actions">
                  <span className="GlobusAuthPanel__stepTitle">Step 1: Visit this URL:</span>
                  <div className="GlobusAuthPanel__urlBox">
                    {loginUrl}
                  </div>
                  <div className="GlobusAuthPanel__actions">
                    <Button
                      text="Copy URL"
                      onClick={() => navigator.clipboard.writeText(loginUrl)}
                      extra_class_name="_align-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="GlobusAuthPanel__warnBox">
                  <strong>Warning:</strong> Login is pending but no URL was received. Please try logging in again.
                </div>
              )}

              {accessCode && (
                <div className="GlobusAuthPanel__actions GlobusAuthPanel__actions--tight">
                  <span className="GlobusAuthPanel__stepTitle">Step 2: Enter this access code in your browser:</span>
                  <div className="GlobusAuthPanel__codeBox">
                    {accessCode}
                  </div>
                  <div className="GlobusAuthPanel__actions">
                    <Button
                      text="Copy Code"
                      onClick={() => navigator.clipboard.writeText(accessCode)}
                      extra_class_name="_align-center"
                    />
                  </div>
                </div>
              )}

              <div className="GlobusAuthPanel__hint">
                After completing authentication in your browser, you will receive an authorization code. Enter that code below.
              </div>

              <div className="GlobusAuthPanel__actions GlobusAuthPanel__actions--tight">
                <InputText
                  variant="onLight"
                  label="Authorization Code (from browser)"
                  value={authorizationCodeInput || ''}
                  onChange={(new_value) => onAuthorizationCodeInputChange(new_value)}
                  placeholder="Enter the authorization code shown in your browser"
                  disabled={isBusy}
                />
                <Button
                  text="Submit Code"
                  onClick={onSubmitCode}
                  extra_class_name="_align-center"
                  disabled={isBusy || !authorizationCodeInput || !authorizationCodeInput.trim()}
                />
                <div className="GlobusAuthPanel__hint GlobusAuthPanel__hint--center">
                  Or click &quot;Check Auth Status&quot; if you&apos;ve already submitted the code.
                </div>
                <Button
                  text="Check Auth Status"
                  onClick={onCheckAuth}
                  extra_class_name="_align-center"
                  disabled={isBusy}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="GlobusAuthPanel__card GlobusAuthPanel__card--muted">
                Not authenticated
              </div>

              <Button
                text="Login"
                onClick={onLogin}
                disabled={isBusy || !cliAvailable || authCheckPending}
                extra_class_name="_align-center"
              />

              <p className="GlobusAuthPanel__hint GlobusAuthPanel__hint--login">
                Clicking Login will open your browser for OAuth2 authentication.
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && !authCheckPending && (
        <div className="GlobusAuthPanel__errorBox">
          <strong>{errorMessage.includes('Error:') ? '' : 'Message: '}</strong>{errorMessage}
        </div>
      )}

      {connectionWarning && (
        <div className="GlobusAuthPanel__connectionWarn">
          <strong>Note:</strong> Connection warning detected.
        </div>
      )}

      {isTest && (
        <div className="GlobusAuthPanel__testCard">
          <div className="GlobusAuthPanel__actions GlobusAuthPanel__actions--tight">
            <Checkbox
              label="Verbose login (-v)"
              checked={verboseLogin}
              onClick={onToggleVerboseLogin}
            />
            <Checkbox
              label="Enable PyInstaller debug"
              checked={enablePyiDebug}
              onClick={onToggleEnablePyiDebug}
            />
            <Checkbox
              label="Show raw CLI output"
              checked={showRawCliOutput}
              onClick={onToggleShowRawCliOutput}
            />

            {showRawCliOutput && lastLoginDebug && (
              <div className="GlobusAuthPanel__actions GlobusAuthPanel__actions--tight">
                <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>Last login result (raw)</div>
                <pre className="GlobusAuthPanel__pre">
                  {JSON.stringify(lastLoginDebug, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobusAuthPanel;
