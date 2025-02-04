import { select } from "redux-saga/effects";

export default function* output_csv(file) {
  const fileRows = yield select(state => state.files.fileRows);

  let output_data = {
    "header": [],
    "rows": []
  };

  for (let fileRowIdx in fileRows) {
    let fileRow = fileRows[fileRowIdx];

    // Add any column names that are not already in the header
    let column_names = get_column_names(fileRow);
    for (let column_name of column_names) {
      if (!output_data.header.includes(column_name)) {
        output_data.header.push(column_name);
      }
    }

    // Add row data
    let column_data = get_column_data(fileRow, column_names);
    output_data.rows.push(column_data);
  }

  const output_file = electronAPI.writeCSV(file, output_data);
};

function get_column_data(row, column_names) {
  let column_data = {};
  for (let column_name of column_names) {
    let column = column_name.split(".").reduce((obj, key) => obj[key], row);
    column_data[column_name] = column;
  }
  return column_data;
}

function get_column_names(row, key_prefixes= [], column_names= []) {
  let keys = Object.keys(row);
  for (let key of keys) {
    let column = row[key];
    if (column instanceof Object) {
      let new_key_prefixes = key_prefixes.concat(key);
      get_column_names(column, new_key_prefixes, column_names);
    }
    else {
      column_names.push(key_prefixes.concat(key).join("."));
    }
  }
  return column_names
}