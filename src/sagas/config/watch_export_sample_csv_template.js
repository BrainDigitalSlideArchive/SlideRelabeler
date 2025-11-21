import { take, call, select } from 'redux-saga/effects';

import * as config_actions from '../../actions/config';

function* export_sample_csv_template(file) {
  const file_rows = yield select(state => state.files.file_rows);
  const csv_config = yield select(state => state.config.csv);

  let output_data = {
    header: [],
    rows: [],
  }
  output_data.header.push(
    csv_config.file_path_column
  )

  if (csv_config.file_rename_column) {
    output_data.header.push(csv_config.file_rename_column);
  }
  if (csv_config.file_destination_directory_column) {
    output_data.header.push(csv_config.file_destination_directory_column);
  }

  for (let file_row of file_rows) {
    let row = {
      [csv_config.file_path_column]: file_row.__reserved.source.path,
    }
    if (csv_config.file_rename_column) {
      row[csv_config.file_rename_column] = file_row.__reserved.rename;
    }
    if (csv_config.file_destination_directory_column) {
      row[csv_config.file_destination_directory_column] = file_row.__reserved.destinationDirectory;
    }
    for (let key in file_row) {
      if (output_data.header.includes(key)) {
        row[key] = file_row[key];
      }
    }

    for (let key in file_row) {
      if (!output_data.header.includes(key)) {
        row[key] = file_row[key];
      }
      if (key !== '__reserved') {
        row[key] = file_row[key];
      }
    }

    output_data.rows.push(row);
  }

  console.log("Output data", output_data);
  
  const output_file = electronAPI.writeCSV(file, output_data);
}

export default function* watch_export_sample_csv_template() {
  while (true) {
    const action = yield take(config_actions.EXPORT_SAMPLE_CSV_TEMPLATE);
    const file = yield electronAPI.openSaveFileDialog(["csv"]);
    if (file) {
      yield call(export_sample_csv_template, file);
    }
  }
}