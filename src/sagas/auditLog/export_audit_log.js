import { take, call, select, put } from 'redux-saga/effects';

import * as auditLog_actions from '../../actions/auditLog';
import { entriesToCsvData } from '../../helpers/audit_log_export.js';

function* export_audit_log_to_file(file, entries, columns) {
  const output_data = entriesToCsvData(entries, { columns });
  yield call(electronAPI.writeCSV, file, output_data);
}

export default function* watch_export_audit_log() {
  while (true) {
    const action = yield take(auditLog_actions.EXPORT_AUDIT_LOG);
    const entries = action.payload?.entries;
    const columns = action.payload?.columns;
    if (!entries?.length) continue;

    const file = yield call(electronAPI.openSaveFileDialog, ['csv']);
    if (file) {
      yield call(export_audit_log_to_file, file, entries, columns);
    }
  }
}

export function* recordAuditIfEnabled(entry) {
  if (!entry) return;
  const enabled = yield select((state) => state.auditLog?.settings?.enabled !== false);
  if (!enabled) return;
  yield put({ type: auditLog_actions.RECORD_AUDIT_ENTRY, payload: entry });
}
