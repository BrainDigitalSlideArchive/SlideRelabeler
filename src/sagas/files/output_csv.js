import { select } from "redux-saga/effects";

export default function* output_csv(file) {
  const file_rows = yield select(state => state.files.file_rows);

  let output_data = {
    "header": [],
    "rows": []
  };

  output_data.header.push("path", "output_path", "destination", "filename", "ext", "size", "uuid", "status");

  for (let file_row_idx in file_rows) {
    let file_row = file_rows[file_row_idx];

    // Add any column names that are not already in the header
    let column_names = get_column_names(file_row);
    for (let column_name of column_names) {
      if (!output_data.header.includes(column_name) && !column_name.startsWith('__reserved')) {
        output_data.header.push(column_name);
      }
    }

    // Add row data
    let column_data = get_column_data(file_row, column_names);

    column_data.path = file_row.__reserved.source.path;
    column_data.output_path = file_row.__reserved.rename;
    column_data.destination = file_row.__reserved.destinationDirectory;
    column_data.filename = file_row.__reserved.source.filename;
    column_data.ext = file_row.__reserved.source.parsed.ext;
    column_data.size = file_row.__reserved.bytes;
    column_data.uuid = file_row.__reserved.uuid;

    if (file_row.__reserved.processed === 1) {
      column_data.status = "success";
    } else if (file_row.__reserved.error) {
      column_data.status = `error ${file_row.__reserved.error}`;
    } else {
      column_data.status = "pending";
    }

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