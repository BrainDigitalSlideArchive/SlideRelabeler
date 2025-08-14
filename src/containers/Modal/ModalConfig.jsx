import React, {useState, useLayoutEffect} from 'react';
import {useSelector, useDispatch} from "react-redux";

import * as config_actions from "../../actions/config";
import * as dsa_actions from "../../actions/dsa";

import ModalHeader from './ModalHeader';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import InputText from '../../components/controls/input/InputText';
import Dropdown from '../../components/controls/dropdown/Dropdown';
import Button from '../../components/controls/button/Button';
import {return_file_extension_from_path, return_filename_basename_from_filename} from "../../helpers/renderer_path_helpers";

function ModalConfig(props) {

  const fileCols = useSelector(state => state.files.fileCols);
  const filename_config = useSelector(state => state.config.filename);
  const csv = useSelector(state => state.config.csv);
  const label_config = useSelector(state => state.config.label);
  const wsi_config = useSelector(state => state.config.wsi);
  const dsa = useSelector(state => state.dsa);

  const { username, password, api_url, api_auth, login_error, login_error_message } = dsa;

  const dispatch = useDispatch();

  const qr_mode_options = [
    {label: 'Encode Filename', value: 'user_defined', description: 'Use rename column featuring output filename'},
    {label: 'Encode UUID', value: 'uuid', description: 'Use uuid value generated for file regardless of output filename. '},
    {label: 'JSON from columns', value: 'column_fields', description: 'Use base64 encoded JSON from selected columns.'},
    {label: 'Single Column Value', value: 'column_field', description: 'Use text from a single column'},
  ]

  let blocked_fields = [
    {'field': 'processed'}
  ]

  const example_filename  = '1234.tiff';
  const example_basename = return_filename_basename_from_filename(example_filename);
  const example_ext = return_file_extension_from_path(example_filename);
  const example_uuid = "acde070d-8c4c-4f0d-9d8a-162843c10333";
  const [rename, set_rename] = useState(example_basename);

  const column_options = [];
  for (let i = 0; i < fileCols.length; i++) {
    let file_col = fileCols[i];
    if (file_col.headerName && file_col.field && file_col.field && !blocked_fields.includes(file_col.field)) {
      column_options.push({label: fileCols[i].headerName, value: file_col.field});
    }
  }

  let expiration_date = null;
  if (api_auth) {
    expiration_date = new Date(api_auth.authToken.expires);
  }

  console.log(expiration_date);

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
      <ModalHeader title={"Configuration"} type={"config"}/>
      <div className={"__content"}>
        <div className={"__divider"}/>
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Filename</div>
            <div className={"__config-control-section-description"}>
              Configure output filenames for deidentified files.
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox label={"Randomize"} checked={filename_config.use_uuid} onClick={() => dispatch({type: config_actions.TOGGLE_UUID})}/>
              <Checkbox label={"Use rename"} checked={!filename_config.use_uuid} onClick={() => dispatch({type: config_actions.TOGGLE_NON_RANDOM})}/>
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox label={"Add prefix"} checked={filename_config.use_prefix} onClick={() => dispatch({type: config_actions.TOGGLE_PREFIX})}/>
              <InputText disabled={!filename_config.use_prefix} label={"Prefix"} value={filename_config.prefix} onChange={(new_value) => dispatch({type: config_actions.CHANGE_PREFIX, payload: new_value})}/>
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox label={"Add suffix"} checked={filename_config.use_suffix} onClick={() => dispatch({type: config_actions.TOGGLE_SUFFIX})}/>
              <InputText disabled={!filename_config.use_suffix} label={"Suffix"} value={filename_config.suffix} onChange={(new_value) => dispatch({type: config_actions.CHANGE_SUFFIX, payload: new_value})}/>
            </div>
            <div className={"__config-control-section-infobox"}>
              <div className={"__infobox-title"}>
                Example output filename:
              </div>
              <div className={"__infobox-labels"}>
                <div className={"__infobox-label"}>
                  Filename:
                </div>
                <div className={"__infobox-label"}>
                  Rename column:
                </div>
                <div className={"__infobox-label"}>
                  Output filename:
                </div>
              </div>
              <div className={"__infobox-items"}>
                <div className={"__infobox-item"}>
                  {example_filename}
                </div>
                <div className={"__infobox-item"}>
                  {filename_config.use_prefix && <span>{filename_config.prefix}</span>}
                  <input className={"__input-text"} disabled={filename_config.use_uuid} value={filename_config.use_uuid? example_uuid : rename} onChange={(e) => set_rename(e.target.value)}/>
                  {filename_config.use_suffix && <span>{filename_config.suffix}</span>}
                  <span>.{example_ext}</span>
                </div>
                <div className={"__infobox-item"}>
                  {create_filename_example(rename) + '.' + example_ext}
                </div>
              </div>
            </div>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Whole slide image</div>
            <div className={"__config-control-section-description"}>
              Control whether the deidentified files contain macro images.
            </div>
            <Checkbox label={"Keep macro image"} checked={wsi_config.save_macro_image} onClick={() => dispatch({type: config_actions.TOGGLE_SAVE_MACRO})}/>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Label</div>
            <div className={"__config-control-section-description"}>
              Configure the generated label for deidentified files.
            </div>
            <div className={"__config-control-section-group"}>
              <div className={"__config-control-section-group"}>
                <Checkbox label={"Add Text"} checked={label_config.add_text} onClick={() => dispatch({type: config_actions.TOGGLE_ADD_LABEL_TEXT})}/>
                <Dropdown disabled={!label_config.add_text} multiSelect={false} items={column_options} label={"Column"} placeholder={"Select column"} selectedItems={label_config.text_column_field? [label_config.text_column_field] : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_TEXT_COLUMN_FIELD, payload: item})}/>
              </div>
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox label={"Add icon"} checked={label_config.add_icon} onClick={() => dispatch({type: config_actions.TOGGLE_ADD_ICON})}/>
              <Button disabled={!label_config.add_icon} text={"Select icon (file)"} onClick={() => dispatch({type: config_actions.SELECT_ICON_FILE})} result={label_config.icon_file && label_config.icon_file.source.path} />
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox label={"Add code QR"} checked={label_config.add_qr} onClick={() => dispatch({type: config_actions.TOGGLE_ADD_LABEL_QR})}/>
              <Dropdown items={qr_mode_options} show_selected_descriptions={true} placeholder={"QR mode"} selectedItems={[label_config.qr_mode]} onSelect={(item) => dispatch({type: config_actions.CHANGE_QR_MODE, payload: item})}/>
            </div>
            <div className={"__config-control-section-group"}>
              <div className={"__config-control-section-space-holder"}/>
              {
                label_config.qr_mode.value === qr_mode_options[3].value? <Dropdown disabled={label_config.qr_mode.value !== qr_mode_options[3].value} multiSelect={false} items={column_options} label={"QR column field/s"} placeholder={"Select column"} selectedItems={label_config.qr_column_field? [label_config.qr_column_field] : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_QR_COLUMN_FIELD, payload: item})}/> :
                  <Dropdown disabled={label_config.qr_mode.value !== qr_mode_options[2].value} multiSelect={true} items={column_options} label={"QR column field/s"} placeholder={"Select columns"} selectedItems={label_config.qr_column_fields} onSelect={(item) => dispatch({type: config_actions.CHANGE_QR_COLUMN_FIELDS, payload: item})}/>
              }
            </div>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>CSV</div>
            <div className={"__config-control-section-description"}>
              Save table to CSV file to the output directory as deid_output.csv.
            </div>
            <Checkbox label={"Save CSV"} checked={csv.save_csv} onClick={() => dispatch({type: config_actions.TOGGLE_SAVE_CSV})}/>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>DSA</div>
            <div className={"__config-control-section-description"}>
              Configure the DSA connection for transfering deidentified files to the DSA.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <InputText disabled={api_auth} error={login_error} label={"API URL"} value={api_url? api_url : ''} onChange={(new_value) => dispatch({type: dsa_actions.SET_DSA_API_URL, payload: new_value})}/>
                <InputText disabled={api_auth} error={login_error} label={"Username"} value={username? username : ''} onChange={(new_value) => dispatch({type: dsa_actions.SET_DSA_USERNAME, payload: new_value})}/>
                <InputText disabled={api_auth} error={login_error} type={"password"} label={"Password"} value={password? password : ''} onChange={(new_value) => dispatch({type: dsa_actions.SET_DSA_PASSWORD, payload: new_value})}/>
                {
                      !api_auth? 
                      <Button disabled={!(username !== '' && password !== '' && !api_auth)} text={"Login"} onClick={() => dispatch({type: dsa_actions.LOGIN, payload: {api_url, username, password}})}/> :
                      <Button disabled={!(username !== '' && password !== '' && api_auth)} text={"Logout"} onClick={() => dispatch({type: dsa_actions.LOGOUT})}/>
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
            
          </div>
        </div>
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalConfig;