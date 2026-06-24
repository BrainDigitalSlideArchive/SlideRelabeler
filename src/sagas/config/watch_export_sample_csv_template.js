import { take, call, select } from 'redux-saga/effects';

import * as config_actions from '../../actions/config';
import { resolveOutputBasename } from '../../helpers/output_filename.js';
import {
  buildCsvTemplateRow,
  getCsvTemplateHeaderList,
} from '../../helpers/csv_import_config.js';

function* export_sample_csv_template(file) {
  const file_rows = yield select(state => state.files.file_rows);
  const csv_config = yield select(state => state.config.csv);
  const config = yield select(state => state.config);

  const header = getCsvTemplateHeaderList(csv_config);
  const rows = file_rows.length > 0
    ? file_rows.map((file_row) => buildCsvTemplateRow(file_row, csv_config, {
      resolveOutputBasename,
      config,
    }))
    : [buildCsvTemplateRow(null, csv_config)];

  const output_data = { header, rows };

  electronAPI.writeCSV(file, output_data);
}

export default function* watch_export_sample_csv_template() {
  while (true) {
    const action = yield take(config_actions.EXPORT_SAMPLE_CSV_TEMPLATE);
    const file = yield electronAPI.openSaveFileDialog(['csv'], 'slide_relabeler_template.csv');
    if (file) {
      yield call(export_sample_csv_template, file);
    }
  }
}
