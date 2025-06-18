import React, {useEffect} from 'react';
import bdsaLogo from "../../assets/BDSA_folder_clear.png";
import {useSelector, useDispatch} from "react-redux";

import * as app_actions from '../../actions/app';
import * as file_actions from "../../actions/files";

import AgGrid from "../../components/AgGrid/AgGrid";
import FileHeaderInfo from "../../components/FileHeaderInfo/FileHeaderInfo";

import { headerInfo } from "../../helpers/fe_helpers";

import './App.scss';

// todo: disable all buttons when processing
// todo: make so export csv/xlsx only active once processed
// todo: add modal
// todo: make help modal

const App = (props) => {
  // const { } = useSelector(state => state.app.get('app'));
  let output_dir = useSelector(state => state.files.output_dir);
  let input_dir = useSelector(state => state.files.input_dir);
  let totalBytes = useSelector(state => state.files.totalBytes);
  let count = useSelector(state => state.files.count);
  let processing = useSelector(state => state.files.processing);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({type: file_actions.START_FILES_SAGA});
  }, []);

  useEffect(() => {
    return () => {
      dispatch({type: file_actions.STOP_FILES_SAGA});
    }
  }, []);

  return (
    <div className='__app'>
      <div id='main-controls'>
        <img src={bdsaLogo} className='logo' alt='Brain Digital Slide Archive Logo'/>
        <div id='list-controls'>
          {/* First row */}
          <button onClick={() => dispatch({type: file_actions.ADD_FILES})}>Add File/Files</button>
          <FileHeaderInfo/>

          {/* Second row */}
          <button disabled={count === 0 || processing} onClick={() => dispatch({type: file_actions.CLEAR_FILES})}>Clear Files</button>


        </div>
      </div>
      <div className={"__table-top-bar"}>
        <button className={"__button-dir"}
                onClick={() => dispatch({type: file_actions.CHOOSE_INPUT_DIR})}>Choose Input Dir
        </button>
        <div className={"__display-dir"}>{input_dir? input_dir : "Select a directory to copy files from."}</div>
        <div className={"__top-bar-spacer"}/>
        <button className={"__button-dir"}
                onClick={() => dispatch({type: file_actions.CHOOSE_OUTPUT_DIR})}>Choose Output Dir
        </button>
        <div className={"__display-dir"}>{output_dir ? output_dir : "Select a directory to copy files into."}</div>
        <div className={"__top-bar-spacer"}/>
        <button className={"__process-files-button"}
                disabled={count === 0 || processing}
                onClick={() => dispatch({type: file_actions.PROCESS_FILES})}>Process Files
        </button>
      </div>
      <div className='__controls-csv-xlsx'>
        <button onClick={() => dispatch({type: file_actions.SELECT_IMPORT_CSV_XSLX})}>Select Import CSV/XSLX</button>
        <div className={"__spacer"}/>
        <button disabled={count === 0 || processing} onClick={() => dispatch({type: file_actions.SELECT_OUTPUT_CSV_XSLX})}>Select Output CSV/XSLX</button>
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
    </div>
  )
}

export default App;