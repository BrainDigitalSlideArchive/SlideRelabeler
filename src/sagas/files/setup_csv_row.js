import {select} from 'redux-saga/effects';
import {return_filename_basename_from_filename, return_filename_dir_from_path, join_paths, return_separator} from "../../helpers/renderer_path_helpers";
import get_uuid from "./get_uuid";
// import path from "path";

import {is_path_absolute, normalizePath} from "../../helpers/renderer_path_helpers";

export default function* setup_csv_row(headers, row) {
  let output_row = {};

  for (let i = 0; i < headers.length; i++) {
    let header = headers[i];
    let value = row[i];
    output_row[header] = value;
  }

  // console.log("Row in setup_csv_row", output_row);
  const {reserved_path_column, reserved_rename_column, reserved_destination_directory_column, csv_file_path} = yield select(state => state.files.csv);

  if (reserved_path_column &&Object.keys(output_row).includes(reserved_path_column.header)) {
    const csv = yield select(state => state.files.csv);

    let file_path = output_row[reserved_path_column.header];
    // Is path absolute?
    const is_absolute = is_path_absolute(file_path);
    
    if (!is_absolute) {
      let {filename, directory} = return_filename_dir_from_path(csv_file_path);
      file_path = join_paths([directory, file_path]);
    } 

    const {filename, directory} = return_filename_dir_from_path(file_path);

    let source = {
      filename: filename,
      directory: directory,
      path: file_path,
      parsed: {
        ext: '.' + filename.split('.').pop(),
        dir: directory,
        base: filename,
        name: filename.split('.').shift(),
        root: directory.split(return_separator(directory)).shift()
      },
      sep: return_separator(file_path)
    }
    output_row.__reserved = {};
    output_row.__reserved.source = source;

    console.log("Get UUID")
    const file_uuid = yield get_uuid(file_path);
    console.log("File UUID", file_uuid);
    output_row.__reserved.uuid = file_uuid;
    output_row.__reserved.rename = filename;
  }

  if (output_row.__reserved && output_row.__reserved.source && (reserved_rename_column || reserved_destination_directory_column)) {
    const basename = return_filename_basename_from_filename(output_row.__reserved.source.filename);
    
    const output_dir = yield select(state => state.files.output_dir);

    if (reserved_rename_column) {
      output_row.__reserved.rename = row[reserved_rename_column.header_idx];
    } else {
      output_row.__reserved.rename = basename;
    }

    if (reserved_destination_directory_column) {
      output_row.__reserved.destinationDirectory = row[reserved_destination_directory_column.header_idx];
    } else {
      output_row.__reserved.destinationDirectory = output_dir;
    }
  }

  return output_row;
}