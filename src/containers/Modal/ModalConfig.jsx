import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from "react-redux";

import * as config_actions from "../../actions/config";
import * as app_actions from "../../actions/app";

import ModalHeader from './ModalHeader';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import InputText from '../../components/controls/input/InputText';
import Dropdown from '../../components/controls/dropdown/Dropdown';
import Button from '../../components/controls/button/Button';
import {return_file_extension_from_path, return_filename_basename_from_filename} from "../../helpers/renderer_path_helpers";
import {generate_dropdown_for_table_columns} from "../../helpers/fe_helpers";

function ModalConfig(props) {

  const file_cols = useSelector(state => state.files.file_columns);
  const reserved_cols = useSelector(state => state.files.reserved_columns);
  const filename_config = useSelector(state => state.config.filename);
  const csv_config = useSelector(state => state.config.csv);
  const label_config = useSelector(state => state.config.label);
  const wsi_config = useSelector(state => state.config.wsi);
  const debug_config = useSelector(state => state.config.debug);
  const processing = useSelector(state => state.files.processing);
  const disable_changes = useSelector(state => state.files.disable_changes);

  const dispatch = useDispatch();

  const qr_mode_options = [
    {label: 'Encode Filename', value: 'user_defined', description: 'Use rename column featuring output filename'},
    {label: 'Encode UUID', value: 'uuid', description: 'Use uuid value generated for file regardless of output filename. '},
    {label: 'JSON from columns', value: 'column_fields', description: 'Use base64 encoded JSON from selected columns.'},
    {label: 'Single Column Value', value: 'column_field', description: 'Use text from a single column'},
  ]

  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const example_filename  = '1234.tiff';
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
              <Checkbox disabled={processing || disable_changes} label={"Randomize"} checked={filename_config.use_uuid} onClick={() => dispatch({type: config_actions.TOGGLE_UUID})}/>
              <Checkbox disabled={processing || disable_changes} label={"Use rename"} checked={!filename_config.use_uuid} onClick={() => dispatch({type: config_actions.TOGGLE_NON_RANDOM})}/>
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Add prefix"} checked={filename_config.use_prefix} onClick={() => dispatch({type: config_actions.TOGGLE_PREFIX})}/>
              <InputText disabled={processing || disable_changes || !filename_config.use_prefix} label={"Prefix"} value={filename_config.prefix} onChange={(new_value) => dispatch({type: config_actions.CHANGE_PREFIX, payload: new_value})}/>
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Add suffix"} checked={filename_config.use_suffix} onClick={() => dispatch({type: config_actions.TOGGLE_SUFFIX})}/>
              <InputText disabled={processing || disable_changes || !filename_config.use_suffix} label={"Suffix"} value={filename_config.suffix} onChange={(new_value) => dispatch({type: config_actions.CHANGE_SUFFIX, payload: new_value})}/>
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
                  <input className={processing || disable_changes? "__input-text _disabled" : "__input-text"} disabled={processing || disable_changes || filename_config.use_uuid} value={filename_config.use_uuid? example_uuid : rename} onChange={(e) => set_rename(e.target.value)}/>
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
            <Checkbox disabled={processing || disable_changes} label={"Keep macro image"} checked={wsi_config.save_macro_image} onClick={() => dispatch({type: config_actions.TOGGLE_SAVE_MACRO})}/>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Label</div>
            <div className={"__config-control-section-description"}>
              Configure the generated label for deidentified files.
            </div>
            <div className={"__config-control-section-group"}>
              <div className={"__config-control-section-group"}>
                <Checkbox disabled={processing || disable_changes} label={"Add Text"} checked={label_config.add_text} onClick={() => dispatch({type: config_actions.TOGGLE_ADD_LABEL_TEXT})}/>
                <Dropdown disabled={processing || disable_changes || !label_config.add_text} multiSelect={false} items={column_options} label={"Column"} placeholder={"Select column"} selectedItems={label_config.text_column_field? [label_config.text_column_field] : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_TEXT_COLUMN_FIELD, payload: item})}/>
              </div>
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Add icon"} checked={label_config.add_icon} onClick={() => dispatch({type: config_actions.TOGGLE_ADD_ICON})}/>
              <Button disabled={processing || disable_changes || !label_config.add_icon} text={"Select icon (file)"} onClick={() => dispatch({type: config_actions.SELECT_ICON_FILE})} result={label_config.icon_file && label_config.icon_file.source.path} />
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Add code QR"} checked={label_config.add_qr} onClick={() => dispatch({type: config_actions.TOGGLE_ADD_LABEL_QR})}/>
              <Dropdown disabled={processing || disable_changes || !label_config.add_qr} items={qr_mode_options} show_selected_descriptions={true} placeholder={"QR mode"} selectedItems={[label_config.qr_mode]} onSelect={(item) => dispatch({type: config_actions.CHANGE_QR_MODE, payload: item})}/>
            </div>
            <div className={"__config-control-section-group"}>
              <div className={"__config-control-section-space-holder"}/>
              {
                label_config.qr_mode.value === qr_mode_options[3].value? <Dropdown disabled={processing || disable_changes || label_config.qr_mode.value !== qr_mode_options[3].value} multiSelect={false} items={column_options} label={"QR column field/s"} placeholder={"Select column"} selectedItems={label_config.qr_column_field? [label_config.qr_column_field] : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_QR_COLUMN_FIELD, payload: item})}/> :
                  <Dropdown disabled={processing || disable_changes || label_config.qr_mode.value !== qr_mode_options[2].value} multiSelect={true} items={column_options} label={"QR column field/s"} placeholder={"Select columns"} selectedItems={label_config.qr_column_fields} onSelect={(item) => dispatch({type: config_actions.CHANGE_QR_COLUMN_FIELDS, payload: item})}/>
              }
            </div>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>CSV</div>
            <div className={"__config-control-section-description"}>
             CSV input and output settings.
            </div>
            <div className={"__config-control-section-container"}>
              
              <div className={"__config-control-subsection"}>
                <div className={"__config-control-subsection-title"}>Input</div>
                <div className={"__config-control-subsection-description"}>
                  Control the columns in an input CSV file which get interpreted as relevant input and output fields.
                </div>
                <div className={"__config-control-subsection-row-header"}>
                  <div className={"__config-control-subsection-row-label"}>
                    &nbsp;
                  </div>
                  <div className={"__config-control-subsection-row-column"}>Column:</div>
                </div>
                <div className={"__config-control-subsection-row"}>
                  {/* <Dropdown disabled={processing || disable_changes} items={column_options} label={"File location (required)"} placeholder={"Select column"} selectedItems={csv_config.file_path_column? column_options.filter(option => option.value === csv_config.file_path_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_PATH_COLUMN, payload: item.value})}/> */}
                  <InputText disabled={processing || disable_changes} label={"File location (required)"} value={csv_config.file_path_column} onChange={(new_value) => dispatch({type: config_actions.CHANGE_FILE_PATH_COLUMN, payload: new_value})}/>
                </div>
                <div className={"__config-control-subsection-row"}>
                  {/* <Dropdown disabled={processing || disable_changes} items={column_options} label={"Rename (optional)"} placeholder={"Select column"} selectedItems={csv_config.file_rename_column? column_options.filter(option => option.value === csv_config.file_rename_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: item.value})}/> */}
                  <InputText disabled={processing || disable_changes} label={"Rename (optional)"} value={csv_config.file_rename_column} onChange={(new_value) => dispatch({type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: new_value})}/>
                </div>
                <div className={"__config-control-subsection-row"}>
                  {/* <Dropdown disabled={processing || disable_changes} items={column_options} label={"Destination directory (optional)"} placeholder={"Select column"} selectedItems={csv_config.file_destination_directory_column? column_options.filter(option => option.value === csv_config.file_destination_directory_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, payload: item.value})}/> */}
                  <InputText disabled={processing || disable_changes} label={"Destination directory (optional)"} value={csv_config.file_destination_directory_column} onChange={(new_value) => dispatch({type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, payload: new_value})}/>
                </div>
                <div className={"__config-control-subsection-note"}>
                  <div className={"__config-control-subsection-note-title"}>
                    Note:
                  </div>
                  <div className={"__config-control-subsection-note-description"}>
                    <p>The CSV input file can feature any column with the purpose of linking metadata to deidentified files.</p>
                    <p>The CSV input file can feature should feature at least path one column <b>"{csv_config.file_path_column}"</b> that features a full path to file.</p>
                    <p>The CSV input file can also feature a rename column <b>"{csv_config.file_rename_column}"</b> that will be used an initial possible filename for the respective output file.</p>
                    <p>The CSV input file can also feature a destination directory column <b>"{csv_config.file_destination_directory_column}"</b> that will be used as the output directory for the respective output file.  If the column is not provided, you must select an output directory.</p>
                    <p>The provided columns are case-sensitive.</p>
                  </div>
                </div>
              </div>
              <div className={"__config-control-subsection"}>
                <div className={"__config-control-subsection-title"}>Output</div>
                <div className={"__config-control-subsection-description"}>
                  Control whether or not to save a CSV file to the output directory.
                </div>
                <Checkbox disabled={processing || disable_changes} label={"Save CSV"} checked={csv_config.save_csv} onClick={() => dispatch({type: config_actions.TOGGLE_SAVE_CSV})}/>
                <div className={"__config-control-subsection-note"}>
                  <div className={"__config-control-subsection-note-title"}>
                    Note:
                  </div>
                  <div className={"__config-control-subsection-note-description"}>
                    The output CSV file will be saved to the output directory as deid_output.csv.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Debug</div>
            <div className={"__config-control-section-description"}>
              Enable debug messages to be displayed in the debug modal.
            </div>
            <Checkbox label={"Enable debug"} checked={debug_config.enable_debug} onClick={() => dispatch({type: config_actions.TOGGLE_ENABLE_DEBUG})}/>
          </div>
          <div className={"__divider"}/>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Reset</div>
            <div className={"__config-control-section-description"}>
              Reset the application's front end state back to default.  Using this feature will immediately cause the application to exit.
              Please manually restart the application after using this feature.
            </div>
            <Button text={"Reset"} onClick={() => dispatch({type: app_actions.DELETE_STORE})}/>
          </div>
        </div>
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalConfig;