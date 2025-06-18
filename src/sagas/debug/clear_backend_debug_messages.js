import { take } from "redux-saga/effects";

import * as debug_actions from "../../actions/debug";

function* clear_backend_debug_messages() {
    while(true) {
        const action = yield take(debug_actions.CLEAR_BACKEND_DEBUG_MESSAGES);
        yield electronAPI.clearDebugs();
    }
}

export default clear_backend_debug_messages;