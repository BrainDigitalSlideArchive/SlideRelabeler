import { take, select } from "redux-saga/effects";

import * as files_actions from "../../actions/files";
import {return_file_extension_from_path, return_file_extension_from_source} from "../../helpers/renderer_path_helpers";
import output_csv from "./output_csv";

export default function* output_csv_xlsx() {
  while(true) {
    const action = yield take(files_actions.SELECT_OUTPUT_CSV_XSLX);
    const file = yield electronAPI.openSaveFileDialog(["csv", "xlsx"]);
    const ext = return_file_extension_from_path(file);
    if (ext === "csv") {
      yield output_csv(file);
    } else if (ext === "xlsx") {

    }
    else {
      console.log("No file for export.");
    }
  }
}