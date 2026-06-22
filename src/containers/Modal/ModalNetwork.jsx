import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch, useStore } from "react-redux";

import * as dsa_actions from "../../actions/dsa";
import * as globus_actions from "../../actions/globus";
import * as upload_routing_actions from "../../actions/uploadRouting";
import * as config_actions from "../../actions/config";
import { selectUploadReadiness } from "../../selectors/uploadRouting";
import { getPatternPlaceholderCatalog } from '../../helpers/pattern_engine.js';

import ModalHeader from './ModalHeader';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import InputText from '../../components/controls/input/InputText';
import Dropdown from '../../components/controls/dropdown/Dropdown';
import Button from '../../components/controls/button/Button';
import {
  isGlobusEndpointUuid,
  isGlobusEndpointRootPath,
  displayPathWithoutEndpointUuid,
} from "../../helpers/globus_helpers";
import GlobusAuthPanel from '../../components/globus/GlobusAuthPanel';
import GlobusTargetTree from '../../components/globus/GlobusTargetTree';
import GlobusUploadPathEditPopover from '../../components/globus/GlobusUploadPathEditPopover';
import DsaAliasEditor from '../../components/config/DsaAliasEditor';

import './ModalNetwork.scss';

const AUTO_UPLOAD_MODE_ITEMS = [
  { label: 'Off', value: 'off' },
  { label: 'Globus', value: 'globus' },
  { label: 'DSA', value: 'dsa' },
];

function render_network_config_dsa_content(dispatch, dsa, dsa_upload, extras = {}) {
  const { folder_id, username, password, api_url, api_auth, login_error, login_error_message, dsa_folder_exists, dsa_folder_error_message } = dsa;
  const uploadOpts = dsa_upload || {};
  const { placeholderCatalog = [], onRecompute, dsaAliasPreview } = extras;

  let expiration_date = null;
  if (api_auth) {
    expiration_date = new Date(api_auth.authToken.expires);
  }

  function dsa_folder_exists_style(dsa_folder_exists) {
    if (dsa_folder_exists === null) {
      return {};
    } else if (dsa_folder_exists) {
      return {borderColor: 'green', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'green'};
    } else {
      return {borderColor: 'red', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'red'};
    }
  }

  return (
    <>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>DSA</div>
            <div className={"__config-control-section-description"}>
              Configure the DSA connection for transfering deidentified files to the DSA.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <InputText disabled={api_auth} error={login_error} label={"API URL"} value={api_url ? api_url : ''} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_API_URL, payload: new_value })} />
                <InputText disabled={api_auth} error={login_error} label={"Username"} value={username ? username : ''} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_USERNAME, payload: new_value })} />
                <InputText disabled={api_auth} error={login_error} type={"password"} label={"Password"} value={password ? password : ''} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_PASSWORD, payload: new_value })} />
                {
                  !api_auth ?
                    <Button extra_class_name={"_align-center"} disabled={!(username !== '' && password !== '' && !api_auth)} text={"Login"} onClick={() => dispatch({ type: dsa_actions.LOGIN, payload: { api_url, username, password } })} /> :
                    <Button extra_class_name={"_align-center"} disabled={!(username !== '' && password !== '' && api_auth)} text={"Logout"} onClick={() => dispatch({ type: dsa_actions.LOGOUT })} />
                }
                {
                  login_error && <div className={"__config-control-section-error"}>{login_error_message}</div>
                }
              </div>
              <div className={"__config-control-section-dsa-subgroup"}>
                {
                  api_auth &&
                  <div className={"__dsa-auth-group"}>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        API URL:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {api_url}
                      </div>
                    </div>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        Username:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {username}
                      </div>
                    </div>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        Expiration:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {expiration_date.toString()}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>DSA folder</div>
            <div className={"__config-control-section-description"}>
              Folder ID used when DSA is the auto-upload destination.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <InputText tooltip={dsa_folder_error_message? dsa_folder_error_message : null} input_style={dsa_folder_exists_style(dsa_folder_exists)} label={"DSA folder ID"} value={folder_id} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_FOLDER_ID, payload: new_value })} />
              </div>
            </div>
            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>After upload (optional)</div>
            <div className={"__config-control-section-description"}>
              Uploaded files keep their system file ID name on the server. These options affect the Girder item display name and metadata.
            </div>
            <Checkbox
              label="Set catalog display name after upload"
              checked={!!uploadOpts.rename_item_after_upload}
              onClick={() => dispatch({
                type: config_actions.SET_DSA_UPLOAD_CONFIG,
                payload: { rename_item_after_upload: !uploadOpts.rename_item_after_upload },
              })}
            />
            <div className="__config-control-subsection-note-description">
              Uses the DSA alias (+ file extension) from each row when rename is enabled below.
            </div>
            <DsaAliasEditor
              dsaUploadConfig={uploadOpts}
              disabled={false}
              placeholderCatalog={placeholderCatalog}
              previewValue={dsaAliasPreview}
              onRecompute={onRecompute}
            />
            <Checkbox
              label="Attach deidUpload metadata to DSA item"
              checked={!!uploadOpts.set_item_metadata}
              onClick={() => dispatch({
                type: config_actions.SET_DSA_UPLOAD_CONFIG,
                payload: { set_item_metadata: !uploadOpts.set_item_metadata },
              })}
            />
          </div>
        </div>
    </>
  )
}

