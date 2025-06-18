import { put, select } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";
import * as debug_actions from "../../actions/debug";
import * as modal_actions from "../../actions/modal";

function* link(headers, col, link_action) {
  if (headers.includes(col.field)) {
    const header_idx = headers.indexOf(col.field);
    yield put({type: link_action, payload: {field: col.field, header_idx: header_idx, header: headers[header_idx]}});
  }
  else if (headers.includes(col.field.split('.').pop())) {
    const header_idx = headers.indexOf(col.field.split('.').pop());
    yield put({type: link_action, payload: {field: col.field, header_idx: header_idx, header: headers[header_idx]}});
  }
}

function* create_link(headers, target_header, link_aciton, column_plain_english_name = '', required = true, allow_select_action = null) {
  let found = false;
  for (let i = 0; i < headers.length; i++) {
    let header = headers[i];
    if (header ===  target_header) {
      yield put({type: link_aciton, payload: {header_idx: i, header: header}});
      found = true;
      break;
    }
  }
  if (!found && required) {
    let message = 
      `During the CSV import process no ${column_plain_english_name} column was found despite being specified in your CSV configuration as "${target_header}". 
      You are seeing an error because this column is required for the CSV import process.  Consider changing the column name in your configuration or verifying the needed column exists in your CSV file.`;
    yield put({type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: {error: message}});
    yield put({type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: message});
    if (allow_select_action) {
      yield put({type: allow_select_action});
    }
  } else if (!found && !required) {
    let message = 
      `During the CSV import process no ${column_plain_english_name} column was found despite being specified in your CSV configuration as "${target_header}". 
      You are seeing a warning because this column is optional for the CSV import process.  Consider changing the column name in your configuration or verifying the column exists in your CSV file.`;    
    yield put({
      type: modal_actions.DISPLAY_WARNING_MESSAGE, 
      payload: message
    });
    if (allow_select_action) {
      yield put({type: allow_select_action});
    }
  }
  return found;
}

export default function* link_headers_to_reserved(headers) {
  const csv_config = yield select(state => state.config.csv);

  if (csv_config.file_path_column || csv_config.file_rename_column || csv_config.file_destination_directory_column) {
    if (csv_config.file_path_column && csv_config.file_path_column.length > 0) {
      let link_result = yield create_link(headers, csv_config.file_path_column, files_actions.LINK_HEADER_TO_PATH_COLUMN, 'file location', true, modal_actions.ALLOW_SELECT_CSV_PATH_COLUMN);
    } else {
      let message = 'There is an issue with the CSV path column configuration. Please check your CSV configuration.';
      yield put({type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: {error: message}});
      yield put({type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: message});
    }
    if (csv_config.file_rename_column && csv_config.file_rename_column.length > 0) {
      let link_result = yield create_link(headers, csv_config.file_rename_column, files_actions.LINK_HEADER_TO_RENAME_COLUMN, 'rename', false, modal_actions.ALLOW_SELECT_CSV_RENAME_COLUMN);
    }
    if (csv_config.file_destination_directory_column && csv_config.file_destination_directory_column.length > 0) {  
      let link_result = yield create_link(headers, csv_config.file_destination_directory_column, files_actions.LINK_HEADER_TO_DESTINATION_DIRECTORY_COLUMN, 'destination directory', false, modal_actions.ALLOW_SELECT_CSV_DESTINATION_DIRECTORY_COLUMN);
    }
  }

  return true;
}