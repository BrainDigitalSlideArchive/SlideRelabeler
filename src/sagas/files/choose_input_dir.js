import { take, put} from 'redux-saga/effects';

import * as files_actions from '../../actions/files';
import choose_dir from "./choose_dir";

export default function* choose_input_dir () {
  while (true) {
    yield choose_dir(files_actions.CHOOSE_INPUT_DIR, files_actions.SET_INPUT_DIR);
  }
};