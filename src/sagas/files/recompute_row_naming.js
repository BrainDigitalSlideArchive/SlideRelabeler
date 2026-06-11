import { put, select, take, call } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import * as config_actions from '../../actions/config';
import { applyAssemblyAndRoutingWithStore } from '../../helpers/assembly_routing.js';

export function* recompute_row_naming(file_row, file_row_idx) {
  const config = yield select((state) => state.config);
  const esm = yield select((state) => state.esm);
  const updated = applyAssemblyAndRoutingWithStore(file_row, config, esm);
  yield put({
    type: files_actions.UPDATE_FILE_ROW_NAMING,
    payload: { row_idx: file_row_idx, file_row: updated },
  });
  return updated;
}

export function* recompute_all_row_naming() {
  const file_rows = yield select((state) => state.files.file_rows);
  for (let idx = 0; idx < file_rows.length; idx++) {
    yield call(recompute_row_naming, file_rows[idx], idx);
  }
}

export function* watch_recompute_all_naming() {
  while (true) {
    yield take(config_actions.RECOMPUTE_ALL_NAMING);
    yield call(recompute_all_row_naming);
  }
}

export default watch_recompute_all_naming;
