import { select } from 'redux-saga/effects';
import { return_filename_dir_from_path, join_paths, return_separator } from '../../helpers/renderer_path_helpers';
import get_uuid from './get_uuid';
import { is_path_absolute } from '../../helpers/renderer_path_helpers';
import { applyTemplatesToRowWithStore } from '../../helpers/slide_naming.js';
import {
  applyRowNamingDefaults,
  initRowNamingSources,
  markNamingFieldSource,
  NAMING_SOURCE,
} from '../../helpers/row_naming_defaults.js';
import {
  DESTINATION_SOURCE,
  initDestinationSource,
  markDestinationSource,
} from '../../helpers/destination_directory.js';

function trimCell(value) {
  if (value == null) return '';
  return String(value).trim();
}

function applyCsvFieldFromLink(output_row, row, link, reservedField, sourceField) {
  if (!link || !output_row.__reserved) return;
  const raw = output_row[link.header] ?? row[link.header_idx];
  const value = trimCell(raw);
  if (!value) return;
  output_row.__reserved[reservedField] = value;
  output_row.__reserved = markNamingFieldSource(output_row.__reserved, sourceField, NAMING_SOURCE.CSV);
}

export default function* setup_csv_row(headers, row) {
  let output_row = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    output_row[header] = row[i];
  }

  const {
    reserved_path_column,
    reserved_rename_column,
    reserved_destination_directory_column,
    reserved_label_column,
    reserved_qr_column,
    csv_file_path,
  } = yield select((state) => state.files.csv);

  if (reserved_path_column && Object.keys(output_row).includes(reserved_path_column.header)) {
    let file_path = output_row[reserved_path_column.header];
    const is_absolute = is_path_absolute(file_path);

    if (!is_absolute) {
      const { directory } = return_filename_dir_from_path(csv_file_path);
      file_path = join_paths([directory, file_path]);
    }

    const { filename, directory } = return_filename_dir_from_path(file_path);

    const source = {
      filename,
      directory,
      path: file_path,
      parsed: {
        ext: (() => {
          const lastDotIndex = filename.lastIndexOf('.');
          return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex);
        })(),
        dir: directory,
        base: filename,
        name: filename.split('.').shift(),
        root: directory.split(return_separator(directory)).shift(),
      },
      sep: return_separator(file_path),
    };
    output_row.__reserved = {};
    output_row.__reserved.source = source;

    const file_uuid = yield get_uuid(file_path);
    output_row.__reserved.uuid = file_uuid;
  }

  if (output_row.__reserved?.source) {
    const output_dir = yield select((state) => state.files.output_dir);

    if (reserved_destination_directory_column) {
      const raw = row[reserved_destination_directory_column.header_idx];
      const value = trimCell(raw);
      if (value) {
        output_row.__reserved.destinationDirectory = value;
        output_row.__reserved = markDestinationSource(
          output_row.__reserved,
          DESTINATION_SOURCE.CSV,
        );
      }
    } else if (output_dir) {
      output_row.__reserved.destinationDirectory = output_dir;
      output_row.__reserved = initDestinationSource(output_row.__reserved);
    }

    output_row = initRowNamingSources(output_row);
    applyCsvFieldFromLink(output_row, row, reserved_rename_column, 'rename', 'rename');
    applyCsvFieldFromLink(output_row, row, reserved_label_column, 'labelText', 'labelText');
    applyCsvFieldFromLink(output_row, row, reserved_qr_column, 'qrPayload', 'qrPayload');

    const config = yield select((state) => state.config);
    const file_cols = yield select((state) => state.files.file_columns);
    const esm = yield select((state) => state.esm);
    output_row = applyTemplatesToRowWithStore(output_row, config, esm);
    output_row = applyRowNamingDefaults(output_row, { ...config, fileCols: file_cols });
  }

  return output_row;
}
