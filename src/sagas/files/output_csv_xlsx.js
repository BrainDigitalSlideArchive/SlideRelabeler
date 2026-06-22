import { take, select, put } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as auditLog_actions from '../../actions/auditLog';
import { sortAuditEntriesNewestFirst } from '../../helpers/audit_log_filter.js';

export default function* output_csv_xlsx() {
  while (true) {
    yield take(files_actions.SELECT_OUTPUT_CSV_XSLX);
    const entries = yield select((state) => state.auditLog?.entries ?? []);
    if (entries.length === 0) continue;
    yield put({
      type: auditLog_actions.EXPORT_AUDIT_LOG,
      payload: { entries: sortAuditEntriesNewestFirst(entries) },
    });
  }
}
