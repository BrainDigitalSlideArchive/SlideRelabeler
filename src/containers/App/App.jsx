import React, {useEffect} from 'react';
import bdsaLogo from "../../assets/BDSA_folder_clear.png";
import {useSelector, useDispatch} from "react-redux";

import {Provider} from "react-redux";
import store from '../../store/index';

import * as modal_actions from '../../actions/modal'
import * as file_actions from "../../actions/files";
import * as config_actions from "../../actions/config";

import AgGrid from "../../components/AgGrid/AgGrid";
import FileHeaderInfo from "../../components/FileHeaderInfo/FileHeaderInfo";

import { headerInfo } from "../../helpers/fe_helpers";

import './App.scss';
import Modal from "../Modal/Modal";

const App = (props) => {
  // const { } = useSelector(state => state.app.get('app'));
  let output_dir = useSelector(state => state.files.output_dir);
  let input_dir = useSelector(state => state.files.input_dir);
  let totalBytes = useSelector(state => state.files.totalBytes);
  let count = useSelector(state => state.files.count);
  let processing = useSelector(state => state.files.processing);
  let disable_changes = useSelector(state => state.files.disable_changes);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({type: file_actions.START_FILES_SAGA});
    dispatch({type: config_actions.START_CONFIG_SAGA});
  }, []);

  useEffect(() => {
    return () => {
      dispatch({type: file_actions.STOP_FILES_SAGA});
      dispatch({type: config_actions.STOP_CONFIG_SAGA});
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
                <button disabled={disable_changes} className={"__button"} onClick={() => dispatch({type: file_actions.ADD_FILES})}>Add File/Files
                </button>
                <button disabled={disable_changes} className={"__button"} onClick={() => dispatch({type: file_actions.ADD_FOLDERS})}>Add Folder
                </button>
                <button disabled={disable_changes} className={"__button"}
                        onClick={() => dispatch({type: file_actions.SELECT_IMPORT_CSV_XSLX})}>
                  CSV Import
                </button>
              </div>
              <div className={"__spacer"}/>
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
            <div className={"__list-controls"}>
              <button disabled={disable_changes} className={"__button"}
                      onClick={() => dispatch({type: file_actions.CHOOSE_OUTPUT_DIR})}>Choose Output Dir
              </button>
              <div
                className={"__display-dir"}>{output_dir ? <h3>{output_dir}</h3> : <h3>Select a directory to copy files into.</h3>}</div>
            </div>
          </div>
        </div>
        <div className='__controls-csv-xlsx'>
          <button disabled={count === 0 || processing || disable_changes} className={count === 0 || processing || disable_changes? "__button _negative _disabled" : "__button _negative"} onClick={() => dispatch({type: file_actions.CLEAR_FILES})}>
            Clear Files
          </button>
          <div className={"__spacer"}/>
          <button className={count === 0 || processing || !output_dir || disable_changes ? "__action-button _disabled" : "__action-button"}
                  disabled={count === 0 || processing || !output_dir || disable_changes}
                  onClick={() => dispatch({type: file_actions.PROCESS_FILES})}>Process Files
          </button>
        </div>
        <div className={"__disclaimer"}>
          Developers are not liable for the misuse of this application or a failure to verify the completeness of deidentification before sharing deidentified files.
        </div>
        <div id='table'>
          <AgGrid
            autoSizeStrategy={{type: 'fitCellContents'}}
            suppressMovableColumns={true}
            ensureDomOrder={true}
            suppressDragLeaveHidesColumns={true}
            enableCellTextSelection={true}
            undoRedoCellEditing={true}
            undoRedoCellEditingLimit={20}
          />
        </div>
      </div>,
      <Modal key={1}/>
    </>
  )
}

export default App;