function render_network_config_globus_content(dispatch, globus, globusUi) {
  const {
    collection_name,
    collection_path,
    source_endpoint,
    target_endpoint_id,
    target_endpoint_label,
    remember_target_endpoint,
    api_auth,
    login_error,
    login_error_message,
    login_url,
    access_code,
    login_pending,
    auth_check_pending,
    authorization_code_input,
    globus_collection_exists,
    globus_collection_error_message,
    globus_collection_error_detail,
    globus_collection_error_technical,
    cli_available,
    disable_ssl_verification,
    globus_directory_refresh_nonce
  } = globus;
  const {
    searchingEndpoints,
    endpointSearchError,
    endpointResults,
    findEndpoints,
    openEndpointPreview,
    previewDialogOpen,
    previewEndpoint,
    previewRootListOk,
    closePreviewDialog,
    commitPreviewUseRoot,
    commitPreviewWithPath,
    setPreviewRootListOk,
    detectingLocalEndpoint,
    localEndpointDetectError,
    detectLocalEndpoint,
    clearLocalEndpointDetectError,
    debugLines,
    debugAutoScroll,
    debugOpen,
    setDebugOpenPersisted,
    setDebugAutoScroll,
    clearDebugLines,
    copyDebugLines,
  } = globusUi;
  const sourceEndpointTrimmed = (source_endpoint || '').trim();
  const sourceEndpointUuidInvalid =
    sourceEndpointTrimmed.length > 0 && !isGlobusEndpointUuid(sourceEndpointTrimmed);

  const rootBrowseFailed =
    !!api_auth &&
    !!target_endpoint_id &&
    globus_collection_exists === false &&
    isGlobusEndpointRootPath(collection_path, target_endpoint_id);

  return (
    <>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Globus</div>
            <div className={"__config-control-section-description"}>
              Configure Globus for transferring deidentified files. Requires globus-cli to be available.
            </div>
            <div className="__config-control-subsection-note-description">
              Uploaded files keep the output filename on disk. Globus does not receive separate metadata or catalog titles in this version.
            </div>
            {cli_available === false && (
              <div style={{ padding: '0.5em', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginBottom: '1em' }}>
                <strong>Warning:</strong> Globus CLI is not available. For development: ensure globus-cli is installed in your conda environment. For production: use a packaged build.
              </div>
            )}
            <div className={"__config-control-section-dsa-group __config-control-section-dsa-group--full-width"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <GlobusAuthPanel
                  mode="network"
                  cliAvailable={cli_available}
                  authStatus={!!api_auth}
                  currentUser={api_auth?.username || api_auth?.sub || api_auth?.id || 'Authenticated'}
                  authCheckPending={auth_check_pending}
                  loginPending={login_pending}
                  loginUrl={login_url}
                  accessCode={access_code}
                  authorizationCodeInput={authorization_code_input}
                  disableSslVerification={disable_ssl_verification}
                  errorMessage={login_error ? login_error_message : null}
                  connectionWarning={false}
                  busy={auth_check_pending}
                  onLogin={() => dispatch({ type: globus_actions.LOGIN })}
                  onLogout={() => dispatch({ type: globus_actions.LOGOUT })}
                  onCheckAuth={() => dispatch({ type: globus_actions.CHECK_AUTH })}
                  onSubmitCode={() => dispatch({ type: globus_actions.SUBMIT_AUTHORIZATION_CODE })}
                  onAuthorizationCodeInputChange={(new_value) => dispatch({ type: globus_actions.SET_AUTHORIZATION_CODE_INPUT, payload: new_value })}
                  onToggleSsl={async (newValue) => {
                    await window.electronAPI.globusSetSslVerification(newValue);
                    dispatch({ type: globus_actions.TOGGLE_SSL_VERIFICATION });
                  }}
                />
              </div>
            </div>
            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>Target and path</div>
            <div className={"__config-control-section-description"}>
              Choose the Globus target endpoint and directory used when Globus is the auto-upload destination.
            </div>
            <div className={"__config-control-section-dsa-group __config-control-section-dsa-group--full-width"}>
              <div className={"__config-control-section-dsa-subgroup globus-target-path"}>
                <div className={"globus-target-path__subsection"}>
                  <h3 className={"globus-target-path__subsection-title"}>This computer</h3>
                  <p className={"globus-target-path__subsection-desc"}>
                    Identifies this PC in Globus so the app can read processed files from your Globus Connect
                    Personal endpoint.
                  </p>
                  <div className={"globus-target-path__grid"}>
                    <label
                      className={"globus-target-path__label-col"}
                      htmlFor={"globus-local-endpoint-input"}
                    >
                      This computer&apos;s Globus endpoint ID
                    </label>
                    <div className={"globus-target-path__control-col"}>
                      <div className={"globus-target-path__input-with-action"}>
                        <InputText
                          omitLabel
                          inputId={"globus-local-endpoint-input"}
                          ariaLabel={"This computer's Globus endpoint ID (Globus Connect Personal UUID)"}
                          value={source_endpoint || ''}
                          onChange={(new_value) => {
                            clearLocalEndpointDetectError();
                            dispatch({ type: globus_actions.SET_GLOBUS_SOURCE_ENDPOINT, payload: new_value });
                          }}
                          placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          error={sourceEndpointUuidInvalid}
                          tooltip={
                            'Globus Connect Personal endpoint UUID for this machine — not a display name. De-identified files are read from here. Use “Auto-detect local ID” to run globus endpoint local-id for the current Windows user.'
                          }
                        />
                        <Button
                          text={detectingLocalEndpoint ? 'Detecting…' : 'Auto-detect local ID'}
                          disabled={detectingLocalEndpoint || cli_available === false}
                          onClick={detectLocalEndpoint}
                        />
                      </div>
                      {localEndpointDetectError && (
                        <div className={"globus-target-path__alert globus-target-path__alert--danger"}>
                          {localEndpointDetectError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={"globus-target-path__subsection"}>
                  <h3 className={"globus-target-path__subsection-title"}>Upload destination</h3>
                  <p className={"globus-target-path__subsection-desc"}>
                    Search for a remote Globus endpoint, open <strong>Test and view</strong>, then use{' '}
                    <strong>Use this endpoint</strong> or pick a folder with <strong>Upload here</strong>. Log in
                    under Authentication first.
                  </p>
                  <div className={"globus-target-path__grid"}>
                    <label
                      className={"globus-target-path__label-col"}
                      htmlFor={"globus-collection-name-input"}
                    >
                      Search for a destination endpoint
                    </label>
                    <div className={"globus-target-path__control-col"}>
                      <div className={"globus-target-path__input-with-action"}>
                        <InputText
                          omitLabel
                          inputId={"globus-collection-name-input"}
                          ariaLabel={"Search for a destination endpoint"}
                          value={collection_name || ''}
                          onChange={(new_value) =>
                            dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_NAME, payload: new_value })
                          }
                          tooltip="Enter a site or endpoint name (e.g. pitt#dtn), click Search, then Test and view on a result. Paste a full endpoint UUID and Search to get one row with the same flow — confirm in the preview before anything is saved."
                          placeholder="Site name, alias, or endpoint UUID"
                        />
                        <Button
                          text={searchingEndpoints ? 'Searching…' : 'Search'}
                          disabled={searchingEndpoints || !collection_name || !collection_name.trim()}
                          onClick={findEndpoints}
                        />
                      </div>
                      <p className={"globus-target-path__field-hint"}>
                        Type a site name (e.g. pitt#dtn) or paste a UUID, then click Search or choose a result
                        below.
                      </p>
                    </div>

                    {endpointSearchError && (
                      <div
                        className={
                          'globus-target-path__full globus-target-path__alert globus-target-path__alert--warn'
                        }
                      >
                        {endpointSearchError}
                      </div>
                    )}
                    {endpointResults.length > 0 && (
                      <div className={"globus-target-path__full"}>
                        <span className={"globus-target-path__endpoint-heading"}>Matching endpoints</span>
                        <p className={"globus-target-path__field-hint globus-target-path__field-hint--muted"}>
                          Nothing is saved until you use <strong>Use this endpoint</strong> or{' '}
                          <strong>Upload here</strong> on a folder in the preview.
                        </p>
                        <div className={"globus-target-path__endpoint-list"}>
                          {endpointResults.map((endpoint) => (
                            <div key={endpoint.id} className={"globus-target-path__endpoint-row"}>
                              <div className={"globus-target-path__endpoint-row-main"}>
                                <strong>{endpoint.display_name || endpoint.id}</strong>
                                <div className={"globus-target-path__endpoint-sub"}>
                                  {endpoint.id}
                                  {endpoint.owner ? ` - ${endpoint.owner}` : ''}
                                </div>
                              </div>
                              <Button
                                text="Test and view"
                                onClick={() => openEndpointPreview(endpoint)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewDialogOpen && previewEndpoint && (
                      <div
                        className={"globus-endpoint-preview-dialog"}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={"globus-endpoint-preview-title"}
                      >
                        <button
                          type="button"
                          className={"globus-endpoint-preview-dialog__backdrop"}
                          aria-label="Close preview"
                          onClick={closePreviewDialog}
                        />
                        <div className={"globus-endpoint-preview-dialog__panel"}>
                          <h3
                            id={"globus-endpoint-preview-title"}
                            className={"globus-endpoint-preview-dialog__title"}
                          >
                            {previewEndpoint.label || previewEndpoint.id}
                          </h3>
                          <p className={"globus-endpoint-preview-dialog__uuid"}>{previewEndpoint.id}</p>
                          <p className={"globus-endpoint-preview-dialog__hint"}>
                            Nothing is saved until <strong>Use this endpoint</strong> (root only) or{' '}
                            <strong>Upload here</strong> on a folder below.
                          </p>
                          <GlobusTargetTree
                            rootPath={`${previewEndpoint.id}:/`}
                            selectedPath=""
                            onSetUploadTarget={commitPreviewWithPath}
                            disabled={!api_auth}
                            disabledReason={!api_auth ? 'auth' : undefined}
                            listDirectoryApi={window.electronAPI?.globusListDirectory}
                            refreshNonce={globus_directory_refresh_nonce}
                            suppressRootListError={false}
                            onRootLoadResult={setPreviewRootListOk}
                            onRetryListing={() => {
                              setPreviewRootListOk(false);
                              dispatch({ type: globus_actions.BUMP_GLOBUS_DIRECTORY_REFRESH });
                            }}
                          />
                          <div className={"globus-endpoint-preview-dialog__actions"}>
                            <Button text="Cancel" onClick={closePreviewDialog} />
                            <Button
                              text="Use this endpoint"
                              disabled={!previewRootListOk}
                              onClick={commitPreviewUseRoot}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {target_endpoint_id && (
                      <div
                        className={
                          'globus-target-path__full globus-target-path__chosen' +
                          (rootBrowseFailed ? ' globus-target-path__chosen--browseFailed' : '')
                        }
                        role={"region"}
                        aria-labelledby={"globus-chosen-endpoint-heading"}
                      >
                        <h4
                          id={"globus-chosen-endpoint-heading"}
                          className={"globus-target-path__chosen-heading"}
                        >
                          {rootBrowseFailed
                            ? 'Endpoint selected — folder access failed'
                            : 'Chosen endpoint for uploads'}
                        </h4>
                        <div className={"globus-target-path__chosen-row"}>
                          <div className={"globus-target-path__chosen-main"}>
                            <strong className={"globus-target-path__chosen-name"}>
                              {target_endpoint_label || target_endpoint_id}
                            </strong>
                            <span className={"globus-target-path__chosen-uuid"}>
                              {' '}
                              ({target_endpoint_id})
                            </span>
                          </div>
                          <div
                            className={
                              'globus-target-path__control-col globus-target-path__control-col--checkbox-inline'
                            }
                          >
                            <label
                              id={"globus-target-remember-lbl"}
                              className={"globus-target-path__inline-label"}
                              onClick={() =>
                                dispatch({ type: globus_actions.TOGGLE_REMEMBER_TARGET_ENDPOINT })
                              }
                              title={"Remember this destination for next time"}
                            >
                              Remember endpoint
                            </label>
                            <div className={"globus-target-path__checkbox-wrap"}>
                              <Checkbox
                                hideLabel
                                checkboxId={"globus-target-remember-cb"}
                                ariaLabelledBy={"globus-target-remember-lbl"}
                                checked={!!remember_target_endpoint}
                                onClick={() =>
                                  dispatch({ type: globus_actions.TOGGLE_REMEMBER_TARGET_ENDPOINT })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        {rootBrowseFailed && globus_collection_error_message && (
                          <div
                            className={"globus-target-path__chosen-accessCallout"}
                            role={"alert"}
                          >
                            <p className={"globus-target-path__chosen-errorPrimary"}>
                              {globus_collection_error_message}
                            </p>
                            {globus_collection_error_detail ? (
                              <p className={"globus-target-path__chosen-errorDetail"}>
                                {globus_collection_error_detail}
                              </p>
                            ) : null}
                            {globus_collection_error_technical ? (
                              <details className={"globus-target-path__chosen-technical"}>
                                <summary>Technical details</summary>
                                <pre className={"globus-target-path__chosen-technical-pre"}>
                                  {globus_collection_error_technical}
                                </pre>
                              </details>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={
                        'globus-target-path__full globus-target-path__browser'
                      }
                    >
                      <div className={"globus-target-path__browser-title"}>
                        Folder on destination
                      </div>
                      {!api_auth && (
                        <p className={"globus-target-path__hint globus-target-path__hint--gate"}>
                          Log in to Globus (Authentication above) before folder browsing works.
                        </p>
                      )}
                      {api_auth &&
                        !target_endpoint_id &&
                        (collection_name || '').trim().length > 0 && (
                          <p className={"globus-target-path__hint globus-target-path__hint--nudge"}>
                            Click Search, then <strong>Test and view</strong> on a result to confirm the
                            endpoint, or paste a UUID and use the same flow.
                          </p>
                        )}
                      {target_endpoint_id && api_auth && (
                        <div
                          className={
                            'globus-target-path__targetFolderBar' +
                            (globus_collection_exists === true
                              ? ' globus-target-path__targetFolderBar--ok'
                              : '') +
                            (globus_collection_exists === false
                              ? ' globus-target-path__targetFolderBar--bad'
                              : '')
                          }
                          role="status"
                          aria-live="polite"
                        >
                          <span className={"globus-target-path__targetFolderBar-label"}>
                            Upload target folder:
                          </span>
                          <span
                            className={"globus-target-path__targetFolderBar-path"}
                            title={collection_path || ''}
                          >
                            {displayPathWithoutEndpointUuid(collection_path) ||
                              'Root (/)'}
                          </span>
                          <GlobusUploadPathEditPopover
                            targetEndpointId={target_endpoint_id}
                            collectionPath={collection_path || ''}
                            listDirectoryApi={window.electronAPI?.globusListDirectory}
                            disabled={!api_auth}
                            onApply={(normalizedPath) =>
                              dispatch({
                                type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
                                payload: normalizedPath,
                              })
                            }
                          />
                          {!isGlobusEndpointRootPath(collection_path, target_endpoint_id) && (
                            <button
                              type="button"
                              className={"globus-target-path__targetFolderBar-clear"}
                              aria-label="Clear folder selection (reset to root)"
                              onClick={() =>
                                dispatch({
                                  type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
                                  payload: `${target_endpoint_id}:/`,
                                })
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                      {target_endpoint_id && api_auth && (
                        <p className={"globus-target-path__field-hint globus-target-path__field-hint--muted"}>
                          Browse folders and use <strong>Upload here</strong>, or <strong>Edit</strong> to type a
                          full path and validate.
                        </p>
                      )}
                      <GlobusTargetTree
                        rootPath={target_endpoint_id ? `${target_endpoint_id}:/` : ''}
                        selectedPath={collection_path || ''}
                        onSetUploadTarget={(path) =>
                          dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: path })
                        }
                        disabled={!api_auth}
                        disabledReason={!api_auth ? 'auth' : undefined}
                        listDirectoryApi={window.electronAPI?.globusListDirectory}
                        refreshNonce={globus_directory_refresh_nonce}
                        suppressRootListError={!!api_auth}
                        showRootFailureRetryHint={rootBrowseFailed}
                        onRetryListing={() => {
                          dispatch({ type: globus_actions.BUMP_GLOBUS_DIRECTORY_REFRESH });
                          const p = (collection_path || '').trim();
                          if (p) {
                            dispatch({
                              type: globus_actions.SET_GLOBUS_COLLECTION_PATH,
                              payload: p,
                            });
                          }
                        }}
                      />
                    </div>

                    <div className={"globus-target-path__full globus-target-path__debug"}>
                      {!debugOpen ? (
                        <button
                          type="button"
                          className={"globus-target-path__debug-toggle"}
                          onClick={() => setDebugOpenPersisted(true)}
                        >
                          Show debug logs
                        </button>
                      ) : (
                        <>
                          <div className={"globus-target-path__debug-header"}>
                            <span>Globus debug logs</span>
                            <div className={"globus-target-path__debug-tools"}>
                              <button
                                type="button"
                                className={"globus-target-path__debug-toggle globus-target-path__debug-toggle--inline"}
                                onClick={() => setDebugOpenPersisted(false)}
                              >
                                Hide
                              </button>
                              <label className={"globus-target-path__debug-auto-scroll"}>
                                <input
                                  type="checkbox"
                                  checked={!!debugAutoScroll}
                                  onChange={(e) => setDebugAutoScroll(!!e.target.checked)}
                                />
                                Auto-scroll
                              </label>
                              <Button text="Copy" onClick={copyDebugLines} />
                              <Button text="Clear" onClick={clearDebugLines} />
                            </div>
                          </div>
                          <pre className={"globus-target-path__debug-pre"} id="globus-debug-log-panel">
                            {debugLines && debugLines.length > 0
                              ? debugLines.join('\n')
                              : 'No Globus logs yet. Start an upload to see live CLI output and task status.'}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}

function ModalNetwork(props) {
  const dsa = useSelector(state => state.dsa);
  const dsa_upload = useSelector(state => state.config.dsa_upload);
  const config = useSelector(state => state.config);
  const file_rows = useSelector(state => state.files.file_rows);
  const file_cols = useSelector(state => state.files.file_cols);
  const globus = useSelector(state => state.globus);
  const uploadRouting = useSelector((state) => state.uploadRouting);
  const readiness = useSelector(selectUploadReadiness);

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const placeholderCatalogs = useMemo(
    () => ({
      dsaAlias: getPatternPlaceholderCatalog({
        field: 'dsaAlias',
        fileRows: file_rows,
        fileCols: file_cols,
        hasLoadedFiles,
        csvConfig: config?.csv,
      }),
    }),
    [file_rows, file_cols, hasLoadedFiles, config?.csv],
  );

  const dispatch = useDispatch();
  const store = useStore();
  const [searchingEndpoints, setSearchingEndpoints] = useState(false);
  const [endpointSearchError, setEndpointSearchError] = useState(null);
  const [endpointResults, setEndpointResults] = useState([]);
  const [detectingLocalEndpoint, setDetectingLocalEndpoint] = useState(false);
  const [localEndpointDetectError, setLocalEndpointDetectError] = useState(null);
  const [debugLines, setDebugLines] = useState([]);
  const [debugAutoScroll, setDebugAutoScroll] = useState(true);
  const [debugOpen, setDebugOpen] = useState(() => {
    try {
      return window?.localStorage?.getItem('globusDebugOpen') === '1';
    } catch (e) {
      return false;
    }
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewEndpoint, setPreviewEndpoint] = useState(null);
  const [previewRootListOk, setPreviewRootListOk] = useState(false);

  const setDebugOpenPersisted = useCallback((next) => {
    setDebugOpen(next);
    try {
      window?.localStorage?.setItem('globusDebugOpen', next ? '1' : '0');
    } catch (e) {
      // ignore (private mode / disabled storage)
    }
  }, []);

  const closePreviewDialog = useCallback(() => {
    setPreviewDialogOpen(false);
    setPreviewEndpoint(null);
    setPreviewRootListOk(false);
  }, []);

  const openEndpointPreview = useCallback((endpoint) => {
    const endpointId = endpoint?.id ? String(endpoint.id).trim() : '';
    if (!endpointId) return;
    const label = (endpoint?.display_name && String(endpoint.display_name).trim()) || endpointId;
    setPreviewEndpoint({ id: endpointId, label });
    setPreviewRootListOk(false);
    setPreviewDialogOpen(true);
  }, []);

  const commitPreviewUseRoot = useCallback(() => {
    if (!previewEndpoint?.id || !previewRootListOk) return;
    const id = String(previewEndpoint.id).trim();
    dispatch({
      type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT,
      payload: { id, label: previewEndpoint.label || id },
    });
    dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: `${id}:/` });
    setEndpointResults([]);
    closePreviewDialog();
  }, [previewEndpoint, previewRootListOk, dispatch, closePreviewDialog]);

  const commitPreviewWithPath = useCallback(
    (canonicalPath) => {
      if (!previewEndpoint?.id || !canonicalPath) return;
      const id = String(previewEndpoint.id).trim();
      dispatch({
        type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT,
        payload: { id, label: previewEndpoint.label || id },
      });
      dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: canonicalPath });
      setEndpointResults([]);
      closePreviewDialog();
    },
    [previewEndpoint, dispatch, closePreviewDialog]
  );

  function appendDebugLine(line) {
    if (line == null) return;
    const text = String(line);
    setDebugLines((prev) => {
      const next = prev.length >= 400 ? prev.slice(prev.length - 399) : prev.slice();
      next.push(text);
      return next;
    });
  }

  function clearDebugLines() {
    setDebugLines([]);
  }

  async function copyDebugLines() {
    try {
      await navigator.clipboard.writeText((debugLines || []).join('\n'));
    } catch (e) {
      // fallback: best-effort; do nothing
    }
  }

  async function findEndpoints() {
    const query = (globus.collection_name || '').trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    setEndpointSearchError(null);
    setEndpointResults([]);
    if (!query) {
      setEndpointSearchError('Enter an endpoint alias, display name, or UUID first.');
      return;
    }
    if (uuidRegex.test(query)) {
      setEndpointResults([{ id: query, display_name: query, owner: null }]);
      return;
    }

    setSearchingEndpoints(true);
    try {
      const response = await window.electronAPI.globusSearchEndpoints(query);
      if (!response || !response[0]) {
        setEndpointSearchError(response?.[1]?.message || 'Endpoint search failed.');
        return;
      }
      const data = Array.isArray(response?.[1]?.data) ? response[1].data : [];
      setEndpointResults(data);
      if (data.length === 0) {
        setEndpointSearchError('No endpoints found for this query.');
      }
    } catch (e) {
      setEndpointSearchError(e?.message || 'Endpoint search failed.');
    } finally {
      setSearchingEndpoints(false);
    }
  }

  function clearLocalEndpointDetectError() {
    setLocalEndpointDetectError(null);
  }

  async function detectLocalEndpoint() {
    setLocalEndpointDetectError(null);
    if (!globus.cli_available) {
      setLocalEndpointDetectError('Globus CLI is not available. Install or bundle globus-cli, then reopen this dialog.');
      return;
    }
    setDetectingLocalEndpoint(true);
    try {
      const response = await window.electronAPI.globusGetLocalEndpointId();
      if (!response || !response[0]) {
        setLocalEndpointDetectError(
          response?.[1]?.message || 'Could not read the local Globus Connect Personal endpoint ID.'
        );
        return;
      }
      const id = response[1]?.id ? String(response[1].id).trim() : '';
      if (!id) {
        setLocalEndpointDetectError('No endpoint ID was returned.');
        return;
      }
      dispatch({ type: globus_actions.SET_GLOBUS_SOURCE_ENDPOINT, payload: id });
    } catch (e) {
      setLocalEndpointDetectError(e?.message || 'Could not read the local endpoint ID.');
    } finally {
      setDetectingLocalEndpoint(false);
    }
  }

  // Populate Redux `cli_available` so Globus Login button can enable.
  useEffect(() => {
    let cancelled = false;
    async function checkCliAvailable() {
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
            // best-effort; auth check may still succeed
          }

          dispatch({ type: globus_actions.CHECK_AUTH });
        }
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: globus_actions.CHECK_CLI_AVAILABLE, payload: false });
      }
    }

    checkCliAvailable();
    return () => {
      cancelled = true;
    };
  }, [dispatch, store]);

  useEffect(() => {
    if (!window?.electronAPI?.globusSetupUploadDebugLog || !window?.electronAPI?.globusSetupUploadDebugStatus) {
      return;
    }

    const unsubLog = window.electronAPI.globusSetupUploadDebugLog((data) => {
      const stream = data?.stream || 'log';
      const msg = data?.message || '';
      const row = data?.row_idx != null ? `row ${data.row_idx}` : '';
      const task = data?.task_id ? `task ${data.task_id}` : '';
      const prefix = [stream, row, task].filter(Boolean).join(' | ');
      appendDebugLine(prefix ? `${prefix} - ${msg}` : String(msg));
      if (data?.task_show_json) {
        appendDebugLine(String(data.task_show_json));
      }
    });

    const unsubStatus = window.electronAPI.globusSetupUploadDebugStatus((data) => {
      const parts = [];
      if (data?.status) parts.push(`status=${data.status}`);
      if (data?.nice_status) parts.push(`nice=${data.nice_status}`);
      if (typeof data?.bytes_transferred === 'number') parts.push(`bytes_transferred=${data.bytes_transferred}`);
      if (typeof data?.files_transferred === 'number') parts.push(`files_transferred=${data.files_transferred}`);
      if (typeof data?.files === 'number') parts.push(`files=${data.files}`);
      if (parts.length === 0) return;
      const row = data?.row_idx != null ? `row ${data.row_idx}` : '';
      const task = data?.task_id ? `task ${data.task_id}` : '';
      const prefix = ['status', row, task].filter(Boolean).join(' | ');
      appendDebugLine(`${prefix} - ${parts.join(' ')}`);
    });

    return () => {
      if (typeof unsubLog === 'function') unsubLog();
      if (typeof unsubStatus === 'function') unsubStatus();
      window?.electronAPI?.globusStopUploadDebugLog?.();
      window?.electronAPI?.globusStopUploadDebugStatus?.();
    };
  }, []);

  useEffect(() => {
    if (!debugAutoScroll) return;
    const el = document.getElementById('globus-debug-log-panel');
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [debugLines, debugAutoScroll]);

  const ur = uploadRouting;

  const selectedAutoUploadMode = useMemo(() => {
    if (!ur.auto_upload) return AUTO_UPLOAD_MODE_ITEMS[0];
    return ur.destination === 'globus' ? AUTO_UPLOAD_MODE_ITEMS[1] : AUTO_UPLOAD_MODE_ITEMS[2];
  }, [ur.auto_upload, ur.destination]);

  const statusBannerClass =
    'network-status-banner ' +
    (!ur.auto_upload
      ? 'network-status-banner--off'
      : readiness.ready
        ? 'network-status-banner--ready'
        : 'network-status-banner--pending');

  const destLabel = ur.destination === 'globus' ? 'Globus' : 'DSA';
  const statusHeadline = !ur.auto_upload
    ? 'Auto-upload is off. Processed files stay local unless you enable auto-upload below.'
    : readiness.ready
      ? `Auto-upload on · ${destLabel} · Connected`
      : `Auto-upload on · ${destLabel} · Not ready`;

  return (
    <div className="__modal">
      <ModalHeader title={"Network"} type={"network_config"} />
      <div className={"__content"}>
        <div className={"__divider"} />
        <div className={statusBannerClass}>
          <div className={"network-status-banner__headline"}>{statusHeadline}</div>
          <div className={"network-status-banner__detail"}>{readiness.label}</div>
          {ur.auto_upload && !readiness.ready && readiness.blockers.length > 0 && (
            <ul className={"network-status-banner__blockers"}>
              {readiness.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {ur.auto_upload && !readiness.ready && (
            <div className={"network-status-banner__foot"}>
              Auto-upload will not send files until the connection is ready. You can still run Process to de-identify locally.
            </div>
          )}
        </div>

        <div className={"__config-controls network-auto-upload"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Auto-upload</div>
            <p className={"network-auto-upload__intro"}>
              Choose whether processed files are sent to Globus or DSA. Additional options apply only when a destination is selected.
            </p>
            <div className={"network-auto-upload__grid"}>
              <div className={"network-auto-upload__label-col"}>
                After processing, send files to
              </div>
              <div className={"network-auto-upload__control-col"}>
                <Dropdown
                  omitLabel
                  ariaLabel={"After processing, send files to"}
                  width={"100%"}
                  placeholder={"Select…"}
                  items={AUTO_UPLOAD_MODE_ITEMS}
                  multiSelect={false}
                  selectedItems={[selectedAutoUploadMode]}
                  onSelect={(item) =>
                    dispatch({
                      type: upload_routing_actions.SET_AUTO_UPLOAD_MODE,
                      payload: item.value,
                    })
                  }
                />
              </div>

              <label
                id={"network-auto-upload-delete-lbl"}
                className={"network-auto-upload__label-col"}
                onClick={() => {
                  if (ur.auto_upload) {
                    dispatch({ type: upload_routing_actions.TOGGLE_DELETE_LOCAL_AFTER });
                  }
                }}
                style={{ cursor: ur.auto_upload ? 'pointer' : 'default' }}
              >
                Delete local file after successful upload
              </label>
              <div
                className={
                  "network-auto-upload__control-col network-auto-upload__control-col--checkbox network-auto-upload__checkbox-wrap"
                }
              >
                <Checkbox
                  hideLabel
                  checkboxId={"network-auto-upload-delete-cb"}
                  ariaLabelledBy={"network-auto-upload-delete-lbl"}
                  checked={ur.delete_local_after}
                  disabled={!ur.auto_upload}
                  onClick={() => dispatch({ type: upload_routing_actions.TOGGLE_DELETE_LOCAL_AFTER })}
                />
              </div>

              <label
                className={"network-auto-upload__label-col network-auto-upload__label-col--max"}
                htmlFor={"network-auto-upload-max-pending"}
              >
                Max files waiting on disk during upload
              </label>
              <div
                className={
                  "network-auto-upload__control-col network-auto-upload__control-col--max"
                }
              >
                <InputText
                  omitLabel
                  compact
                  inputId={"network-auto-upload-max-pending"}
                  ariaLabel={"Max files waiting on disk during upload"}
                  type={"number"}
                  disabled={!ur.auto_upload || !ur.delete_local_after}
                  value={String(ur.max_local_pending)}
                  onChange={(new_value) =>
                    dispatch({ type: upload_routing_actions.SET_MAX_LOCAL_PENDING, payload: new_value })
                  }
                />
                <p className={"network-auto-upload__helper"}>
                  {!ur.auto_upload ? (
                    <>
                      Limits how many finished de-identified files can sit on disk at once while uploads finish. Only applies when auto-upload and delete-after are on. Transfer parallelism depends on the destination you select (Globus can run multiple transfers at once; DSA uses one at a time).
                    </>
                  ) : ur.destination === 'globus' ? (
                    <>
                      Limits how many finished de-identified files can sit on disk at once while uploads finish. Only applies when delete-after is on. This does not limit how many Globus transfers run at once; use the setting below for that.
                    </>
                  ) : (
                    <>
                      Limits how many finished de-identified files can sit on disk at once while uploads finish. Only applies when delete-after is on. DSA still runs uploads one at a time from its queue; this value only throttles how many files are held on disk ahead of that queue.
                    </>
                  )}
                </p>
              </div>

              {ur.auto_upload && ur.destination === 'globus' && (
                <>
                  <label
                    className={"network-auto-upload__label-col network-auto-upload__label-col--max"}
                    htmlFor={"network-auto-upload-max-globus-parallel"}
                  >
                    Max parallel Globus transfers
                  </label>
                  <div
                    className={
                      "network-auto-upload__control-col network-auto-upload__control-col--max"
                    }
                  >
                    <InputText
                      omitLabel
                      compact
                      inputId={"network-auto-upload-max-globus-parallel"}
                      ariaLabel={"Max parallel Globus transfers"}
                      type={"number"}
                      disabled={!ur.auto_upload}
                      value={String(ur.max_globus_parallel_uploads)}
                      onChange={(new_value) =>
                        dispatch({
                          type: upload_routing_actions.SET_MAX_GLOBUS_PARALLEL_UPLOADS,
                          payload: new_value,
                        })
                      }
                    />
                    <p className={"network-auto-upload__helper"}>
                      Upper bound on concurrent Globus transfer jobs from this app. Higher values may use more bandwidth and CPU; Globus CLI calls are still serialized internally to avoid conflicts.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={"__divider"} />

        {!ur.auto_upload && (
          <p className={"network-auto-upload__idle-hint"}>
            Select Globus or DSA above to configure that destination&apos;s login, folder, and paths.
          </p>
        )}

        {ur.auto_upload && ur.destination === 'dsa' && render_network_config_dsa_content(dispatch, dsa, dsa_upload, {
          placeholderCatalog: placeholderCatalogs.dsaAlias,
          onRecompute: () => dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING }),
        })}
        {ur.auto_upload && ur.destination === 'globus' &&
          render_network_config_globus_content(dispatch, globus, {
            searchingEndpoints,
            endpointSearchError,
            endpointResults,
            findEndpoints,
            openEndpointPreview,
            previewDialogOpen,
            previewEndpoint,
            previewRootListOk,
            closePreviewDialog,
            commitPreviewUseRoot,
            commitPreviewWithPath,
            setPreviewRootListOk,
            detectingLocalEndpoint,
            localEndpointDetectError,
            detectLocalEndpoint,
            clearLocalEndpointDetectError,
            debugLines,
            debugAutoScroll,
            debugOpen,
            setDebugOpenPersisted,
            setDebugAutoScroll,
            clearDebugLines,
            copyDebugLines,
          })}
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalNetwork;