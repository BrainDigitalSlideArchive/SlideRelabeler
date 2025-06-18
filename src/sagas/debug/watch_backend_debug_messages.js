import { take, put } from "redux-saga/effects";

import * as debug_actions from "../../actions/debug";

import get_backend_debug_messages from "./get_backend_debug_messages";

function* watch_backend_debug_messages() {
    while(true) {
        const action = yield take(debug_actions.GET_BACKEND_DEBUG_MESSAGES);
        yield call(get_backend_debug_messages);
    }
}

export default watch_backend_debug_messages;