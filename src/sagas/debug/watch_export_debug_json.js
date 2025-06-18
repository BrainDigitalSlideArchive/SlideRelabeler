import { take, select } from 'redux-saga/effects';

import * as debug_actions from "../../actions/debug";

function* watch_export_debug_json() {
  while(true) {
    yield take(debug_actions.EXPORT_DEBUG_JSON);

    const debug = yield select(state => state.debug);
    const json = JSON.stringify(debug);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debug.json';
    a.click();
  }
}

export default watch_export_debug_json;