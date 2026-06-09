import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from "react-redux";

import * as config_actions from "../../actions/config";
import * as app_actions from "../../actions/app";
import ModalHeader from './ModalHeader';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import InputText from '../../components/controls/input/InputText';
import Dropdown from '../../components/controls/dropdown/Dropdown';
import Button from '../../components/controls/button/Button';
import { return_file_extension_from_path, return_filename_basename_from_filename } from "../../helpers/renderer_path_helpers";
import { generate_dropdown_for_table_columns } from "../../helpers/fe_helpers";
import { previewLabelStrings } from '../../helpers/label_config_preview';
import LabelCompositionPanel from '../../components/config/LabelCompositionPanel';
import LabelContentBuilder from '../../components/config/LabelContentBuilder';
import DeIdTokenCard from '../../components/config/DeIdTokenCard';
import LabelConfigPreview from '../../components/config/LabelConfigPreview';
import LabelThumbnailPreview from '../../components/config/LabelThumbnailPreview';

function ModalConfig(props) {

  const file_cols = useSelector(state => state.files.file_columns);
  const reserved_cols = useSelector(state => state.files.reserved_columns);
  const filename_config = useSelector(state => state.config.filename);
  const csv_config = useSelector(state => state.config.csv);
  const label_config = useSelector(state => state.config.label);
  const naming_config = useSelector(state => state.config.naming);
  const wsi_config = useSelector(state => state.config.wsi);
  const debug_config = useSelector(state => state.config.debug);
  const processing = useSelector(state => state.files.processing);
  const copy_config = useSelector(state => state.config.copy);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const file_rows = useSelector(state => state.files.file_rows);
  const config = useSelector(state => state.config);
  const dsa = useSelector(state => state.dsa);

  const { api_auth } = dsa;

  const dispatch = useDispatch();

  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const example_filename = '1234.tiff';
  const example_basename = return_filename_basename_from_filename(example_filename);
  const example_ext = return_file_extension_from_path(example_filename);
  const example_uuid = "acde070d-8c4c-4f0d-9d8a-162843c10333";
  const [rename, set_rename] = useState(example_basename);
  const [previewRowSource, setPreviewRowSource] = useState('sample');

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const firstFileRow = hasLoadedFiles ? file_rows[0] : null;
  const previewFilePath = firstFileRow?.__reserved?.source?.path ?? null;

  const sampleRow = useMemo(() => ({
    BlockId: 'B12',
    StainId: 'HE',
    SlideNum: '1',
    Accession: 'DEMO_ACC',
    __reserved: { uuid: example_uuid, rename: rename },
  }), [rename, example_uuid]);

  const activePreviewRow = useMemo(() => {
    if (previewRowSource === 'first' && firstFileRow) return firstFileRow;
    return sampleRow;
  }, [previewRowSource, firstFileRow, sampleRow]);

  const resolvedPreview = useMemo(
    () => previewLabelStrings(config, activePreviewRow, {
      usingSample: !hasLoadedFiles,
    }),
    [config, activePreviewRow, hasLoadedFiles],
  );

  const controlsDisabled = processing || disable_changes;

  function triggerRecompute() {
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

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

  let expiration_date = null;
  if (api_auth) {
    expiration_date = new Date(api_auth.authToken.expires);
  }

  return (
    <div className="__modal">
      <ModalHeader title={"Configuration"} type={"config"} />
      <div className={"__content"}>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Filename</div>
            <div className={"__config-control-section-description"}>
              Configure output filenames for deidentified files.
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Randomize"} checked={filename_config.use_uuid} onClick={() => dispatch({ type: config_actions.TOGGLE_UUID })} />
              <Checkbox disabled={processing || disable_changes} label={"Use rename"} checked={!filename_config.use_uuid} onClick={() => dispatch({ type: config_actions.TOGGLE_NON_RANDOM })} />
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Add prefix"} checked={filename_config.use_prefix} onClick={() => dispatch({ type: config_actions.TOGGLE_PREFIX })} />
              <InputText disabled={processing || disable_changes || !filename_config.use_prefix} label={"Prefix"} value={filename_config.prefix} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_PREFIX, payload: new_value })} />
            </div>
            <div className={"__config-control-section-group"}>
              <Checkbox disabled={processing || disable_changes} label={"Add suffix"} checked={filename_config.use_suffix} onClick={() => dispatch({ type: config_actions.TOGGLE_SUFFIX })} />
              <InputText disabled={processing || disable_changes || !filename_config.use_suffix} label={"Suffix"} value={filename_config.suffix} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_SUFFIX, payload: new_value })} />
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
                  <input className={processing || disable_changes ? "__input-text _disabled" : "__input-text"} disabled={processing || disable_changes || filename_config.use_uuid} value={filename_config.use_uuid ? example_uuid : rename} onChange={(e) => set_rename(e.target.value)} />
                  {filename_config.use_suffix && <span>{filename_config.suffix}</span>}
                  <span>.{example_ext}</span>
                </div>
                <div className={"__infobox-item"}>
                  {create_filename_example(rename) + '.' + example_ext}
                </div>
              </div>
            </div>
          </div>
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Whole slide image</div>
            <div className={"__config-control-section-description"}>
              Control whether the deidentified files contain macro images.
            </div>
            <Checkbox disabled={processing || disable_changes} label={"Keep macro image"} checked={wsi_config.save_macro_image} onClick={() => dispatch({ type: config_actions.TOGGLE_SAVE_MACRO })} />
          </div>
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Label</div>
            <div className={"__config-control-section-description"}>
              Configure the generated label for deidentified files.
            </div>

            <div className="label-config-section">
            <LabelCompositionPanel
              disabled={controlsDisabled}
              addText={label_config.add_text}
              addQr={label_config.add_qr}
              addIcon={label_config.add_icon}
              onToggleText={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_TEXT })}
              onToggleQr={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_QR })}
              onToggleIcon={() => dispatch({ type: config_actions.TOGGLE_ADD_ICON })}
              previewText={resolvedPreview.labelText}
              previewQr={resolvedPreview.qrPayload}
              iconPath={label_config.icon_file?.source?.path}
            />

            {(label_config.add_text || label_config.add_qr) && (
              <DeIdTokenCard
                disabled={controlsDisabled}
                namingConfig={naming_config}
                columnOptions={column_options}
                previewToken={resolvedPreview.deidToken}
                onNamingChange={(partial) => dispatch({ type: config_actions.SET_NAMING_CONFIG, payload: partial })}
                onRecompute={triggerRecompute}
              />
            )}

            {label_config.add_text && (
              <LabelContentBuilder
                kind="labelText"
                assemblyConfig={label_config.label_text_assembly || { mode: 'legacy', template: '', fieldsOrder: [], separator: '_' }}
                onChange={(cfg) => dispatch({ type: config_actions.SET_LABEL_TEXT_ASSEMBLY, payload: cfg })}
                onRecompute={triggerRecompute}
                columnOptions={column_options}
                disabled={controlsDisabled}
                exampleRow={activePreviewRow}
                exampleDeidToken={resolvedPreview.deidToken || naming_config?.accessionToken || 'CASE_DEMO'}
                textColumnField={label_config.text_column_field}
                onTextColumnChange={(item) => dispatch({ type: config_actions.CHANGE_TEXT_COLUMN_FIELD, payload: item })}
              />
            )}

            {label_config.add_qr && (
              <LabelContentBuilder
                kind="qrPayload"
                assemblyConfig={label_config.qr_assembly || { mode: 'legacy', template: '', fieldsOrder: [], separator: '' }}
                onChange={(cfg) => dispatch({ type: config_actions.SET_QR_ASSEMBLY, payload: cfg })}
                onRecompute={triggerRecompute}
                columnOptions={column_options}
                disabled={controlsDisabled}
                exampleRow={activePreviewRow}
                exampleDeidToken={resolvedPreview.deidToken || naming_config?.accessionToken || 'CASE_DEMO'}
                qrMode={label_config.qr_mode}
                onQrModeChange={(item) => dispatch({ type: config_actions.CHANGE_QR_MODE, payload: item })}
                qrColumnField={label_config.qr_column_field}
                onQrColumnFieldChange={(item) => dispatch({ type: config_actions.CHANGE_QR_COLUMN_FIELD, payload: item })}
                qrColumnFields={label_config.qr_column_fields}
                onQrColumnFieldsChange={(item) => dispatch({ type: config_actions.CHANGE_QR_COLUMN_FIELDS, payload: item })}
                filenameUsesUuid={filename_config.use_uuid}
              />
            )}

            {label_config.add_icon && (
              <div className={"__config-control-section-group"}>
                <Button
                  disabled={controlsDisabled}
                  text={"Select icon (file)"}
                  onClick={() => dispatch({ type: config_actions.SELECT_ICON_FILE })}
                  result={label_config.icon_file && label_config.icon_file.source.path}
                />
              </div>
            )}

            <LabelConfigPreview
              addText={label_config.add_text}
              addQr={label_config.add_qr}
              labelText={resolvedPreview.labelText}
              qrPayload={resolvedPreview.qrPayload}
              warnings={resolvedPreview.warnings}
              rowSource={hasLoadedFiles && previewRowSource === 'first' ? 'first' : 'sample'}
              onRowSourceChange={setPreviewRowSource}
              hasLoadedFiles={hasLoadedFiles}
              emptyFilesBanner={
                !hasLoadedFiles
                  ? 'Load files or import from eSM to pick metadata columns. Sample values used below.'
                  : null
              }
            />

            <LabelThumbnailPreview
              config={config}
              fileRow={activePreviewRow}
              filePath={previewFilePath}
              enabled={label_config.add_text || label_config.add_qr || label_config.add_icon}
            />
            </div>
          </div>
          <div className={"__divider"} />
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
                  <InputText disabled={processing || disable_changes} label={"File location (required)"} value={csv_config.file_path_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_PATH_COLUMN, payload: new_value })} />
                </div>
                <div className={"__config-control-subsection-row"}>
                  {/* <Dropdown disabled={processing || disable_changes} items={column_options} label={"Rename (optional)"} placeholder={"Select column"} selectedItems={csv_config.file_rename_column? column_options.filter(option => option.value === csv_config.file_rename_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: item.value})}/> */}
                  <InputText disabled={processing || disable_changes} label={"Rename (optional)"} value={csv_config.file_rename_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: new_value })} />
                </div>
                <div className={"__config-control-subsection-row"}>
                  {/* <Dropdown disabled={processing || disable_changes} items={column_options} label={"Destination directory (optional)"} placeholder={"Select column"} selectedItems={csv_config.file_destination_directory_column? column_options.filter(option => option.value === csv_config.file_destination_directory_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, payload: item.value})}/> */}
                  <InputText disabled={processing || disable_changes} label={"Destination directory (optional)"} value={csv_config.file_destination_directory_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, payload: new_value })} />
                </div>
                <div className={"__config-control-subsection-row _top-margin _align-center"}>
                  <Button text={"Export Sample CSV"} onClick={() => dispatch({ type: config_actions.EXPORT_SAMPLE_CSV_TEMPLATE })} tooltip={"Export a sample CSV file to the output directory using the currently loaded files as a template."} />
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
                <Checkbox disabled={processing || disable_changes} label={"Save CSV"} checked={csv_config.save_csv} onClick={() => dispatch({ type: config_actions.TOGGLE_SAVE_CSV })} />
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
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Copy</div>
            <div className={"__config-control-section-description"}>
              Enable copy mode to just copy files to output directory without deidentifying them.
            </div>
            <Checkbox label={"Enable copy mode"} checked={copy_config?.enable_copy_mode ?? false} onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_COPY_MODE })} />
          </div>
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Debug</div>
            <div className={"__config-control-section-description"}>
              Enable debug messages to be displayed in the debug modal.
            </div>
            <Checkbox label={"Enable debug"} checked={debug_config.enable_debug} onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_DEBUG })} />
          </div>
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Reset</div>
            <div className={"__config-control-section-description"}>
              Reset the application's front end state back to default.  Using this feature will immediately cause the application to exit.
              Please manually restart the application after using this feature.
            </div>
            <Button text={"Reset"} onClick={() => dispatch({ type: app_actions.DELETE_STORE })} />
          </div>
        </div>
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalConfig;