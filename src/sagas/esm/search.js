import { put, take, select } from 'redux-saga/effects';
import * as esm_actions from '../../actions/esm';
import * as modal_actions from '../../actions/modal';
import {
  normalizeAccessionKey,
  uniqueAccessionSearchStrings,
} from '../../helpers/esm_results_filter';

function* watch_search() {
  while (true) {
    yield take(esm_actions.ESM_SEARCH_BATCH);

    const searchRows = yield select((state) => state.esm.searchRows);
    const username = yield select((state) => state.esm.username);
    const password = yield select((state) => state.esm.password);
    const url = yield select((state) => state.esm.url);

    const unique = uniqueAccessionSearchStrings(searchRows);
    if (unique.length === 0) {
      yield put({
        type: esm_actions.ESM_SEARCH_ERROR,
        payload: 'Add at least one accession to search.',
      });
      yield put({
        type: modal_actions.DISPLAY_ERROR_MESSAGE,
        payload: 'Add at least one accession to search.',
      });
      continue;
    }

    yield put({ type: esm_actions.ESM_SEARCH });

    const map = {};
    const errors = [];

    for (const acc of unique) {
      const key = normalizeAccessionKey(acc);
      try {
        const response = yield electronAPI.esmSearchAccession(url, username, password, acc);
        if (response[0]) {
          map[key] = Array.isArray(response[1]) ? response[1] : [];
        } else {
          map[key] = [];
          const msg = response[1]?.message || 'Search failed';
          errors.push(`${acc}: ${msg}`);
        }
      } catch (e) {
        map[key] = [];
        errors.push(`${acc}: ${e?.message || 'Search failed'}`);
      }
    }

    yield put({ type: esm_actions.ESM_SET_SLIDES_BY_ACCESSION, payload: map });

    if (errors.length > 0) {
      const msg = errors.join(' ');
      yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: msg });
      yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: msg });
    } else {
      yield put({ type: esm_actions.ESM_SEARCH_SUCCESS });
    }
  }
}

export default watch_search;
