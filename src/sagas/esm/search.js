import { put, take, select } from 'redux-saga/effects';
import * as esm_actions from '../../actions/esm';
import {
  normalizeAccessionKey,
  uniqueAccessionSearchStrings,
  buildStagingSlides,
} from '../../helpers/esm_results_filter';
import {
  compileSearchFeedback,
  validationSearchFeedback,
  refineOutcomesWithStaging,
} from '../../helpers/esm_search_feedback';
import { getActiveProfile, getEsmConnectionConfig } from '../../helpers/esm_profile_helpers';

function* watch_search() {
  while (true) {
    yield take(esm_actions.ESM_SEARCH_BATCH);

    const esmState = yield select((state) => state.esm);
    const searchRows = esmState.searchRows;
    const username = esmState.username;
    const password = esmState.password;
    const { canonicalUrl, proxyUrl } = getEsmConnectionConfig(esmState);
    const connection = { url: canonicalUrl, proxyUrl };
    const profile = getActiveProfile(esmState);

    const unique = uniqueAccessionSearchStrings(searchRows);
    if (unique.length === 0) {
      yield put({
        type: esm_actions.ESM_SEARCH_COMPLETE,
        payload: validationSearchFeedback('Add at least one accession to search.'),
      });
      continue;
    }

    yield put({ type: esm_actions.ESM_SEARCH });

    const map = {};
    const outcomes = [];

    for (const acc of unique) {
      const key = normalizeAccessionKey(acc);
      try {
        const response = yield electronAPI.esmSearchAccession(connection, username, password, acc);
        if (response[0]) {
          const slides = Array.isArray(response[1]) ? response[1] : [];
          map[key] = slides;
          outcomes.push({ accession: acc, status: 'pending' });
        } else {
          map[key] = [];
          outcomes.push({
            accession: acc,
            status: 'error',
            message: response[1]?.message || 'Search failed',
          });
        }
      } catch (e) {
        map[key] = [];
        outcomes.push({
          accession: acc,
          status: 'error',
          message: e?.message || 'Search failed',
        });
      }
    }

    yield put({ type: esm_actions.ESM_SET_SLIDES_BY_ACCESSION, payload: map });

    const refined = refineOutcomesWithStaging(outcomes, searchRows, map, profile);
    const staging = buildStagingSlides({ searchRows, slidesByAccession: map, profile });
    const feedback = compileSearchFeedback(refined, staging.length);

    yield put({ type: esm_actions.ESM_SEARCH_COMPLETE, payload: feedback });

    if (feedback.level !== 'error') {
      yield put({ type: esm_actions.ESM_SEARCH_SUCCESS });
    }
  }
}

export default watch_search;
