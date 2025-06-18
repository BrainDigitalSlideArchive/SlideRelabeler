import React, { useEffect, useState } from "react";

import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";

import ModalHeader from "./ModalHeader";
import Dropdown from "../../components/controls/dropdown/Dropdown";
import Button from "../../components/controls/button/Button";
import {generate_dropdown_for_table_columns} from "../../helpers/fe_helpers";

import * as modal_actions from "../../actions/modal";
import * as config_actions from "../../actions/config";
import * as files_actions from "../../actions/files";

function handle_continue(csv_file, dispatch) {
  dispatch({type: modal_actions.CLEAR_MESSAGES});
  dispatch({type: modal_actions.DISALLOW_SELECT_CSV})
  dispatch({type: modal_actions.CLOSE_MODAL})
  dispatch({type: files_actions.ADD_CSV, payload: csv_file})
}

export function render_select(allow_select_csv_path_column, allow_select_csv_rename_column, allow_select_csv_destination_directory_column, processing, disable_changes, column_options, csv_config, csv_file, dispatch) {
  return (
    <div className="__control">
      {
        allow_select_csv_path_column &&
        <div className="__control-item">
          <Dropdown disabled={processing || disable_changes} items={column_options} label={"File location (required)"} placeholder={"Select column"} selectedItems={csv_config.file_path_column? column_options.filter(option => option.value === csv_config.file_path_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_PATH_COLUMN, payload: item.value})}/>
        </div>
      }
      {
        allow_select_csv_rename_column &&
        <div className="__control-item">
          <Dropdown disabled={processing || disable_changes} items={column_options} label={"Rename (optional)"} placeholder={"Select column"} selectedItems={csv_config.file_rename_column? column_options.filter(option => option.value === csv_config.file_rename_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: item.value})}/>
        </div>
      }
      {
        allow_select_csv_destination_directory_column &&
        <div className="__control-item">
          <Dropdown disabled={processing || disable_changes} items={column_options} label={"Destination directory (optional)"} placeholder={"Select column"} selectedItems={csv_config.file_destination_directory_column? column_options.filter(option => option.value === csv_config.file_destination_directory_column) : []} onSelect={(item) => dispatch({type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, payload: item.value})}/>
        </div>
      }
      <div className="__control-action">
        <button className={"__button-aciton"} disabled={processing || disable_changes || !csv_config.file_path_column} onClick={() => handle_continue(csv_file, dispatch)}>
          Continue
        </button>
      </div>
    </div>
  );
}

function ModalError() {
  const error_messages = useSelector(state => state.modal.error_messages);
  const warning_messages = useSelector(state => state.modal.warning_messages);
  const dispatch = useDispatch();
  const processing = useSelector(state => state.files.processing);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const csv_config = useSelector(state => state.config.csv);
  const csv = useSelector(state => state.files.csv);;
  const file_columns = useSelector(state => state.files.file_columns);
  const reserved_columns = useSelector(state => state.files.reserved_columns);
  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const allow_select_csv_path_column = useSelector(state => state.modal.allow_select_csv_path_column);
  const allow_select_csv_rename_column = useSelector(state => state.modal.allow_select_csv_rename_column);
  const allow_select_csv_destination_directory_column = useSelector(state => state.modal.allow_select_csv_destination_directory_column);

  const [column_options, set_column_options] = useState([]);

  useEffect(() => {
    let selected_columns = [...file_columns];

    let new_column_options = generate_dropdown_for_table_columns(selected_columns, blocked_fields);

    set_column_options(new_column_options);
  }, [file_columns, blocked_fields])

  return (
    <div className="__modal">
      <ModalHeader title={"Error"} type={"error"} onClose={() => dispatch({type: modal_actions.CLEAR_MESSAGES})}/>
      <div className="__content">
        {
            error_messages.length > 0 &&            
            error_messages.map((message, index) => (
                    <div className="__card" key={index}>
                        <div className="__error-message">
                            {message}
                        </div>
                    </div>
                ))
        }
        {
            warning_messages.length > 0 &&            
            warning_messages.map((message, index) => (
                <div className="__card" key={index}>
                    <div className="__warning-message">
                        {message}
                    </div>
                </div>
            ))
        }
        {
          (allow_select_csv_path_column || allow_select_csv_rename_column || allow_select_csv_destination_directory_column) &&
          render_select(allow_select_csv_path_column, allow_select_csv_rename_column, allow_select_csv_destination_directory_column, processing, disable_changes, column_options, csv_config, csv.file, dispatch)
        }
      </div>
    </div>
  );
}

export default ModalError;