import { put, take, select, call } from "redux-saga/effects";

import * as esm_actions from "../../actions/esm";
import * as files_actions from "../../actions/files";
import * as modal_actions from "../../actions/modal";

import { return_filename_dir_from_path, return_separator } from "../../helpers/renderer_path_helpers";
import get_uuid from "../files/get_uuid";

import {
  applyDuplicateStrategy,
  getAccessionFromBarcodeId,
} from "../../helpers/esm_filename_helpers";

import { buildStagingSlides } from "../../helpers/esm_results_filter";
import {
  getActiveProfile,
  applyProfilePatternsToFileRow,
  collectEsmImportColumnFields,
} from "../../helpers/esm_profile_helpers";
import { applyRowNamingDefaults, initRowNamingSources } from "../../helpers/row_naming_defaults";

function getFileExtFromPath(p) {
  const s = (p ?? "").toString();
  const idx = s.lastIndexOf(".");
  if (idx === -1) return "";
  return s.slice(idx);
}

function* slideToFileRow(slide, output_dir, criteriaDeid) {
  const accession = getAccessionFromBarcodeId(slide?.BarcodeId);
  const file_path = slide?.CompressedFileLocation || "";
  if (!file_path) return null;

  const { filename, directory } = return_filename_dir_from_path(file_path);
  const path_sep = return_separator();

  const extWithDot = getFileExtFromPath(filename);
  const ext = extWithDot.slice(1);
  const name = extWithDot ? filename.slice(0, filename.length - extWithDot.length) : filename;

  const source = {
    filename: filename,
    directory: directory,
    path: file_path,
    parsed: {
      ext: extWithDot,
      dir: directory,
      base: filename,
      name: name,
      root: directory.split(path_sep).shift(),
    },
    sep: path_sep,
  };

  const file_uuid = yield get_uuid(file_path);

  const file_row = {
    Accession: accession,
    BlockId: slide?.BlockId || "",
    StainId: slide?.StainId || "",
    CompressedFileLocation: slide?.CompressedFileLocation || "",
    SlideNum: slide?.SlideNum || "",
    ImageId: slide?.ImageId || "",
    SlideId: slide?.SlideId || "",
    ScanDate: slide?.ScanDate || "",
    deid: criteriaDeid || "",
    __reserved: {
      source: source,
      uuid: file_uuid,
      rename: '',
      processed: 0,
    },
  };

  file_row.__reserved.destinationDirectory = output_dir;
  return file_row;
}

export function* watch_apply_selection() {
  while (true) {
    yield take(esm_actions.ESM_APPLY_SELECTION);

    const esmState = yield select((state) => state.esm);
    const searchRows = esmState.searchRows;
    const slidesByAccession = esmState.slidesByAccession;
    const selectedIds = esmState.selectedIds;
    const output_dir = yield select((state) => state.files.output_dir);
    const config = yield select((state) => state.config);
    const file_cols = yield select((state) => state.files.file_columns);
    const enrichedConfig = { ...config, fileCols: file_cols };

    const profile = getActiveProfile(esmState);
    const stagingRows = buildStagingSlides({
      searchRows,
      slidesByAccession,
      profile,
    });

    if (!Array.isArray(selectedIds) || selectedIds.length === 0 || stagingRows.length === 0) {
      continue;
    }

    const selectedStaging = stagingRows.filter((r) => selectedIds.includes(r?.__esm?.id));

    if (selectedStaging.length === 0) continue;

    const duplicateStrategy = profile?.duplicateStrategy || 'suffix-index';

    const prepared = [];
    for (const row of selectedStaging) {
      const slide = row.__raw;
      const criteriaRow = row.__esm?.criteriaRow;
      const id = row.__esm?.id;

      let fileRow = yield call(slideToFileRow, slide, output_dir, criteriaRow?.deid || '');
      if (!fileRow) continue;

      fileRow = initRowNamingSources(fileRow);
      fileRow = applyProfilePatternsToFileRow(fileRow, profile, slide, criteriaRow);
      prepared.push({ id, slide, criteriaRow, fileRow });
    }

    let renameById = new Map();
    if (profile?.outputNameMapping?.enabled) {
      const items = prepared
        .filter((p) => p.fileRow.__reserved?.rename)
        .map((p) => ({
          id: p.id,
          baseName: p.fileRow.__reserved.rename,
          ext: getFileExtFromPath(p.slide?.CompressedFileLocation),
        }));
      const deduped = applyDuplicateStrategy(items, duplicateStrategy);
      renameById = new Map(deduped.map((it) => [it.id, it.finalBaseName || it.baseName || '']));
      for (const p of prepared) {
        if (renameById.has(p.id)) {
          p.fileRow.__reserved.rename = renameById.get(p.id);
        }
      }
    }

    const file_rows = [];
    for (const p of prepared) {
      if (profile?.outputNameMapping?.enabled && !renameById.has(p.id) && duplicateStrategy === 'skip-duplicates') {
        continue;
      }
      const fileRow = applyRowNamingDefaults(p.fileRow, enrichedConfig);
      file_rows.push(fileRow);
    }

    if (file_rows.length > 0) {
      for (const field of collectEsmImportColumnFields(profile, file_rows)) {
        yield put({ type: files_actions.ADD_FILE_COL, payload: { field } });
      }
      yield put({ type: files_actions.ADD_FILE_ROWS, payload: file_rows });
      yield put({ type: files_actions.UPDATE_FILES_WITHOUT_METADATA });
    }

    yield put({ type: esm_actions.ESM_CLEAR_RESULTS });
    yield put({ type: modal_actions.TOGGLE_MODAL, payload: { type: "esm" } });
  }
}
