import {select, take} from 'redux-saga/effects';

import set_store from './set_store';

function* save_store() {
  while(true) {
    const action = yield take('*');
    const store = yield select();
    const response = yield set_store(store);
  }
}

export default save_store;