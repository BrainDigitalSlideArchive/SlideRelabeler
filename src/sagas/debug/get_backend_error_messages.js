import { put } from "redux-saga/effects";

import * as debug_actions from "../../actions/debug";

import parse_debug_messages from "./parse_debug_messages";

export function* get_backend_error_messages() {
    try {
        const error_messages = yield electronAPI.getErrors();
        const parsed_error_messages = yield parse_debug_messages(JSON.parse(error_messages));
        yield put({type: debug_actions.SET_BACKEND_ERROR_MESSAGES, payload: parsed_error_messages});
    } catch (e) {
        console.log("Warning: Could not get backend error messages", e);
    }
}

export default get_backend_error_messages;