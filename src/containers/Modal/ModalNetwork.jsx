import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";

import * as config_actions from "../../actions/config";
import * as app_actions from "../../actions/app";
import * as dsa_actions from "../../actions/dsa";

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

function ModalNetwork(props) {
  const file_cols = useSelector(state => state.files.file_columns);
  const reserved_cols = useSelector(state => state.files.reserved_columns);
  const filename_config = useSelector(state => state.config.filename);
  const dsa = useSelector(state => state.dsa);
  const modal = useSelector(state => state.modal);

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
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalNetwork;