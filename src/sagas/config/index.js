import {take, fork, cancel} from 'redux-saga/effects';

import select_icon_file from "./select_icon_file";
import watch_export_sample_csv_template from "./watch_export_sample_csv_template";

import * as config_actions from "../../actions/config";

export function* config_saga () {
  while(true) {
    // Start all async watchers
    yield take(config_actions.START_CONFIG_SAGA);
    const select_icon_file_watcher = yield fork(select_icon_file);
    const watch_export_sample_csv_template_watcher = yield fork(watch_export_sample_csv_template);
    // Stop all async watchers when the component is unmounted
    yield take(config_actions.STOP_CONFIG_SAGA);
    yield cancel(select_icon_file_watcher);
    yield cancel(watch_export_sample_csv_template_watcher);
  }
}

export default config_saga;