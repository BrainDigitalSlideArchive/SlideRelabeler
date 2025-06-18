import { take, fork, cancel } from 'redux-saga/effects';

import * as files_actions from "../../actions/files";

import add_files from "./add_files";
import add_folders from './add_folders';
import choose_output_dir from "./choose_output_dir";
import open_viewer from "./open_viewer";
import get_metadata from "./get_metadata";
import get_copy_progress from "./get_copy_progress";
import process_files from "./process_files";
import select_import_csv_xlsx from "./select_import_csv_xlsx";
import output_csv_xlsx from "./output_csv_xlsx";
import choose_csv_output_dir from "./choose_csv_output_dir";
import update_files_without_metadata from "./update_files_without_metadata";
import {watch_add_csv} from "./add_csv";

export function* files_saga () {
  while(true) {
    // Start all async watchers
    yield take(files_actions.START_FILES_SAGA);
    const add_files_watcher = yield fork(add_files);
    const choose_output_dir_watcher = yield fork(choose_output_dir);
    const choose_csv_output_dir_watcher = yield fork(choose_csv_output_dir);
    // const choose_input_dir_watcher = yield fork(choose_input_dir);
    const open_viewer_watcher = yield fork(open_viewer);
    const get_copy_progress_watcher = yield fork(get_copy_progress);
    const get_metadata_watcher = yield fork(get_metadata);
    const process_files_watcher = yield fork(process_files);
    const select_import_csv_xlsx_watcher = yield fork(select_import_csv_xlsx);
    // const set_input_dir_watcher = yield fork(set_input_dir);
    const output_csv_xlsx_watcher = yield fork(output_csv_xlsx);
    const add_csv_watcher = yield fork(watch_add_csv);
    const add_folders_watcher = yield fork(add_folders);
    const update_files_without_metadata_watcher = yield fork(update_files_without_metadata);

    // Stop all async watchers when the component is unmounted
    yield take(files_actions.STOP_FILES_SAGA);
    yield cancel(add_files_watcher);
    yield cancel(choose_output_dir_watcher);
    yield cancel(choose_csv_output_dir_watcher);
    // yield cancel(choose_input_dir_watcher);
    yield cancel(open_viewer_watcher);
    yield cancel(get_copy_progress_watcher);
    yield cancel(get_metadata_watcher);
    yield cancel(process_files_watcher);
    yield cancel(select_import_csv_xlsx_watcher);
    yield cancel(add_csv_watcher);
    // yield cancel(set_input_dir_watcher);
    yield cancel(output_csv_xlsx_watcher);
    yield cancel(add_folders_watcher);
    yield cancel(update_files_without_metadata_watcher);
  }
}

export default files_saga;