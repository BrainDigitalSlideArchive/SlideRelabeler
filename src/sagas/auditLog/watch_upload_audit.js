import { takeEvery, select } from 'redux-saga/effects';

import * as dsa_actions from '../../actions/dsa';
import * as globus_actions from '../../actions/globus';
import { buildUploadAuditEntry } from '../../helpers/audit_log.js';
import { recordAuditIfEnabled } from './export_audit_log.js';

function* onDsaUploadComplete(action) {
  const payload = action.payload;
  const row_idx = typeof payload === 'object' ? payload.row_idx : payload;
  const config = yield select((state) => state.config);
  const file_cols = yield select((state) => state.files.file_columns);
  const runId = yield select((state) => state.auditLog?.currentRunId);
  const file_rows = yield select((state) => state.files.file_rows);
  const fileRow = file_rows[row_idx];
  if (!fileRow) return;

  yield recordAuditIfEnabled(buildUploadAuditEntry({
    type: 'upload_complete',
    runId,
    fileRow,
    config,
    fileCols: file_cols,
    upload: {
      destination: 'dsa',
      remoteId: typeof payload === 'object' ? payload.itemId : '',
      remotePath: typeof payload === 'object' ? payload.fileName : '',
      status: 'complete',
    },
  }));
}

function* onGlobusUploadComplete(action) {
  const row_idx = action.payload;
  const config = yield select((state) => state.config);
  const file_cols = yield select((state) => state.files.file_columns);
  const runId = yield select((state) => state.auditLog?.currentRunId);
  const collection_path = yield select((state) => state.globus.collection_path);
  const file_rows = yield select((state) => state.files.file_rows);
  const fileRow = file_rows[row_idx];
  if (!fileRow) return;

  yield recordAuditIfEnabled(buildUploadAuditEntry({
    type: 'upload_complete',
    runId,
    fileRow,
    config,
    fileCols: file_cols,
    upload: {
      destination: 'globus',
      remotePath: collection_path,
      status: 'complete',
    },
  }));
}

function* onGlobusUploadFailure(action) {
  const payload = action.payload;
  const row_idx = payload?.row_idx ?? payload;
  const config = yield select((state) => state.config);
  const file_cols = yield select((state) => state.files.file_columns);
  const runId = yield select((state) => state.auditLog?.currentRunId);
  const file_rows = yield select((state) => state.files.file_rows);
  const fileRow = file_rows[row_idx];
  if (!fileRow) return;

  yield recordAuditIfEnabled(buildUploadAuditEntry({
    type: 'upload_failed',
    runId,
    fileRow,
    config,
    fileCols: file_cols,
    upload: {
      destination: 'globus',
      status: 'failed',
    },
    errorMessage: payload?.message || payload?.error || 'Globus upload failed',
  }));
}

export default function* watch_upload_audit() {
  yield takeEvery(dsa_actions.UPLOAD_FILE_COMPLETE, onDsaUploadComplete);
  yield takeEvery(globus_actions.UPLOAD_FILE_COMPLETE, onGlobusUploadComplete);
  yield takeEvery(globus_actions.UPLOAD_FILE_FAILURE, onGlobusUploadFailure);
}
