import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, useStore } from "react-redux";

import * as config_actions from "../../actions/config";
import * as app_actions from "../../actions/app";
import * as dsa_actions from "../../actions/dsa";
import * as globus_actions from "../../actions/globus";

import ModalHeader from './ModalHeader';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import InputText from '../../components/controls/input/InputText';
import Dropdown from '../../components/controls/dropdown/Dropdown';
import Button from '../../components/controls/button/Button';
import { return_file_extension_from_path, return_filename_basename_from_filename } from "../../helpers/renderer_path_helpers";
import { generate_dropdown_for_table_columns } from "../../helpers/fe_helpers";
import { isGlobusEndpointUuid } from "../../helpers/globus_helpers";
import GlobusAuthPanel from '../../components/globus/GlobusAuthPanel';
import GlobusTargetTree from '../../components/globus/GlobusTargetTree';

function render_network_config_dsa_content(dispatch, modal, dsa) {
  const { network_type } = modal;
  const { folder_id, username, password, api_url, api_auth, login_error, login_error_message, upload, delete_after, dsa_folder_exists, dsa_folder_error_message } = dsa;

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
    <div className={"__content"}>
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
            <div className={"__config-control-section-title"}>Upload</div>
            <div className={"__config-control-section-description"}>
              Configure whether to upload deidentified files and whether to delete local files after upload.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <Checkbox label={"Upload"} checked={upload} onClick={() => dispatch({ type: dsa_actions.TOGGLE_UPLOAD_TO_DSA })} />
                <Checkbox label={"Delete local after"} checked={delete_after} onClick={() => dispatch({ type: dsa_actions.TOGGLE_DELETE_AFTER_DSA_UPLOAD })} />
                <InputText tooltip={dsa_folder_error_message? dsa_folder_error_message : null} input_style={dsa_folder_exists_style(dsa_folder_exists)} label={"DSA folder ID"} value={folder_id} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_FOLDER_ID, payload: new_value })} />
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

