import React, {useEffect} from 'react';
import bdsaLogo from "../../assets/BDSA_folder_clear.png";
import {useSelector, useDispatch} from "react-redux";

import * as modal_actions from '../../actions/modal';
import { selectOutputReadiness, summarizeDestinationDirectories } from '../../selectors/outputReadiness';
import * as file_actions from "../../actions/files";
import * as config_actions from "../../actions/config";
import * as debug_actions from "../../actions/debug";

import AppAgGrid from "../../components/AgGrid/AppAgGrid";
import GridHoverTooltip from "../../components/AgGrid/GridHoverTooltip";
import AddFilesControl from "../../components/AddFilesControl";
import ApiLoadControl from "../../components/ApiLoadControl";
import ProcessingStatus from "../../components/ProcessingStatus/ProcessingStatus";
import DeliveryPanel from "../../components/DeliveryPanel/DeliveryPanel";

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

function getProcessBlockerMessage(count, outputReadiness) {
  if (count === 0) {
    return 'Select files to inspect and process';
  }

  if (outputReadiness.patternValidation?.blocking) {
    return outputReadiness.patternValidation.messages?.[0]
      || 'Fix pattern column references before processing.';
  }

  if (!outputReadiness.anyDeliveryEnabled) {
    return 'Configure output delivery — enable local save and/or upload';
  }

  if (outputReadiness.localEnabled && !outputReadiness.localConfigured) {
    return 'Set Copy To for all files or choose a folder for all';
  }

  if (outputReadiness.uploadEnabled && !outputReadiness.uploadConfigured) {
    const blocker = outputReadiness.uploadReadiness?.blockers?.[0];
    return blocker || 'Finish upload connection setup before processing';
  }

  return '';
}

function render_process_files_button(uploadRouting, outputReadiness, disable_changes, count, processing, dispatch) {
  const message = getProcessBlockerMessage(count, outputReadiness);
  const processBlocked = count === 0
    || processing
    || !outputReadiness.processReady
    || disable_changes;

  const autoUp = !!uploadRouting?.auto_upload;
  const processLabel = autoUp ? 'Process and Upload' : 'Process Files';

  return (
    <div className="__process-files">
      <button className={processBlocked ? "__action-button _disabled" : "__action-button"}
              disabled={processBlocked}
              onClick={() => dispatch({type: file_actions.PROCESS_FILES})}>
                {processLabel}
      </button>
      {message.length > 0 && <div className="__process-files-message">{message}</div>}
    </div>
  )
}
const App = (props) => {
  let output_dir = useSelector(state => state.files.output_dir);
  let count = useSelector(state => state.files.count);
  let processing = useSelector(state => state.files.processing);
  let disable_changes = useSelector(state => state.files.disable_changes);
  let debug_config = useSelector(state => state.config.debug);
  let file_rows = useSelector(state => state.files.file_rows);

  let uploadRouting = useSelector((state) => state.uploadRouting);
  let outputReadiness = useSelector(selectOutputReadiness);

  const dispatch = useDispatch();
  const destSummary = summarizeDestinationDirectories(file_rows);
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
                <AddFilesControl disabled={controlsDisabled} />
                <GridHoverTooltip content="Load CSV" show="always" placement="below">
                  <button
                    disabled={disable_changes || processing}
                    className={disable_changes || processing ? "__button __button--segmented _disabled" : "__button __button--segmented"}
                    onClick={() => dispatch({ type: file_actions.SELECT_IMPORT_CSV_XSLX })}
                  >
                    <span className="__button__label">CSV Import</span>
                    <span className="__button__icon" aria-hidden="true">
                      <i className="fi fi-rr-table" />
                    </span>
                  </button>
                </GridHoverTooltip>
                <ApiLoadControl disabled={controlsDisabled} />
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
              <button
                type="button"
                className="__button __button--segmented __button--utility"
                aria-label="Help"
                onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'help'}})}
              >
                <span className="__button__label">Help</span>
                <span className="__button__icon" aria-hidden="true">
                  <i className="fi fi-rr-interrogation" />
                </span>
              </button>
              <button
                type="button"
                className="__button __button--segmented __button--utility"
                aria-label="Settings"
                onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'config'}})}
              >
                <span className="__button__label">Settings</span>
                <span className="__button__icon" aria-hidden="true">
                  <i className="fi fi-rr-settings" />
                </span>
              </button>
            </div>
            <div className="__list-controls __list-controls_output-dir">
              <DeliveryPanel
                    uploadRouting={uploadRouting}
                    destSummary={destSummary}
                    outputDir={output_dir}
                    disabled={controlsDisabled}
                    onChooseFolder={() => dispatch({
                      type: file_actions.CHOOSE_OUTPUT_DIR,
                    })}
                  />
            </div>
            <div className="__list-controls __list-controls_progress">
              <ProcessingStatus/>
            </div>
          </div>
        </div>
        <div className='__controls-csv-xlsx'>
          {render_cancel_clear_button(disable_changes, count, processing, dispatch)}
          <div className={"__spacer"}/>
          {render_process_files_button(uploadRouting, outputReadiness, disable_changes, count, processing, dispatch)}
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
