import {select} from 'redux-saga/effects';
import {return_filename_basename_from_filename} from "../../helpers/renderer_path_helpers";
import get_uuid from "./get_uuid";

export default function* add_metadata_to_row(row, input_dir) {
  if (Object.keys(row).includes("source")) {
    if (Object.keys(row.source).includes("path")) {
      const metadata = yield electronAPI.getMetadata(row.source.path);
      // const basename = return_filename_basename_from_filename(row);
      // const file_uuid = yield get_uuid(row);
      // {rename: basename, uuid: file_uuid}
      row = Object.assign({}, row, metadata, );
    }
    if (!Object.keys(row.source).includes("directory") && input_dir) {
      row.source.directory = input_dir;
    }
    if (Object.keys(row.source).includes("directory") && Object.keys(row.source).includes("filename")) {
      row.source.path = row.source.directory + '/' + row.source.filename;
      const metadata = yield electronAPI.getMetadata(row.source.path);
      // const basename = return_filename_basename_from_filename(row);
      // const file_uuid = yield get_uuid(row);
      row = Object.assign({}, row, metadata);
    }
  }
  const basename = return_filename_basename_from_filename(row.source.filename);
  const file_uuid = yield get_uuid(row);
  const output_dir = yield select(state => state.files.output_dir);
  if (row.rename) {
    row = Object.assign({}, row, {uuid: file_uuid, destinationDirectory: output_dir})
  } else {
    row = Object.assign({}, row, {rename: basename, uuid: file_uuid, destinationDirectory: output_dir})
  }
  return row;
}