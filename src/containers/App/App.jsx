import React, {useEffect} from 'react';
import bdsaLogo from "../../assets/BDSA_folder_clear.png";
import {useSelector, useDispatch} from "react-redux";

import {Provider} from "react-redux";
import store from '../../store/index';

import * as modal_actions from '../../actions/modal';
import { selectUploadReadiness } from '../../selectors/uploadRouting';
import { selectOutputReadiness, summarizeDestinationDirectories } from '../../selectors/outputReadiness';
import * as file_actions from "../../actions/files";
import * as config_actions from "../../actions/config";
import * as debug_actions from "../../actions/debug";

import AppAgGrid from "../../components/AgGrid/AppAgGrid";
import FileHeaderInfo from "../../components/FileHeaderInfo/FileHeaderInfo";
import OutputDirectoryPanel from "../../components/OutputDirectoryPanel/OutputDirectoryPanel";

import './App.scss';
import Modal from "../Modal/Modal";

function render_cancel_clear_button(disable_changes, file_count, processing, dispatch) {
  return (
    <button 
        disabled={file_count === 0 || disable_changes} 
        className={file_count === 0 || disable_changes? "__button _negative _disabled" : "__button _negative"} 
        onClick={processing? () => dispatch({type: file_actions.CANCEL_PROCESS_FILES}) : () => dispatch({type: file_actions.CLEAR_FILES})}>
          {processing? "Cancel" : "Clear Files"}
    </button>
  )
}

