import { put, select } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";
import * as debug_actions from "../../actions/debug";
import * as modal_actions from "../../actions/modal";
import {
  CSV_RESERVED_FIELD_SPECS,
  formatCsvHeaderMatchList,
  getCsvFieldAliases,
  getCsvLinkActionForField,
  getCsvPlainEnglishName,
  getCsvSelectModalActionForField,
  normalizeCsvConfig,
  resolveCsvHeaderLink,
} from '../../helpers/csv_column_config.js';

function* create_link(headers, matchOptions, link_action, column_plain_english_name = '', required = true, allow_select_action = null) {
  const link = resolveCsvHeaderLink(headers, matchOptions);
  if (link) {
    yield put({ type: link_action, payload: link });
    return true;
  }
  const targetLabel = formatCsvHeaderMatchList(matchOptions).join('", "');
  if (required) {
    const message =
      `During the CSV import process no ${column_plain_english_name} column was found despite being specified in your CSV configuration as "${targetLabel}". `
      + 'You are seeing an error because this column is required for the CSV import process. '
      + 'Consider changing the column name in your configuration or verifying the needed column exists in your CSV file.';
    yield put({ type: debug_actions.ADD_FRONTEND_ERROR_MESSAGE, payload: { error: message } });
    yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: message });
    if (allow_select_action) {
      yield put({ type: allow_select_action });
    }
  } else if (targetLabel && (matchOptions?.alternates?.length ?? 0) > 0) {
    const message =
      `During the CSV import process no ${column_plain_english_name} column was found despite being specified in your CSV configuration as "${targetLabel}". `
      + 'You are seeing a warning because this column is optional for the CSV import process. '
      + 'Consider changing the column name in your configuration or verifying the column exists in your CSV file.';
    yield put({ type: modal_actions.DISPLAY_WARNING_MESSAGE, payload: message });
    if (allow_select_action) {
      yield put({ type: allow_select_action });
    }
  }
  return false;
}

export default function* link_headers_to_reserved(headers) {
  const csv_config = normalizeCsvConfig(yield select((state) => state.config.csv));

  for (const spec of CSV_RESERVED_FIELD_SPECS) {
    const alternates = getCsvFieldAliases(csv_config, spec.key);
    const matchOptions = {
      defaultHeader: spec.defaultHeader,
      alternates,
    };

    const linkAction = files_actions[getCsvLinkActionForField(spec.key)];
    const selectAction = modal_actions[getCsvSelectModalActionForField(spec.key)];
    const linked = yield create_link(
      headers,
      matchOptions,
      linkAction,
      getCsvPlainEnglishName(spec.key),
      spec.required,
      selectAction,
    );
    if (spec.required && !linked) {
      return false;
    }
  }

  // Legacy destination directory (not in Data loading UI; output directory epic)
  if (csv_config.file_destination_directory_column?.length > 0) {
    yield create_link(
      headers,
      { alternates: [csv_config.file_destination_directory_column] },
      files_actions.LINK_HEADER_TO_DESTINATION_DIRECTORY_COLUMN,
      'destination directory',
      false,
      modal_actions.ALLOW_SELECT_CSV_DESTINATION_DIRECTORY_COLUMN,
    );
  }

  return true;
}
