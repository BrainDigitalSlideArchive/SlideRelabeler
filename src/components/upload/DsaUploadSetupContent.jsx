import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as dsa_actions from '../../actions/dsa';
import * as config_actions from '../../actions/config';
import { getPatternPlaceholderCatalog } from '../../helpers/pattern_engine.js';
import Checkbox from '../controls/checkbox/Checkbox';
import InputText from '../controls/input/InputText';
import Button from '../controls/button/Button';
import DsaAliasEditor from '../config/DsaAliasEditor';

function dsaFolderExistsStyle(dsaFolderExists) {
  if (dsaFolderExists === null) {
    return {};
  }
  if (dsaFolderExists) {
    return { borderColor: 'green', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'green' };
  }
  return { borderColor: 'red', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'red' };
}

export default function DsaUploadSetupContent() {
  const dispatch = useDispatch();
  const dsa = useSelector((state) => state.dsa);
  const dsa_upload = useSelector((state) => state.config.dsa_upload);
  const config = useSelector((state) => state.config);
  const file_rows = useSelector((state) => state.files.file_rows);
  const file_cols = useSelector((state) => state.files.file_cols);

  const {
    folder_id,
    username,
    password,
    api_url,
    api_auth,
    login_error,
    login_error_message,
    dsa_folder_exists,
    dsa_folder_error_message,
  } = dsa;

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const placeholderCatalog = useMemo(
    () => getPatternPlaceholderCatalog({
      field: 'dsaAlias',
      fileRows: file_rows,
      fileCols: file_cols,
      hasLoadedFiles,
      csvConfig: config?.csv,
    }),
    [file_rows, file_cols, hasLoadedFiles, config?.csv],
  );

  let expirationDate = null;
  if (api_auth) {
    expirationDate = new Date(api_auth.authToken.expires);
  }

  return (
    <>
      <div className="__divider" />
      <div className="__config-controls">
        <div className="__config-control-section">
          <div className="__config-control-section-title">DSA</div>
          <div className="__config-control-section-description">
            Sign in and set the folder where deidentified files will be uploaded.
          </div>
          <div className="__config-control-section-dsa-group">
            <div className="__config-control-section-dsa-subgroup">
              <InputText disabled={api_auth} error={login_error} label="API URL" value={api_url ? api_url : ''} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_API_URL, payload: new_value })} />
              <InputText disabled={api_auth} error={login_error} label="Username" value={username ? username : ''} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_USERNAME, payload: new_value })} />
              <InputText disabled={api_auth} error={login_error} type="password" label="Password" value={password ? password : ''} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_PASSWORD, payload: new_value })} />
              {
                !api_auth
                  ? <Button extra_class_name="_align-center" disabled={!(username !== '' && password !== '' && !api_auth)} text="Login" onClick={() => dispatch({ type: dsa_actions.LOGIN, payload: { api_url, username, password } })} />
                  : <Button extra_class_name="_align-center" disabled={!(username !== '' && password !== '' && api_auth)} text="Logout" onClick={() => dispatch({ type: dsa_actions.LOGOUT })} />
              }
              {
                login_error && <div className="__config-control-section-error">{login_error_message}</div>
              }
            </div>
            <div className="__config-control-section-dsa-subgroup">
              {
                api_auth && (
                  <div className="__dsa-auth-group">
                    <div className="__dsa-auth-item">
                      <div className="__dsa-auth-item-label">API URL:</div>
                      <div className="__dsa-auth-item-value">{api_url}</div>
                    </div>
                    <div className="__dsa-auth-item">
                      <div className="__dsa-auth-item-label">Username:</div>
                      <div className="__dsa-auth-item-value">{username}</div>
                    </div>
                    <div className="__dsa-auth-item">
                      <div className="__dsa-auth-item-label">Expiration:</div>
                      <div className="__dsa-auth-item-value">{expirationDate.toString()}</div>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
          <div className="__divider" />
          <div className="__config-control-section-title">DSA folder</div>
          <div className="__config-control-section-description">
            Folder ID used when DSA is the upload destination.
          </div>
          <div className="__config-control-section-dsa-group">
            <div className="__config-control-section-dsa-subgroup">
              <InputText tooltip={dsa_folder_error_message ? dsa_folder_error_message : null} input_style={dsaFolderExistsStyle(dsa_folder_exists)} label="DSA folder ID" value={folder_id} onChange={(new_value) => dispatch({ type: dsa_actions.SET_DSA_FOLDER_ID, payload: new_value })} />
            </div>
          </div>
          <div className="__divider" />
          <div className="__config-control-section-title">After upload (optional)</div>
          <div className="__config-control-section-description">
            Uploaded files keep their system file ID name on the server. These options affect the Girder item display name and metadata.
          </div>
          <Checkbox
            label="Set catalog display name after upload"
            checked={!!dsa_upload?.rename_item_after_upload}
            onClick={() => dispatch({
              type: config_actions.SET_DSA_UPLOAD_CONFIG,
              payload: { rename_item_after_upload: !dsa_upload?.rename_item_after_upload },
            })}
          />
          <div className="__config-control-subsection-note-description">
            Uses the DSA alias (+ file extension) from each row when rename is enabled below.
          </div>
          <DsaAliasEditor
            dsaUploadConfig={dsa_upload || {}}
            disabled={false}
            placeholderCatalog={placeholderCatalog}
            onRecompute={() => dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING })}
          />
          <Checkbox
            label="Attach deidUpload metadata to DSA item"
            checked={!!dsa_upload?.set_item_metadata}
            onClick={() => dispatch({
              type: config_actions.SET_DSA_UPLOAD_CONFIG,
              payload: { set_item_metadata: !dsa_upload?.set_item_metadata },
            })}
          />
        </div>
      </div>
    </>
  );
}
