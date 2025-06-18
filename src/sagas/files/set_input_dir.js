import { take, select, put } from 'redux-saga/effects';

import * as files_actions from '../../actions/files';

import update_input_dir from "./update_input_dir";

export default function* set_input_dir() {
  while (true) {
    const action = yield take(files_actions.SET_INPUT_DIR);
    const input_dir = action.payload;

    yield update_input_dir(input_dir);
  }
}