function render_network_config_globus_content(dispatch, modal, globus, globusUi) {
  const { network_type } = modal;
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
    upload,
    delete_after,
    globus_collection_exists,
    globus_collection_error_message,
    cli_available,
    disable_ssl_verification,
    globus_directory_refresh_nonce
  } = globus;
  const {
    searchingEndpoints,
    endpointSearchError,
    endpointResults,
    findEndpoints,
    selectEndpoint,
    detectingLocalEndpoint,
    localEndpointDetectError,
    detectLocalEndpoint,
    clearLocalEndpointDetectError,
    debugLines,
    debugAutoScroll,
    setDebugAutoScroll,
    clearDebugLines,
    copyDebugLines,
  } = globusUi;
  const sourceEndpointTrimmed = (source_endpoint || '').trim();
  const sourceEndpointUuidInvalid =
    sourceEndpointTrimmed.length > 0 && !isGlobusEndpointUuid(sourceEndpointTrimmed);

  function globus_collection_exists_style(globus_collection_exists) {
    if (globus_collection_exists === null) {
      return {};
    } else if (globus_collection_exists) {
      return {borderColor: 'green', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'green'};
    } else {
      return {borderColor: 'red', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'red'};
    }
  }

  return (
    <div className={"__content"}>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Globus</div>
            <div className={"__config-control-section-description"}>
              Configure Globus for transferring deidentified files. Requires globus-cli to be available.
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
            <div className={"__config-control-section-title"}>Upload Configuration</div>
            <div className={"__config-control-section-description"}>
              Configure target collection and directory, then whether to upload de-identified files and whether to delete local files after upload.
            </div>
            <div className={"__config-control-section-dsa-group __config-control-section-dsa-group--full-width"}>
              <div className={"__config-control-section-dsa-subgroup"} style={{ width: '100%' }}>
                <div className="__config-control-form-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <InputText
                      label={"Local endpoint ID (Globus Connect Personal)"}
                      value={source_endpoint || ''}
                      onChange={(new_value) => {
                        clearLocalEndpointDetectError();
                        dispatch({ type: globus_actions.SET_GLOBUS_SOURCE_ENDPOINT, payload: new_value });
                      }}
                      placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      error={sourceEndpointUuidInvalid}
                      tooltip={
                        'The UUID of your Globus Connect Personal endpoint where de-identified files are read from (not a display name). Source path is the file output path. Click “Use this computer’s GCP ID” to run globus endpoint local-id for this Windows user.'
                      }
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75em',
                        marginTop: '0.35em',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        text={detectingLocalEndpoint ? 'Detecting…' : 'Use this computer’s GCP ID'}
                        disabled={detectingLocalEndpoint || cli_available === false}
                        onClick={detectLocalEndpoint}
                      />
                    </div>
                    {localEndpointDetectError && (
                      <div
                        style={{
                          marginTop: '0.5em',
                          padding: '0.5em',
                          backgroundColor: '#f8d7da',
                          border: '1px solid #f5c6cb',
                          borderRadius: '4px',
                          color: '#721c24',
                          fontSize: '0.9em',
                        }}
                      >
                        {localEndpointDetectError}
                      </div>
                    )}
                  </div>
                  <InputText 
                    label={"Target collection (browse root)"} 
                    value={collection_name || ''} 
                    onChange={(new_value) => dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_NAME, payload: new_value })} 
                    tooltip="Enter endpoint alias/name (e.g. pitt#dtn) then click Find endpoints, or paste a UUID directly."
                    placeholder="endpoint alias/name or UUID"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em', marginTop: '0.25em', marginBottom: '0.5em', flexWrap: 'wrap' }}>
                  <Button
                    text={searchingEndpoints ? 'Finding…' : 'Find endpoints'}
                    disabled={searchingEndpoints || !collection_name || !collection_name.trim()}
                    onClick={findEndpoints}
                  />
                  <Checkbox
                    label={"Remember endpoint"}
                    checked={!!remember_target_endpoint}
                    onClick={() => dispatch({ type: globus_actions.TOGGLE_REMEMBER_TARGET_ENDPOINT })}
                  />
                </div>
                {target_endpoint_id && (
                  <div style={{ marginBottom: '0.5em', fontSize: '0.9em' }}>
                    Selected endpoint: <strong>{target_endpoint_label || target_endpoint_id}</strong> ({target_endpoint_id})
                  </div>
                )}
                {endpointSearchError && (
                  <div style={{ marginBottom: '0.5em', padding: '0.5em', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', color: '#664d03', fontSize: '0.9em' }}>
                    {endpointSearchError}
                  </div>
                )}
                {endpointResults.length > 0 && (
                  <div style={{ marginBottom: '0.5em' }}>
                    <label style={{ display: 'block', marginBottom: '0.25em' }}>Matching endpoints</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em', maxHeight: '10em', overflowY: 'auto' }}>
                      {endpointResults.map((endpoint) => (
                        <button
                          key={endpoint.id}
                          type="button"
                          onClick={() => selectEndpoint(endpoint)}
                          style={{
                            textAlign: 'left',
                            padding: '0.4em 0.6em',
                            borderRadius: '4px',
                            border: endpoint.id === target_endpoint_id ? '1px solid #0d6efd' : '1px solid #888',
                            background: endpoint.id === target_endpoint_id ? 'rgba(13,110,253,0.15)' : 'transparent',
                            color: 'inherit',
                            cursor: 'pointer'
                          }}
                        >
                          <div><strong>{endpoint.display_name || endpoint.id}</strong></div>
                          <div style={{ fontSize: '0.85em', opacity: 0.85 }}>{endpoint.id}{endpoint.owner ? ` - ${endpoint.owner}` : ''}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '0.5em', marginBottom: '0.5em' }}>
                  <label style={{ display: 'block', marginBottom: '0.25em' }}>Target directory</label>
                  <GlobusTargetTree
                    rootPath={target_endpoint_id ? `${target_endpoint_id}:/` : ''}
                    selectedPath={collection_path || ''}
                    onSelect={(path) => dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: path })}
                    disabled={!api_auth}
                    errorMessage={globus_collection_exists === false ? globus_collection_error_message : null}
                    listDirectoryApi={window.electronAPI?.globusListDirectory}
                    refreshNonce={globus_directory_refresh_nonce}
                    onRetryListing={() => dispatch({ type: globus_actions.BUMP_GLOBUS_DIRECTORY_REFRESH })}
                  />
                </div>
                <InputText 
                  tooltip={globus_collection_error_message ? globus_collection_error_message : null} 
                  input_style={globus_collection_exists_style(globus_collection_exists)} 
                  label={"Target path (or edit)"} 
                  value={collection_path || ''} 
                  onChange={(new_value) => dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: new_value })} 
                  placeholder="endpointUuid:/path/to/folder"
                />
                <div className="__config-control-checkbox-row" style={{ marginTop: '0.75em' }}>
                  <Checkbox label={"Upload"} checked={upload} onClick={() => dispatch({ type: globus_actions.TOGGLE_UPLOAD_TO_GLOBUS })} />
                  <Checkbox label={"Delete local after"} checked={delete_after} onClick={() => dispatch({ type: globus_actions.TOGGLE_DELETE_AFTER_GLOBUS_UPLOAD })} />
                </div>

                <div style={{ marginTop: '0.75em' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75em', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600 }}>Globus debug logs</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35em', fontSize: '0.9em' }}>
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
                  <pre
                    id="globus-debug-log-panel"
                    style={{
                      marginTop: '0.5em',
                      maxHeight: '12em',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '0.75em',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.85em',
                    }}
                  >
                    {debugLines && debugLines.length > 0
                      ? debugLines.join('\n')
                      : 'No Globus logs yet. Start an upload to see live CLI output and task status.'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

function ModalNetwork(props) {
  const file_cols = useSelector(state => state.files.file_columns);
  const reserved_cols = useSelector(state => state.files.reserved_columns);
  const filename_config = useSelector(state => state.config.filename);
  const dsa = useSelector(state => state.dsa);
  const globus = useSelector(state => state.globus);
  const modal = useSelector(state => state.modal);

  const dispatch = useDispatch();
  const store = useStore();
  const [searchingEndpoints, setSearchingEndpoints] = useState(false);
  const [endpointSearchError, setEndpointSearchError] = useState(null);
  const [endpointResults, setEndpointResults] = useState([]);
  const [detectingLocalEndpoint, setDetectingLocalEndpoint] = useState(false);
  const [localEndpointDetectError, setLocalEndpointDetectError] = useState(null);
  const [debugLines, setDebugLines] = useState([]);
  const [debugAutoScroll, setDebugAutoScroll] = useState(true);

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
      dispatch({ type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT, payload: { id: query, label: query } });
      if (!globus.collection_path || !globus.collection_path.startsWith(`${query}:`)) {
        dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: `${query}:/` });
      }
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

  function selectEndpoint(endpoint) {
    const endpointId = endpoint?.id ? String(endpoint.id).trim() : '';
    if (!endpointId) return;
    const label = endpoint?.display_name || endpointId;
    dispatch({ type: globus_actions.SET_GLOBUS_TARGET_ENDPOINT, payload: { id: endpointId, label } });
    if (!globus.collection_path || !globus.collection_path.startsWith(`${endpointId}:`)) {
      dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: `${endpointId}:/` });
    }
    setEndpointSearchError(null);
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

  // Log Redux state changes for debugging
  useEffect(() => {
    console.log('[ModalNetwork] ===== Globus Redux State =====');
    console.log('[ModalNetwork] login_pending:', globus.login_pending);
    console.log('[ModalNetwork] login_url:', globus.login_url);
    console.log('[ModalNetwork] access_code:', globus.access_code);
    console.log('[ModalNetwork] api_auth:', globus.api_auth);
    console.log('[ModalNetwork] login_error:', globus.login_error);
    console.log('[ModalNetwork] login_error_message:', globus.login_error_message);
    console.log('[ModalNetwork] authorization_code_input:', globus.authorization_code_input);
    console.log('[ModalNetwork] cli_available:', globus.cli_available);
    
    // Log which UI branches will be rendered
    const showLoginButton = !globus.api_auth && !globus.login_pending;
    const showLogoutButton = !!globus.api_auth;
    const showUrlSection = globus.login_pending && globus.login_url;
    const showInputField = globus.login_pending;
    
    console.log('[ModalNetwork] UI branch decisions:');
    console.log('[ModalNetwork]   showLoginButton:', showLoginButton, '(api_auth:', globus.api_auth, 'login_pending:', globus.login_pending, ')');
    console.log('[ModalNetwork]   showLogoutButton:', showLogoutButton, '(api_auth:', globus.api_auth, ')');
    console.log('[ModalNetwork]   showUrlSection:', showUrlSection, '(login_pending:', globus.login_pending, 'login_url:', !!globus.login_url, ')');
    console.log('[ModalNetwork]   showInputField:', showInputField, '(login_pending:', globus.login_pending, ')');
    console.log('[ModalNetwork] ===== End Globus State =====');
  }, [globus.login_pending, globus.login_url, globus.access_code, globus.api_auth, globus.login_error, globus.login_error_message, globus.authorization_code_input, globus.cli_available]);

  const qr_mode_options = [
    { label: 'Encode Filename', value: 'user_defined', description: 'Use rename column featuring output filename' },
    { label: 'Encode UUID', value: 'uuid', description: 'Use uuid value generated for file regardless of output filename. ' },
    { label: 'JSON from columns', value: 'column_fields', description: 'Use base64 encoded JSON from selected columns.' },
    { label: 'Single Column Value', value: 'column_field', description: 'Use text from a single column' },
  ]

  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const example_filename = '1234.tiff';
  const example_basename = return_filename_basename_from_filename(example_filename);
  const example_ext = return_file_extension_from_path(example_filename);
  const example_uuid = "acde070d-8c4c-4f0d-9d8a-162843c10333";
  const [rename, set_rename] = useState(example_basename);

  // let all_cols = [...reserved_cols, ...file_cols];

  let [all_cols, set_all_cols] = useState([...reserved_cols, ...file_cols]);
  let [column_options, set_column_options] = useState([]);

  useEffect(() => {
    let new_all_cols = [...reserved_cols, ...file_cols];

    set_all_cols(new_all_cols);

    let new_column_options = generate_dropdown_for_table_columns(new_all_cols, blocked_fields);

    set_column_options(new_column_options);

  }, [reserved_cols, file_cols]);


  function create_filename_example(example_basename) {
    let output_filename = ''
    if (filename_config.use_uuid) {
      output_filename += example_uuid;
    } else {
      output_filename += rename;
    }
    if (filename_config.use_prefix) {
      output_filename = filename_config.prefix + output_filename;
    }
    if (filename_config.use_suffix) {
      output_filename = output_filename + filename_config.suffix;
    }

    return output_filename;
  }

  return (
    <div className="__modal">
      <ModalHeader title={"Network"} type={"network_config"} network_type={modal.network_type} />
      {modal.network_type === "dsa" && render_network_config_dsa_content(dispatch, modal, dsa) }
      {modal.network_type === "globus" && render_network_config_globus_content(dispatch, modal, globus, {
        searchingEndpoints,
        endpointSearchError,
        endpointResults,
        findEndpoints,
        selectEndpoint,
        detectingLocalEndpoint,
        localEndpointDetectError,
        detectLocalEndpoint,
        clearLocalEndpointDetectError,
        debugLines,
        debugAutoScroll,
        setDebugAutoScroll,
        clearDebugLines,
        copyDebugLines,
      }) }
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalNetwork;