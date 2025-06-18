import { take, put } from "redux-saga/effects";

import * as debug_actions from "../../actions/debug";

import parse_debug_messages from "./parse_debug_messages";

export function* get_backend_debug_messages() {
    const debug_messages = yield electronAPI.getDebugs();
    const parsed_debug_messages = yield parse_debug_messages(JSON.parse(debug_messages));
    yield put({type: debug_actions.SET_BACKEND_DEBUG_MESSAGES, payload: parsed_debug_messages});
}

export default get_backend_debug_messages;