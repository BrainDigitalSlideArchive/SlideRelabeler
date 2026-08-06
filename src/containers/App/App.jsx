import React, { useEffect, useId } from 'react';
import bdsaLogo from "../../assets/BDSA_folder_clear.png";
import {useSelector, useDispatch} from "react-redux";

import * as modal_actions from '../../actions/modal';
import { selectOutputReadiness, summarizeDestinationDirectories } from '../../selectors/outputReadiness';
import * as file_actions from "../../actions/files";
import * as config_actions from "../../actions/config";
import * as debug_actions from "../../actions/debug";
import { useAppVersion } from "../../helpers/useAppVersion";
import {
  getProcessBlockerDetail,
  getProcessBlockerMessage,
  getProcessBlockerSettingsSection,
  isProcessReadinessBlocked,
} from '../../helpers/process_blockers.js';
import useLabelIconForPreview from '../../components/config/useLabelIconForPreview.js';
import { openConfigSettings } from '../../components/config-v2/ConfigV2Nav';
import HelpIconPopover from '../../components/controls/HelpIconPopover';

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

function ProcessFilesControl({
  uploadRouting,
  outputReadiness,
  disable_changes,
  count,
  processing,
  iconReadable,
  dispatch,
}) {
  const messageId = useId();
  const iconOpts = { iconReadable };
  const message = getProcessBlockerMessage(count, outputReadiness, iconOpts);
  const detail = getProcessBlockerDetail(count, outputReadiness, iconOpts);
  const settingsSectionId = getProcessBlockerSettingsSection(count, outputReadiness, iconOpts);
  const readinessBlocked = isProcessReadinessBlocked(count, outputReadiness, iconOpts);
  const processBlocked = readinessBlocked || processing || disable_changes;
  // Chip + hover tip: readiness block with files loaded (not empty table / not mid-run).
  const showWarning = count > 0 && readinessBlocked && !processing;

  const autoUp = !!uploadRouting?.auto_upload;
  const processLabel = autoUp ? 'Process and Upload' : 'Process Files';

  function openSettingsFromBlocker() {
    if (!settingsSectionId) return;
    openConfigSettings(dispatch, settingsSectionId);
  }

  const showSettingsAction = Boolean(settingsSectionId);

  return (
    <div className={`__process-files${showWarning ? ' __process-files--blocked' : ''}`}>
      <div className="__process-files-row">
        {showWarning ? (
          <GridHoverTooltip
            content="Not ready to process. Click for details"
            show="always"
            delay={0}
            placement="below"
          >
            <HelpIconPopover
              helpLabel={message || 'Why Process is blocked'}
              variant="onDark"
              glyph="!"
            >
              <div className="__process-files-popover" id={messageId}>
                {detail !== message ? (
                  <>
                    <p className="__process-files-popover-title">{message}</p>
                    <p className="__process-files-popover-body">{detail}</p>
                  </>
                ) : (
                  <p className="__process-files-popover-body">{message}</p>
                )}
                {showSettingsAction ? (
                  <button
                    type="button"
                    className="__process-files-popover-action"
                    onClick={openSettingsFromBlocker}
                  >
                    Open Settings
                  </button>
                ) : null}
              </div>
            </HelpIconPopover>
          </GridHoverTooltip>
        ) : null}
        <button
          type="button"
          className={processBlocked ? '__action-button _disabled' : '__action-button'}
          disabled={processBlocked}
          aria-label={showWarning ? `${processLabel}. ${message}` : undefined}
          title={!showWarning && message && !processing ? message : undefined}
          onClick={() => dispatch({ type: file_actions.PROCESS_FILES })}
        >
          {processLabel}
        </button>
      </div>
    </div>
  );
}

const App = (props) => {
  let output_dir = useSelector(state => state.files.output_dir);
  const appVersion = useAppVersion();
  let count = useSelector(state => state.files.count);
  let processing = useSelector(state => state.files.processing);
  let disable_changes = useSelector(state => state.files.disable_changes);
  let file_rows = useSelector(state => state.files.file_rows);
  const config = useSelector((state) => state.config);

  let uploadRouting = useSelector((state) => state.uploadRouting);
  let outputReadiness = useSelector(selectOutputReadiness);
  const { iconReadable } = useLabelIconForPreview(config);

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
          <div className="__brand">
            <img src={bdsaLogo} className='logo' alt='Brain Digital Slide Archive Logo'/>
            {appVersion ? (
              <span className="__brand-version" title={`SlideRelabeler ${appVersion}`}>
                v{appVersion}
              </span>
            ) : null}
          </div>
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
          <ProcessFilesControl
            uploadRouting={uploadRouting}
            outputReadiness={outputReadiness}
            disable_changes={disable_changes}
            count={count}
            processing={processing}
            iconReadable={iconReadable}
            dispatch={dispatch}
          />
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