function render_process_files_button(uploadRouting, uploadReadiness, outputReadiness, disable_changes, count, processing, dispatch) {
  let message = "";

  if (!outputReadiness.processReady) {
    if (outputReadiness.patternValidation?.blocking) {
      message = outputReadiness.patternValidation.messages?.[0]
        || 'Fix pattern column references before processing.';
    } else if (!outputReadiness.csvOutputReady) {
      message = "You need to select an output directory for your CSV file";
    } else {
      message = "You need to select an output directory for your output files";
    }
  }

  const autoUp = !!uploadRouting?.auto_upload;
  const processLabel = autoUp ? 'Process and Upload' : 'Process Files';

  return (
    <div className="__process-files">
      <button className={count === 0 || processing || !outputReadiness.processReady || disable_changes ? "__action-button _disabled" : "__action-button"}
              disabled={count === 0 || processing || !outputReadiness.processReady || disable_changes}
              onClick={() => dispatch({type: file_actions.PROCESS_FILES})}>
                {processLabel}
      </button>
      {autoUp && !uploadReadiness?.ready && (
        <div className="__process-files-upload-hint" title={uploadReadiness?.blockers?.join(' ')}>
          Open Network to finish connection — auto-upload is not ready yet.
        </div>
      )}
      {message.length > 0 && <div className="__process-files-message">{message}</div>}
    </div>
  )
}
const App = (props) => {
  // const { } = useSelector(state => state.app.get('app'));
  let output_dir = useSelector(state => state.files.output_dir);
  let input_dir = useSelector(state => state.files.input_dir);
  let totalBytes = useSelector(state => state.files.totalBytes);
  let count = useSelector(state => state.files.count);
  let processing = useSelector(state => state.files.processing);
  let disable_changes = useSelector(state => state.files.disable_changes);
  let debug_config = useSelector(state => state.config.debug);
  let csv = useSelector(state => state.files.csv);
  let file_rows = useSelector(state => state.files.file_rows);

  let uploadRouting = useSelector((state) => state.uploadRouting);
  let uploadReadiness = useSelector(selectUploadReadiness);
  let outputReadiness = useSelector(selectOutputReadiness);
  const networkGlobeClass =
    !uploadRouting.auto_upload
      ? '__button-icon'
      : uploadReadiness.ready
        ? '__button-icon _network-ready'
        : '__button-icon _network-warning';

  const dispatch = useDispatch();
  const destSummary = summarizeDestinationDirectories(file_rows);
  const showOutputDirPanel = csv.needs_output_dir || csv.needs_csv_output_dir || !csv.headers;
  const outputDirVariant = csv.needs_csv_output_dir ? 'csv' : 'slide';
  const panelOutputDir = csv.needs_csv_output_dir ? csv.output_dir : output_dir;
  const panelRequired = csv.needs_csv_output_dir
    ? outputReadiness.csvOutputDirRequired
    : outputReadiness.outputDirRequired;
  const panelHighlighted = outputReadiness.outputDirRequired || outputReadiness.csvOutputDirRequired;
  const controlsDisabled = disable_changes || processing;
  
  useEffect(() => {
    dispatch({type: file_actions.START_FILES_SAGA});
    dispatch({type: config_actions.START_CONFIG_SAGA});
    dispatch({type: debug_actions.START_DEBUG_SAGA});
  }, []);

  useEffect(() => {
    return () => {
      dispatch({type: file_actions.STOP_FILES_SAGA});
      dispatch({type: config_actions.STOP_CONFIG_SAGA});
      dispatch({type: debug_actions.STOP_DEBUG_SAGA});
    }
  }, []);

  

  return (
    <>
      <div key={0} className='App'>
        <div className='__top'>
          <img src={bdsaLogo} className='logo' alt='Brain Digital Slide Archive Logo'/>
          <div className={"__controls"}>
            <div className={"__list-controls"}>
              <h2>Select files to inspect and process</h2>
            </div>
            <div className='__list-controls'>
              <div className={"__list-controls-group"}>
                <button disabled={disable_changes || processing} className={disable_changes || processing? "__button _disabled" : "__button"} onClick={() => dispatch({type: file_actions.ADD_FILES})}>Add File/Files
                </button>
                <button disabled={disable_changes || processing} className={disable_changes || processing? "__button _disabled" : "__button"} onClick={() => dispatch({type: file_actions.ADD_FOLDERS})}>Add Folder
                </button>
                <button disabled={disable_changes || processing} className={disable_changes || processing? "__button _disabled" : "__button"}
                        onClick={() => dispatch({type: file_actions.SELECT_IMPORT_CSV_XSLX})}>
                  CSV Import
                </button>
                <button disabled={disable_changes || processing} className={disable_changes || processing? "__button _disabled" : "__button"}
                        onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'esm'}})}>
                  eSlideManager
                </button>
              </div>
              <div className={"__spacer"}/>
              {
                debug_config.enable_debug && (
                  <button className={"__button-icon"}
                      onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'debug'}})}>
                    <i
                      className=
                        "fi fi-rr-exclamation"
                    ></i>
                  </button>
                )
              }
              <button className={networkGlobeClass}
                      title={uploadRouting.auto_upload && !uploadReadiness.ready ? 'Network: auto-upload not ready' : 'Network'}
                      onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'network'}})}>
                <i
                  className=
                    "fi fi-rr-globe"
                ></i>
              </button>
              <button className={"__button-icon"}
                      onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'help'}})}>
                <i
                  className=
                    "fi fi-rr-interrogation"
                ></i>
              </button>
              <button className={"__button-icon"}
                      onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'config'}})}>
                <i
                  className=
                    "fi fi-rr-settings"
                ></i>
              </button>
            </div>
            <div className={"__list-controls"}>
              <div className={"__list-controls-group _bottom-border"}>
                <FileHeaderInfo/>
              </div>
            </div>
            {showOutputDirPanel && (
              <div className="__list-controls __list-controls_output-dir">
                <OutputDirectoryPanel
                  variant={outputDirVariant}
                  destSummary={destSummary}
                  outputDir={panelOutputDir}
                  required={panelRequired}
                  highlighted={panelHighlighted}
                  disabled={controlsDisabled}
                  onChoose={() => dispatch({
                    type: csv.needs_csv_output_dir
                      ? file_actions.CHOOSE_CSV_OUTPUT_DIR
                      : file_actions.CHOOSE_OUTPUT_DIR,
                  })}
                />
              </div>
            )}
          </div>
        </div>
        <div className='__controls-csv-xlsx'>
          {render_cancel_clear_button(disable_changes, count, processing, dispatch)}
          <div className={"__spacer"}/>
          {render_process_files_button(uploadRouting, uploadReadiness, outputReadiness, disable_changes, count, processing, dispatch)}
        </div>
        <div className={"__disclaimer"}>
          Developers are not liable for the misuse of this application or a failure to verify the completeness of deidentification before sharing deidentified files.
        </div>
        <div id='table'>
          <AppAgGrid
            suppressMovableColumns={true}
            ensureDomOrder={true}
            suppressDragLeaveHidesColumns={true}
            enableCellTextSelection={true}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
          />
        </div>
      </div>
      <Modal key={1}/>
    </>
  )
}

export default App;