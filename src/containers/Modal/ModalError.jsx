import React, { useEffect, useState } from "react";

import { useSelector, useDispatch } from "react-redux";

import ModalHeader from "./ModalHeader";
import Dropdown from "../../components/controls/dropdown/Dropdown";
import { generate_dropdown_for_table_columns } from "../../helpers/fe_helpers";

import * as modal_actions from "../../actions/modal";
import * as config_actions from "../../actions/config";
import * as files_actions from "../../actions/files";
import {
  alternatesFromLegacyPickerValue,
  CSV_RESERVED_FIELD_SPECS,
  getCsvFieldAliases,
  normalizeCsvConfig,
} from '../../helpers/csv_column_config.js';

function setReservedFieldFromPicker(dispatch, fieldKey, value) {
  const spec = CSV_RESERVED_FIELD_SPECS.find((s) => s.key === fieldKey);
  dispatch({
    type: config_actions.SET_CSV_RESERVED_ALIASES,
    payload: {
      fieldKey,
      aliases: alternatesFromLegacyPickerValue(value, spec?.defaultHeader),
    },
  });
}

function initialPickerSelections(csvConfig) {
  const normalized = normalizeCsvConfig(csvConfig);
  return {
    filePath: getCsvFieldAliases(normalized, 'filePath')[0] ?? '',
    outputName: getCsvFieldAliases(normalized, 'outputName')[0] ?? '',
    labelText: getCsvFieldAliases(normalized, 'labelText')[0] ?? '',
    qrContent: getCsvFieldAliases(normalized, 'qrContent')[0] ?? '',
  };
}

function selectedDropdownItems(columnOptions, value) {
  if (!value) return [];
  return columnOptions.filter((option) => option.value === value);
}

function handleContinue(csvFile, dispatch) {
  dispatch({ type: modal_actions.CLEAR_MESSAGES });
  dispatch({ type: modal_actions.DISALLOW_SELECT_CSV });
  dispatch({ type: modal_actions.CLOSE_MODAL });
  dispatch({ type: files_actions.ADD_CSV, payload: csvFile });
}

export function CsvColumnSelectControls({
  allowSelectCsvPathColumn,
  allowSelectCsvRenameColumn,
  allowSelectCsvDestinationDirectoryColumn,
  allowSelectCsvLabelColumn,
  allowSelectCsvQrColumn,
  processing,
  disableChanges,
  columnOptions,
  csvConfig,
  csvFile,
  dispatch,
}) {
  const [selections, setSelections] = useState(() => initialPickerSelections(csvConfig));

  function selectField(fieldKey, value) {
    setSelections((prev) => ({ ...prev, [fieldKey]: value }));
    setReservedFieldFromPicker(dispatch, fieldKey, value);
  }

  const canContinue = !allowSelectCsvPathColumn || Boolean(selections.filePath);

  return (
    <div className="__control">
      {
        allowSelectCsvPathColumn &&
        <div className="__control-item">
          <Dropdown
            disabled={processing || disableChanges}
            items={columnOptions}
            label={"File location (required)"}
            placeholder={"Select column"}
            selectedItems={selectedDropdownItems(columnOptions, selections.filePath)}
            onSelect={(item) => selectField('filePath', item.value)}
          />
        </div>
      }
      {
        allowSelectCsvRenameColumn &&
        <div className="__control-item">
          <Dropdown
            disabled={processing || disableChanges}
            items={columnOptions}
            label={"Output name column (optional)"}
            placeholder={"Select column"}
            selectedItems={selectedDropdownItems(columnOptions, selections.outputName)}
            onSelect={(item) => selectField('outputName', item.value)}
          />
        </div>
      }
      {
        allowSelectCsvLabelColumn &&
        <div className="__control-item">
          <Dropdown
            disabled={processing || disableChanges}
            items={columnOptions}
            label={"Label text column (optional)"}
            placeholder={"Select column"}
            selectedItems={selectedDropdownItems(columnOptions, selections.labelText)}
            onSelect={(item) => selectField('labelText', item.value)}
          />
        </div>
      }
      {
        allowSelectCsvQrColumn &&
        <div className="__control-item">
          <Dropdown
            disabled={processing || disableChanges}
            items={columnOptions}
            label={"QR content column (optional)"}
            placeholder={"Select column"}
            selectedItems={selectedDropdownItems(columnOptions, selections.qrContent)}
            onSelect={(item) => selectField('qrContent', item.value)}
          />
        </div>
      }
      {
        allowSelectCsvDestinationDirectoryColumn &&
        <div className="__control-item">
          <Dropdown
            disabled={processing || disableChanges}
            items={columnOptions}
            label={"Destination directory (optional)"}
            placeholder={"Select column"}
            selectedItems={csvConfig.file_destination_directory_column
              ? selectedDropdownItems(columnOptions, csvConfig.file_destination_directory_column)
              : []}
            onSelect={(item) => dispatch({
              type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN,
              payload: item.value,
            })}
          />
        </div>
      }
      <div className="__control-action">
        <button
          className={"__button-aciton"}
          disabled={processing || disableChanges || !canContinue}
          onClick={() => handleContinue(csvFile, dispatch)}
        >
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
  const csv = useSelector(state => state.files.csv);
  const file_columns = useSelector(state => state.files.file_columns);
  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const allow_select_csv_path_column = useSelector(state => state.modal.allow_select_csv_path_column);
  const allow_select_csv_rename_column = useSelector(state => state.modal.allow_select_csv_rename_column);
  const allow_select_csv_destination_directory_column = useSelector(state => state.modal.allow_select_csv_destination_directory_column);
  const allow_select_csv_label_column = useSelector(state => state.modal.allow_select_csv_label_column);
  const allow_select_csv_qr_column = useSelector(state => state.modal.allow_select_csv_qr_column);

  const [column_options, set_column_options] = useState([]);

  useEffect(() => {
    const selected_columns = [...file_columns];
    const new_column_options = generate_dropdown_for_table_columns(selected_columns, blocked_fields);
    set_column_options(new_column_options);
  }, [file_columns, blocked_fields]);

  return (
    <div className="__modal">
      <ModalHeader title={"Error"} type={"error"} onClose={() => dispatch({ type: modal_actions.CLEAR_MESSAGES })}/>
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

export default ModalError;
