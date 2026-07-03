import { put, select, takeEvery } from 'redux-saga/effects';

import * as files_actions from '../../actions/files.js';
import * as upload_routing_actions from '../../actions/uploadRouting.js';
import {
  buildSeedOutputDirPayload,
  shouldSeedSessionOutputDir,
} from '../../helpers/sync_default_local_output_dir.js';

export function* maybeSeedSessionOutputDir() {
  const output_dir = yield select((state) => state.files?.output_dir);
  const defaultDir = yield select((state) => state.uploadRouting?.default_local_output_dir);
  if (!shouldSeedSessionOutputDir(output_dir, defaultDir)) {
    return;
  }
  yield put({
    type: files_actions.SET_OUTPUT_DIR,
    payload: buildSeedOutputDirPayload(defaultDir),
  });
}

export default function* sync_default_local_output_dir() {
  yield takeEvery(upload_routing_actions.RESTORE_UPLOAD_ROUTING, maybeSeedSessionOutputDir);
  yield takeEvery(upload_routing_actions.SET_DEFAULT_LOCAL_OUTPUT_DIR, maybeSeedSessionOutputDir);
  yield takeEvery(files_actions.CLEAR_FILES, maybeSeedSessionOutputDir);
}
