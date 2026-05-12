import { put, take, select, call } from "redux-saga/effects";

import * as esm_actions from "../../actions/esm";
import * as files_actions from "../../actions/files";
import * as modal_actions from "../../actions/modal";

import { return_filename_dir_from_path, return_separator } from "../../helpers/renderer_path_helpers";
import get_uuid from "../files/get_uuid";

import {
  computeAccessionToken,
  buildBaseFilename,
  applyDuplicateStrategy,
  getAccessionFromBarcodeId,
  getEsmStagingSlideId,
} from "../../helpers/esm_filename_helpers";

import { applyRules, getSelectedTransformRules } from "../../helpers/esm_transform_rules";
import { buildStagingSlides } from "../../helpers/esm_results_filter";

function getFileExtFromPath(p) {
  const s = (p ?? "").toString();
  const idx = s.lastIndexOf(".");
  if (idx === -1) return "";
  return s.slice(idx);
}

function* slideToFileRow(slide, output_dir, mappedRename) {
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
    __reserved: {
      source: source,
      uuid: file_uuid,
      rename: mappedRename || filename,
      processed: 0,
    },
  };

  file_row.__reserved.destinationDirectory = output_dir;
  return file_row;
}

export function* watch_apply_selection() {
  while (true) {
    yield take(esm_actions.ESM_APPLY_SELECTION);

    const searchRows = yield select((state) => state.esm.searchRows);
    const slidesByAccession = yield select((state) => state.esm.slidesByAccession);
    const selectedIds = yield select((state) => state.esm.selectedIds);
    const mappingConfig = yield select((state) => state.esm.mappingConfig);
    const transformRules = yield select((state) => state.esm.transformRules);
    const selectedTransformRuleIds = yield select((state) => state.esm.selectedTransformRuleIds);
    const output_dir = yield select((state) => state.files.output_dir);

    const selectedRules = getSelectedTransformRules(transformRules, selectedTransformRuleIds);
    const stagingRows = buildStagingSlides({
      searchRows,
      slidesByAccession,
      mappingConfig,
      transformRules,
      selectedTransformRuleIds,
    });

    if (!Array.isArray(selectedIds) || selectedIds.length === 0 || stagingRows.length === 0) {
      continue;
    }

    const selectedStaging = stagingRows.filter((r) => selectedIds.includes(r?.__esm?.id));

    if (selectedStaging.length === 0) continue;

    const filenameItems = selectedStaging.map((row) => {
      const slide = row.__raw;
      const criteriaRow = row.__esm?.criteriaRow;
      const accessionToken = computeAccessionToken(slide, mappingConfig, criteriaRow);
      const baseName = buildBaseFilename(
        slide,
        accessionToken,
        mappingConfig,
        (value) => applyRules(value, selectedRules),
      );
      const ext = getFileExtFromPath(slide?.CompressedFileLocation);
      const id = getEsmStagingSlideId(slide);
      return { id, slide, baseName, ext };
    });

    const deduped = applyDuplicateStrategy(
      filenameItems.map((it) => ({ id: it.id, baseName: it.baseName, ext: it.ext })),
      mappingConfig?.duplicateStrategy,
    );

    const renameById = new Map();
    for (const it of deduped) {
      const base = it.finalBaseName || it.baseName || "";
      renameById.set(it.id, base || "");
    }

    const file_rows = [];
    for (const it of filenameItems) {
      const rename = renameById.get(it.id) || "";
      if (!renameById.has(it.id) && mappingConfig?.duplicateStrategy === "skip-duplicates") {
        continue;
      }
      const row = yield call(slideToFileRow, it.slide, output_dir, rename);
      if (row) file_rows.push(row);
    }

    if (file_rows.length > 0) {
      yield put({ type: files_actions.ADD_FILE_ROWS, payload: file_rows });
      yield put({ type: files_actions.UPDATE_FILES_WITHOUT_METADATA });
    }

    yield put({ type: esm_actions.ESM_CLEAR_RESULTS });
    yield put({ type: modal_actions.TOGGLE_MODAL, payload: { type: "esm" } });
  }
}
