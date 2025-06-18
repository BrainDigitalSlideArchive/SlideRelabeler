import {delay} from 'redux-saga/effects';
import load_saved_store from "./load_saved_store";

export default function* constant_update_store() {
  while(true) {
    yield delay(1000);
    yield load_saved_store();
    console.log("Store updated");
  }
}