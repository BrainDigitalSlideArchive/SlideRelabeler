import { fork, put, cancel, select, call } from 'redux-saga/effects';

import monitor_process_progress from "./monitor_process_progress";

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';
import * as dsa_actions from '../../actions/dsa';
import {
  structToObject,
  buildFileRowErrorFromBackend,
  UNSUPPORTED_FORMAT_SUMMARY,
} from '../../helpers/grpc_helpers';
import * as globus_actions from '../../actions/globus';
import {
  AUDIT_STATUS,
  buildSlideAuditEntry,
  buildSlideErrorAuditEntry,
} from '../../helpers/audit_log.js';
import { recordAuditIfEnabled } from '../auditLog/export_audit_log.js';
import {
  pushDeferredGlobusUpload,
  resolveMaxUploadBatchSize,
} from '../../helpers/globus_upload_batch.js';
import { pickProcessedOutputPath } from '../../helpers/process_output_path.js';
import { shouldSkipUnsupportedRow } from '../../helpers/deid_format_support.js';
import { attachLabelIconBytes } from '../../helpers/label_icon_batch.js';

export default function* process_file(file_row_idx, file_row, labelIconBytesBase64 = null) {
  let monitor_progress = null;
  try {
    const config = yield select(state => state.config);
    const file_cols = yield select(state => state.files.file_columns);
    const runId = yield select(state => state.auditLog?.currentRunId);
    const ur = yield select((state) => state.uploadRouting);

    if (shouldSkipUnsupportedRow(file_row, config)) {
      yield put({
        type: files_actions.UPDATE_FILE_ROW_WITH_ERROR,
        payload: {
          file_row_idx,
          error: UNSUPPORTED_FORMAT_SUMMARY,
          errorDetails: 'Slide carries no vendor metadata to de-identify (deid_format empty).',
        },
      });
      yield recordAuditIfEnabled(buildSlideErrorAuditEntry({
        runId,
        fileRow: {
          ...file_row,
          __reserved: { ...file_row.__reserved, error: UNSUPPORTED_FORMAT_SUMMARY },
        },
        config,
        fileCols: file_cols,
      }));
      return;
    }

    let rowForProcess = file_row;
    if (ur.auto_upload && !ur.keep_local_copy) {
      const stagingDir = yield call(electronAPI.getStagingDirectory, {
        mode: ur.staging_dir_mode || 'system',
        customPath: ur.staging_dir_custom || '',
      });
      rowForProcess = {
        ...file_row,
        __reserved: {
          ...file_row.__reserved,
          destinationDirectory: stagingDir,
        },
      };
    }

    const processConfig = attachLabelIconBytes(config, labelIconBytesBase64);
    let info = {
      config: processConfig,
      ...rowForProcess
    };

    let output_path = yield call(electronAPI.getOutputPath, info);
    monitor_progress = yield fork(monitor_process_progress, file_row_idx, info, output_path);

    yield put({ type: files_actions.ADD_PROCESSING_FILE, payload: { file_row_idx, output_path } });

    const processed_file = yield call(electronAPI.processFile, info);
    let processed_file_object = yield structToObject(processed_file);
    let processed_file_json = JSON.parse(processed_file_object.value);

    const actualPath = pickProcessedOutputPath(output_path, processed_file_json);
    const response_json = yield call(electronAPI.getMetadata, actualPath);
    processed_file_json.associatedImages = response_json.associatedImages;

    yield put({ type: files_actions.PROCESSED_FILE, payload: { row_idx: file_row_idx, processedFile: processed_file_json } });
    yield cancel(monitor_progress);
    monitor_progress = null;
    yield put({ type: files_actions.REMOVE_PROCESSING_FILE, payload: file_row_idx });

    const updatedRow = {
      ...file_row,
      __reserved: {
        ...file_row.__reserved,
        output_path: actualPath,
        processed: 1,
      },
    };

    yield recordAuditIfEnabled(buildSlideAuditEntry({
      type: 'slide_processed',
      runId,
      fileRow: updatedRow,
      config,
      fileCols: file_cols,
      outputPath: actualPath,
      status: AUDIT_STATUS.SUCCESS,
    }));

    const folder_id = yield select((state) => state.dsa.folder_id);
    const api_auth = yield select((state) => state.dsa.api_auth);
    if (ur.auto_upload && ur.destination === 'dsa' && api_auth && api_auth.authToken) {
      yield put({ type: dsa_actions.UPLOAD_FILE, payload: { row_idx: file_row_idx, folder_id: folder_id, file_path: actualPath, file: processed_file } });
    }

    const collection_path = yield select((state) => state.globus.collection_path);
    const globus_api_auth = yield select((state) => state.globus.api_auth);
    const source_endpoint = yield select((state) => state.globus.source_endpoint);
    if (ur.auto_upload && ur.destination === 'globus' && globus_api_auth) {
      const rowN = Number(file_row_idx);
      const payload = {
        row_idx: Number.isFinite(rowN) ? rowN : file_row_idx,
        collection_path: collection_path,
        file_path: actualPath,
        file: processed_file,
        source_endpoint: source_endpoint,
      };
      const batchSize = resolveMaxUploadBatchSize(config?.globus_upload?.max_upload_batch_size);
      if (batchSize === 1) {
        yield put({
          type: globus_actions.UPLOAD_FILE,
          payload,
        });
      } else {
        // null (whole run) or N > 1 — defer; process_files flushes batches
        pushDeferredGlobusUpload(payload);
      }
    }
  } catch (error) {
    // Leave no progress poller or processing entry behind: they keep the app in
    // processing mode, which disables the grid and makes Cancel restart the engine.
    if (monitor_progress) {
      yield cancel(monitor_progress);
      monitor_progress = null;
    }
    yield put({ type: files_actions.REMOVE_PROCESSING_FILE, payload: file_row_idx });

    const config = yield select(state => state.config);
    const file_cols = yield select(state => state.files.file_columns);
    const runId = yield select(state => state.auditLog?.currentRunId);
    const { summary, details } = buildFileRowErrorFromBackend(error, 'Error processing file');
    yield put({
      type: files_actions.UPDATE_FILE_ROW_WITH_ERROR,
      payload: { file_row_idx, error: summary, errorDetails: details },
    });
    yield put({
      type: debug_actions.ADD_BACKEND_ERROR_MESSAGE,
      payload: { message: details },
    });

    const errorRow = {
      ...file_row,
      __reserved: {
        ...file_row.__reserved,
        error: summary,
        errorDetails: details,
      },
    };

    yield recordAuditIfEnabled(buildSlideErrorAuditEntry({
      runId,
      fileRow: errorRow,
      config,
      fileCols: file_cols,
    }));
  }
}
