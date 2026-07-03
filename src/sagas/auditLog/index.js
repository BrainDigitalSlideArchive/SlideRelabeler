import { fork } from 'redux-saga/effects';

import watch_export_audit_log from './export_audit_log.js';
import watch_upload_audit from './watch_upload_audit.js';

export default function* auditLogSaga() {
  yield fork(watch_export_audit_log);
  yield fork(watch_upload_audit);
}

export { recordAuditIfEnabled } from './export_audit_log.js';
