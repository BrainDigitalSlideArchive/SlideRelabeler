import { take, put, select, call, fork, cancel, delay } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';
import * as auditLog_actions from '../../actions/auditLog';

import process_file from './process_file';
import {
  buildBatchCompleteEntry,
  buildBatchStartEntry,
  buildSlideErrorAuditEntry,
  createRunId,
  hasSlideErrorAuditForSource,
} from '../../helpers/audit_log.js';
import { recordAuditIfEnabled } from '../auditLog/export_audit_log.js';
import * as globus_actions from '../../actions/globus';
import {
  clearDeferredGlobusUploads,
  getDeferredGlobusUploadCount,
  resolveMaxUploadBatchSize,
  takeDeferredGlobusUploads,
} from '../../helpers/globus_upload_batch.js';

function countPendingUploads(file_rows, dsa_upload_queue, globus_upload_queue) {
  const queuedRowIds = new Set();
  const mergeQueues = [dsa_upload_queue, globus_upload_queue].filter(Array.isArray);
  mergeQueues.forEach((upload_queue) => {
    upload_queue.forEach((q) => {
      if (q?.kind === 'batch' && Array.isArray(q.items)) {
        q.items.forEach((it) => {
          if (it && typeof it.row_idx !== 'undefined') queuedRowIds.add(String(it.row_idx));
        });
      } else if (q && typeof q.row_idx !== 'undefined') {
        queuedRowIds.add(String(q.row_idx));
      }
    });
  });

  let count = 0;
  for (const row_idx in file_rows) {
    const row = file_rows[row_idx];
    if (row?.__reserved?.processed !== 1) continue;
    if (row?.__reserved?.deleted_after === true) continue;

    const uploadProgress = row?.__reserved?.upload_progress;
    const isQueued = row?.__reserved?.upload_queued === true;
    const isInQueue = queuedRowIds.has(String(row_idx));

    if (
      isQueued ||
      uploadProgress === undefined ||
      uploadProgress < 100 ||
      isInQueue
    ) {
      count++;
    }
  }
  return count;
}

function* recordSlideErrorsForBatch(runId, file_rows, config, file_cols) {
  for (const row_idx in file_rows) {
    const row = file_rows[row_idx];
    if (row?.__reserved?.processed === 1 || !row?.__reserved?.error) continue;

    const sourcePath = row.__reserved?.source?.path ?? '';
    const currentAuditEntries = yield select((state) => state.auditLog?.entries ?? []);
    if (hasSlideErrorAuditForSource(currentAuditEntries, runId, sourcePath)) continue;

    yield recordAuditIfEnabled(buildSlideErrorAuditEntry({
      runId,
      fileRow: row,
      config,
      fileCols: file_cols,
    }));
  }
}

function* finalizeBatchRun(runId, { cancelled = false } = {}) {
  if (!runId) return false;

  const existingEntries = yield select((state) => state.auditLog?.entries ?? []);
  if (existingEntries.some((e) => e.type === 'batch_complete' && e.runId === runId)) {
    return false;
  }

  const file_rows_final = yield select((state) => state.files.file_rows);
  const config = yield select((state) => state.config);
  const file_cols = yield select((state) => state.files.file_columns);

  yield* recordSlideErrorsForBatch(runId, file_rows_final, config, file_cols);

  let batchSuccessCount = 0;
  let batchErrorCount = 0;
  for (const row_idx in file_rows_final) {
    const row = file_rows_final[row_idx];
    if (row?.__reserved?.processed === 1) {
      batchSuccessCount += 1;
    } else if (row?.__reserved?.error) {
      batchErrorCount += 1;
    }
  }

  const completeSummary = {
    successCount: batchSuccessCount,
    errorCount: batchErrorCount,
    totalCount: Object.keys(file_rows_final).length,
    ...(cancelled ? { cancelled: true } : {}),
  };
  const completeEntry = buildBatchCompleteEntry(runId, completeSummary);
  yield recordAuditIfEnabled(completeEntry);

  const auditEntriesAfter = yield select((state) => state.auditLog?.entries ?? []);
  const batchStartEntry = auditEntriesAfter.find(
    (e) => e.type === 'batch_start' && e.runId === runId,
  );
  if (batchStartEntry) {
    yield put({
      type: auditLog_actions.UPDATE_AUDIT_ENTRY,
      payload: {
        id: batchStartEntry.id,
        patch: { status: completeEntry.status },
      },
    });
  }

  return true;
}

function* flushDeferredGlobusUploads(batchSize) {
  const pending = getDeferredGlobusUploadCount();
  if (pending === 0) return;

  // null = wait for end-of-run flush (caller passes forceAll)
  if (batchSize == null) return;

  while (getDeferredGlobusUploadCount() >= batchSize) {
    const items = takeDeferredGlobusUploads(batchSize);
    if (!items.length) break;
    const first = items[0];
    yield put({
      type: globus_actions.UPLOAD_BATCH,
      payload: {
        items,
        collection_path: first.collection_path,
        source_endpoint: first.source_endpoint,
      },
    });
  }
}

function* flushAllDeferredGlobusUploads() {
  const items = takeDeferredGlobusUploads(null);
  if (!items.length) return;
  const first = items[0];
  yield put({
    type: globus_actions.UPLOAD_BATCH,
    payload: {
      items,
      collection_path: first.collection_path,
      source_endpoint: first.source_endpoint,
    },
  });
}

