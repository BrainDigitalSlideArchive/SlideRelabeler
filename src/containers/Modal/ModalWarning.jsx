import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";

import ModalHeader from "./ModalHeader";
import { CsvColumnSelectControls } from "./ModalError";
import {generate_dropdown_for_table_columns} from "../../helpers/fe_helpers";

import * as modal_actions from "../../actions/modal";

function ModalWarning() {
  const error_messages = useSelector(state => state.modal.error_messages);
  const warning_messages = useSelector(state => state.modal.warning_messages);
  const dispatch = useDispatch();
  const processing = useSelector(state => state.files.processing);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const csv_config = useSelector(state => state.config.csv);
  const csv = useSelector(state => state.files.csv);
  const file_columns = useSelector(state => state.files.file_columns);
  const reserved_columns = useSelector(state => state.files.reserved_columns);
  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const allow_select_csv_path_column = useSelector(state => state.modal.allow_select_csv_path_column);
  const allow_select_csv_rename_column = useSelector(state => state.modal.allow_select_csv_rename_column);
  const allow_select_csv_destination_directory_column = useSelector(state => state.modal.allow_select_csv_destination_directory_column);
  const allow_select_csv_label_column = useSelector(state => state.modal.allow_select_csv_label_column);
  const allow_select_csv_qr_column = useSelector(state => state.modal.allow_select_csv_qr_column);

  const [column_options, set_column_options] = useState([]);

  useEffect(() => {
    let selected_columns = [...file_columns];

    let new_column_options = generate_dropdown_for_table_columns(selected_columns, blocked_fields);

    set_column_options(new_column_options);
  }, [file_columns, blocked_fields])


  return (
    <div className="__modal">
      <ModalHeader title={error_messages.length > 0 ? "Error" : "Warning"} type={error_messages.length > 0 ? "error" : "warning"} onClose={() => dispatch({type: modal_actions.CLEAR_MESSAGES})}/>
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
                <div className="__card" key={index + error_messages.length}>
                    <div className="__warning-message">
                        {message}
                    </div>
                </div>
            ))
        }
        {
          (allow_select_csv_path_column || allow_select_csv_rename_column || allow_select_csv_destination_directory_column || allow_select_csv_label_column || allow_select_csv_qr_column) &&
          <CsvColumnSelectControls
            allowSelectCsvPathColumn={allow_select_csv_path_column}
            allowSelectCsvRenameColumn={allow_select_csv_rename_column}
            allowSelectCsvDestinationDirectoryColumn={allow_select_csv_destination_directory_column}
            allowSelectCsvLabelColumn={allow_select_csv_label_column}
            allowSelectCsvQrColumn={allow_select_csv_qr_column}
            processing={processing}
            disableChanges={disable_changes}
            columnOptions={column_options}
            csvConfig={csv_config}
            csvFile={csv.file}
            dispatch={dispatch}
          />
        }
      </div>
    </div>
  );
}

export default ModalWarning;