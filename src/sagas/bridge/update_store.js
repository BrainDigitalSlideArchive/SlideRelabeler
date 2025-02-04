import {take} from 'redux-saga/effects';

import get_store from '../bridge/get_store';
import * as app_actions from '../../actions/app';

export default function* update_store() {
  while(true) {
    const action = yield take(app_actions.UPDATE_STORE);
    yield get_store();
  }
}