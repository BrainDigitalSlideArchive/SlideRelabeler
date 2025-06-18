import { take } from "redux-saga/effects";

import * as debug_actions from "../../actions/debug";

function* clear_backend_error_messages() {
    while(true) {
        const action = yield take(debug_actions.CLEAR_BACKEND_ERROR_MESSAGES);
        yield electronAPI.clearErrors();
    }
}

export default clear_backend_error_messages;