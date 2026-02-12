import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";

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

function render_network_config_globus_content(dispatch, modal, globus) {
  const { network_type } = modal;
  const { collection_name, collection_path, source_endpoint, api_auth, login_error, login_error_message, login_url, access_code, login_pending, authorization_code_input, upload, delete_after, globus_collection_exists, globus_collection_error_message, cli_available, disable_ssl_verification } = globus;

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
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                {
                  login_pending && login_url && (
                    <div style={{ 
                      padding: '1em', 
                      backgroundColor: '#e7f3ff', 
                      border: '1px solid #b3d9ff', 
                      borderRadius: '4px', 
                      marginBottom: '1em' 
                    }}>
                      <div style={{ marginBottom: '0.5em' }}>
                        <strong>Step 1: Visit this URL:</strong>
                        <div style={{ 
                          marginTop: '0.25em', 
                          padding: '0.5em', 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #ccc',
                          borderRadius: '2px',
                          wordBreak: 'break-all',
                          fontSize: '0.9em'
                        }}>
                          {login_url}
                        </div>
                        <Button 
                          text="Copy URL" 
                          onClick={() => navigator.clipboard.writeText(login_url)}
                          extra_class_name="_align-center"
                          style={{ marginTop: '0.25em' }}
                        />
                      </div>
                      
                      {access_code && (
                        <div style={{ marginBottom: '0.5em' }}>
                          <strong>Step 2: Enter this access code in your browser:</strong>
                          <div style={{ 
                            marginTop: '0.25em', 
                            padding: '0.5em', 
                            backgroundColor: '#fff3cd', 
                            border: '1px solid #ffc107',
                            borderRadius: '2px',
                            fontFamily: 'monospace',
                            fontSize: '1.2em',
                            textAlign: 'center'
                          }}>
                            {access_code}
                          </div>
                          <Button 
                            text="Copy Code" 
                            onClick={() => navigator.clipboard.writeText(access_code)}
                            extra_class_name="_align-center"
                            style={{ marginTop: '0.25em' }}
                          />
                        </div>
                      )}
                      
                      <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                        After completing authentication in your browser, you will receive an authorization code. Enter that code below.
                      </div>
                    </div>
                  )
                }
                
                {
                  login_pending && (
                    <div style={{ marginBottom: '1em' }}>
                      {!login_url && (
                        <div style={{ 
                          padding: '0.75em', 
                          backgroundColor: '#fff3cd', 
                          border: '1px solid #ffc107', 
                          borderRadius: '4px', 
                          marginBottom: '1em',
                          fontSize: '0.9em'
                        }}>
                          <strong>Warning:</strong> Login is pending but no URL was received. Please try logging in again.
                        </div>
                      )}
                      <InputText
                        label="Authorization Code (from browser)"
                        value={authorization_code_input || ''}
                        onChange={(new_value) => dispatch({ type: globus_actions.SET_AUTHORIZATION_CODE_INPUT, payload: new_value })}
                        placeholder="Enter the authorization code shown in your browser"
                        style={{ marginBottom: '0.5em' }}
                      />
                      <Button 
                        text="Submit Code" 
                        onClick={() => dispatch({ type: globus_actions.SUBMIT_AUTHORIZATION_CODE })}
                        extra_class_name="_align-center"
                        disabled={!authorization_code_input || !authorization_code_input.trim()}
                        style={{ marginBottom: '0.5em' }}
                      />
                      <div style={{ fontSize: '0.9em', color: '#666', textAlign: 'center', marginTop: '0.5em' }}>
                        Or click "Check Auth Status" if you've already submitted the code.
                      </div>
                      <Button 
                        text="Check Auth Status" 
                        onClick={() => dispatch({ type: globus_actions.CHECK_AUTH })}
                        extra_class_name="_align-center"
                      />
                    </div>
                  )
                }
                {
                  // Defensive check: if we have a URL but login_pending is false, show a message
                  login_url && !login_pending && !api_auth && (
                    <div style={{ 
                      padding: '0.75em', 
                      backgroundColor: '#f8d7da', 
                      border: '1px solid #dc3545', 
                      borderRadius: '4px', 
                      marginBottom: '1em',
                      fontSize: '0.9em'
                    }}>
                      <strong>State Inconsistency Detected:</strong> A login URL exists but login is not marked as pending. 
                      Please try logging in again or check the console for errors.
                    </div>
                  )
                }
                
                {
                  (() => {
                    const showLogin = !api_auth && !login_pending;
                    const showLogout = !!api_auth;
                    console.log('[ModalNetwork] Button rendering decision:', {
                      api_auth,
                      login_pending,
                      cli_available,
                      showLogin,
                      showLogout,
                      willShowLogin: showLogin,
                      willShowLogout: showLogout,
                      willShowNothing: !showLogin && !showLogout
                    });
                    
                    if (showLogin) {
                      console.log('[ModalNetwork] Rendering Login button, disabled:', !cli_available);
                      return <Button extra_class_name={"_align-center"} disabled={!cli_available} text={"Login"} onClick={() => {
                        console.log('[ModalNetwork UI] Login button clicked, dispatching LOGIN action');
                        dispatch({ type: globus_actions.LOGIN });
                        console.log('[ModalNetwork UI] LOGIN action dispatched');
                      }} />;
                    } else if (showLogout) {
                      console.log('[ModalNetwork] Rendering Logout button');
                      return <Button extra_class_name={"_align-center"} text={"Logout"} onClick={() => {
                        console.log('[ModalNetwork] Logout button clicked');
                        dispatch({ type: globus_actions.LOGOUT });
                      }} />;
                    } else {
                      console.log('[ModalNetwork] Rendering nothing (buttons hidden)');
                      return null;
                    }
                  })()
                }
                {
                  login_error && <div className={"__config-control-section-error"}>{login_error_message}</div>
                }
                {
                  api_auth && (
                    <div className={"__dsa-auth-group"} style={{ marginTop: '1em' }}>
                      <div className={"__dsa-auth-item"}>
                        <div className={"__dsa-auth-item-label"}>
                          Status:
                        </div>
                        <div className={"__dsa-auth-item-value"}>
                          Authenticated
                        </div>
                      </div>
                    </div>
                  )
                }
                <div style={{ marginTop: '1em', padding: '0.75em', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                  <Checkbox 
                    label={"Disable SSL Verification (testing only)"} 
                    checked={disable_ssl_verification || false} 
                    onClick={async () => {
                      const newValue = !disable_ssl_verification;
                      dispatch({ type: globus_actions.TOGGLE_SSL_VERIFICATION });
                      // Also update the GlobusAPI instance
                      await window.electronAPI.globusSetSslVerification(newValue);
                    }} 
                  />
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.5em', fontStyle: 'italic' }}>
                    <strong>Warning:</strong> This should only be used in development environments with SSL-inspecting firewalls. 
                    Disabling SSL verification reduces security and should not be used in production.
                  </div>
                </div>
              </div>
            </div>
            <div className={"__divider"} />
            <div className={"__config-control-section-title"}>Upload Configuration</div>
            <div className={"__config-control-section-description"}>
              Configure collection paths and upload settings.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <InputText 
                  label={"Collection Name (default)"} 
                  value={collection_name || ''} 
                  onChange={(new_value) => dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_NAME, payload: new_value })} 
                  tooltip="Default collection name to use when constructing paths"
                />
                <InputText 
                  tooltip={globus_collection_error_message ? globus_collection_error_message : null} 
                  input_style={globus_collection_exists_style(globus_collection_exists)} 
                  label={"Collection Path"} 
                  value={collection_path || ''} 
                  onChange={(new_value) => dispatch({ type: globus_actions.SET_GLOBUS_COLLECTION_PATH, payload: new_value })} 
                  placeholder="collectionname#/path/to/folder"
                />
                <InputText 
                  label={"Source Endpoint"} 
                  value={source_endpoint || ''} 
                  onChange={(new_value) => dispatch({ type: globus_actions.SET_GLOBUS_SOURCE_ENDPOINT, payload: new_value })} 
                  placeholder="endpoint-id:/path/to/file"
                  tooltip="For local files, use Globus Connect Personal endpoint. Format: endpoint-id:/full/path/to/file"
                />
                <Checkbox label={"Upload"} checked={upload} onClick={() => dispatch({ type: globus_actions.TOGGLE_UPLOAD_TO_GLOBUS })} />
                <Checkbox label={"Delete local after"} checked={delete_after} onClick={() => dispatch({ type: globus_actions.TOGGLE_DELETE_AFTER_GLOBUS_UPLOAD })} />
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

  const dispatch = useDispatch();

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
      {modal.network_type === "globus" && render_network_config_globus_content(dispatch, modal, globus) }
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalNetwork;