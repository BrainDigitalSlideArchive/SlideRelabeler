import { fork, put, cancel, select, call } from 'redux-saga/effects';

import monitor_process_progress from "./monitor_process_progress";

import * as files_actions from '../../actions/files';
import * as debug_actions from '../../actions/debug';
import * as dsa_actions from '../../actions/dsa';
import { structToObject, buildFileRowErrorFromBackend } from '../../helpers/grpc_helpers';
import * as globus_actions from '../../actions/globus';
import {
  AUDIT_STATUS,
  buildSlideAuditEntry,
  buildSlideErrorAuditEntry,
} from '../../helpers/audit_log.js';
import { recordAuditIfEnabled } from '../auditLog/export_audit_log.js';

export default function* process_file(file_row_idx, file_row) {
  try {
    const config = yield select(state => state.config);
    const file_cols = yield select(state => state.files.file_columns);
    const runId = yield select(state => state.auditLog?.currentRunId);

    let info = {
      config: config,
      ...file_row
    };

    let output_path = yield call(electronAPI.getOutputPath, info);
    const monitor_progress = yield fork(monitor_process_progress, file_row_idx, info, output_path);

    yield put({ type: files_actions.ADD_PROCESSING_FILE, payload: { file_row_idx, output_path } });

    const processed_file = yield call(electronAPI.processFile, info);
    let processed_file_object = yield structToObject(processed_file);
    let processed_file_json = JSON.parse(processed_file_object.value);

    const response_json = yield call(electronAPI.getMetadata, output_path);
    processed_file_json.associatedImages = response_json.associatedImages;

    yield put({ type: files_actions.PROCESSED_FILE, payload: { row_idx: file_row_idx, processedFile: processed_file_json } });
    yield cancel(monitor_progress);
    yield put({ type: files_actions.REMOVE_PROCESSING_FILE, payload: file_row_idx });

    const updatedRow = {
      ...file_row,
      __reserved: {
        ...file_row.__reserved,
        output_path: processed_file_json.output_path ?? output_path,
        processed: 1,
      },
    };

    yield recordAuditIfEnabled(buildSlideAuditEntry({
      type: 'slide_processed',
      runId,
      fileRow: updatedRow,
      config,
      fileCols: file_cols,
      outputPath: processed_file_json.output_path ?? output_path,
      status: AUDIT_STATUS.SUCCESS,
    }));

    const ur = yield select((state) => state.uploadRouting);
    const folder_id = yield select((state) => state.dsa.folder_id);
    const api_auth = yield select((state) => state.dsa.api_auth);
    if (ur.auto_upload && ur.destination === 'dsa' && api_auth && api_auth.authToken) {
      yield put({ type: dsa_actions.UPLOAD_FILE, payload: { row_idx: file_row_idx, folder_id: folder_id, file_path: output_path, file: processed_file } });
    }

    const collection_path = yield select((state) => state.globus.collection_path);
    const globus_api_auth = yield select((state) => state.globus.api_auth);
    const source_endpoint = yield select((state) => state.globus.source_endpoint);
    if (ur.auto_upload && ur.destination === 'globus' && globus_api_auth) {
      const rowN = Number(file_row_idx);
      yield put({
        type: globus_actions.UPLOAD_FILE,
        payload: {
          row_idx: Number.isFinite(rowN) ? rowN : file_row_idx,
          collection_path: collection_path,
          file_path: output_path,
          file: processed_file,
          source_endpoint: source_endpoint,
        },
      });
    }
  } catch (error) {
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