function* watch_cancel_process_files(process_files_task) {
  yield take(files_actions.CANCEL_PROCESS_FILES);
  clearDeferredGlobusUploads();
  const runId = yield select((state) => state.auditLog?.currentRunId);
  yield call(electronAPI.cancelRestartBridge);
  yield put({ type: files_actions.CLEAR_PROGRESS });
  yield delay(2000);
  const processing_files = yield select(state => state.files.processing_files);
  for (let idx in processing_files) {
    let { file_row_idx, output_path } = processing_files[idx];
    let delete_result = yield call(electronAPI.deletePartialFile, output_path + '.partial');
    if (delete_result !== true) {
      yield put({ type: debug_actions.ADD_BACKEND_ERROR_MESSAGE, payload: { message: "Error deleting partial file", error: delete_result } });
    }
    yield put({ type: files_actions.RESET_FILE_ROW_PROGRESS, payload: file_row_idx });
  }
  yield put({ type: files_actions.CLEAR_PROCESSING_FILES });
  yield* finalizeBatchRun(runId, { cancelled: true });
  yield cancel(process_files_task);
  yield put({ type: files_actions.NOT_PROCESSING });
  yield put({ type: auditLog_actions.SET_AUDIT_LOG_CURRENT_RUN, payload: null });
}

function* process_files_worker() {
  const file_rows = yield select(state => state.files.file_rows);
  const runId = createRunId();
  let batchFinalized = false;
  clearDeferredGlobusUploads();

  try {
    yield put({ type: auditLog_actions.SET_AUDIT_LOG_CURRENT_RUN, payload: runId });
    yield recordAuditIfEnabled(buildBatchStartEntry(runId, file_rows.length));

    let run_process_files = true;

    while (run_process_files) {
      const file_rows_current = yield select(state => state.files.file_rows);
      const config = yield select((state) => state.config);
      const file_cols = yield select((state) => state.files.file_columns);
      const batchSize = resolveMaxUploadBatchSize(config?.globus_upload?.max_upload_batch_size);

      const ur = yield select((state) => state.uploadRouting);
      const upload_throttle_limit = ur.max_local_pending || 2;
      const should_throttle = ur.auto_upload && !ur.keep_local_copy;

      let processed_files_count = 0;
      let metadata_pending_count = 0;
      let error_files_count = 0;

      for (let file_row_idx in file_rows_current) {
        try {
          let file_row = file_rows_current[file_row_idx];
          if (file_row.__reserved.processed !== 1 && !file_row.__reserved.error && file_row.__reserved.bytes) {
            if (should_throttle) {
              const current_file_rows = yield select((state) => state.files.file_rows);
              const dsa_upload_queue = yield select((state) => state.dsa.upload_queue);
              const globus_upload_queue = yield select((state) => state.globus.upload_queue);
              const pending_count = countPendingUploads(current_file_rows, dsa_upload_queue, globus_upload_queue)
                + getDeferredGlobusUploadCount();
              if (pending_count >= upload_throttle_limit) {
                yield delay(1000);
                break;
              }
            }
            yield call(process_file, file_row_idx, file_row);
            if (batchSize != null && batchSize > 1) {
              yield* flushDeferredGlobusUploads(batchSize);
            }
            processed_files_count += 1;
          } else if (file_row.__reserved.processed !== 1 && !file_row.__reserved.error && !file_row.__reserved.bytes) {
            metadata_pending_count += 1;
          } else if (file_row.__reserved.processed !== 1 && file_row.__reserved.error) {
            error_files_count += 1;
            const sourcePath = file_row.__reserved?.source?.path ?? '';
            const currentAuditEntries = yield select((state) => state.auditLog?.entries ?? []);
            if (!hasSlideErrorAuditForSource(currentAuditEntries, runId, sourcePath)) {
              yield recordAuditIfEnabled(buildSlideErrorAuditEntry({
                runId,
                fileRow: file_row,
                config,
                fileCols: file_cols,
              }));
            }
          } else if (file_row.__reserved.processed === 1) {
            processed_files_count += 1;
          }
        } catch (err) {
          console.log('Error processing file', err);
        }
      }

      if (metadata_pending_count === 0 && (error_files_count + processed_files_count) === file_rows_current.length) {
        run_process_files = false;
      }
    }

    yield* flushAllDeferredGlobusUploads();
    batchFinalized = yield* finalizeBatchRun(runId);
  } finally {
    // On cancel/error, still try to flush whatever was deferred
    yield* flushAllDeferredGlobusUploads();
    if (!batchFinalized) {
      yield* finalizeBatchRun(runId, { cancelled: true });
    }
    clearDeferredGlobusUploads();
    yield put({ type: auditLog_actions.SET_AUDIT_LOG_CURRENT_RUN, payload: null });
    yield put({ type: files_actions.NOT_PROCESSING });
  }
}

function* cancel_cancel_watch_during_processing(watch_cancel_process_files_task) {
  let run_cancel_watch = true;

  while (run_cancel_watch) {
    const processing_files = yield select(state => state.files.processing_files);
    const processing = yield select(state => state.files.processing);
    if (!processing && !processing_files.length == 0) {
      yield cancel(watch_cancel_process_files_task);
      run_cancel_watch = false;
    }
    yield delay(1000);
  }
  yield put({ type: files_actions.NOT_PROCESSING })
}

export default function* process_files() {
  while (true) {
    yield take(files_actions.PROCESS_FILES);
    yield put({ type: files_actions.TOGGLE_PROCESSING });
    const process_files_worker_task = yield fork(process_files_worker);
    const watch_cancel_process_files_task = yield fork(watch_cancel_process_files, process_files_worker_task);

    yield fork(cancel_cancel_watch_during_processing, watch_cancel_process_files_task);
  }
}
