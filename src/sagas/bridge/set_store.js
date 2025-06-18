import { call } from 'redux-saga/effects';

function* set_store(data) {
  yield call(electronAPI.setStore, data);
}

export default set_store;