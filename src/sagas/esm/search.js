import { put, take, select } from 'redux-saga/effects';
import * as esm_actions from '../../actions/esm';
import * as modal_actions from '../../actions/modal';

/**
 * Search saga - handles eSlideManager slide search
 * @param {string} url - eSlideManager API URL
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} accession - Accession number to search for
 */
function* search(url, username, password, accession) {
    yield put({ type: esm_actions.ESM_SEARCH, payload: accession });
    try {
        const response = yield electronAPI.esmSearchAccession(url, username, password, accession);
        
        if (response[0]) {
            const slides = response[1];
            
            if (!slides || slides.length === 0) {
                yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: 'No slides found for accession: ' + accession });
                yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: 'No slides found for accession: ' + accession });
                return;
            }

            // Store results in esm state so user can filter/select + configure filename mapping
            yield put({ type: esm_actions.ESM_SET_RESULTS, payload: slides });
            yield put({ type: esm_actions.ESM_SEARCH_SUCCESS });
        } else {
            const errorMessage = response[1].message || 'Search failed';
            yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: errorMessage });
            yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: errorMessage });
        }
    } catch (error) {
        const errorMessage = error.message || 'Search failed';
        yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: errorMessage });
        yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: errorMessage });
    }
}

function* watch_search() {
    while (true) {
        const action = yield take(esm_actions.ESM_SEARCH);
        const username = yield select(state => state.esm.username);
        const password = yield select(state => state.esm.password);
        const url = yield select(state => state.esm.url);
        const accession = action.payload;
        yield search(url, username, password, accession);
    }
}

export default watch_search;
