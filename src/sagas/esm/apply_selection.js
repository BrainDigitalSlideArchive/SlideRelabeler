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
} from "../../helpers/esm_filename_helpers";

import { applyRules, getSelectedTransformRules } from "../../helpers/esm_transform_rules";

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

  // Use the same robust extension extraction as getFileExtFromPath for consistency
  const extWithDot = getFileExtFromPath(filename); // e.g. ".svs" or ""
  const ext = extWithDot.slice(1); // "svs" or ""
  const name = extWithDot ? filename.slice(0, filename.length - extWithDot.length) : filename;

  const source = {
    filename: filename,
    directory: directory,
    path: file_path,
    parsed: {
      ext: extWithDot, // includes the dot or empty string
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

  file_row.__reserved.destinationDirectory = output_dir; // can be null
  return file_row;
}

export function* watch_apply_selection() {
  while (true) {
    yield take(esm_actions.ESM_APPLY_SELECTION);

    const slides = yield select((state) => state.esm.results);
    const selectedIds = yield select((state) => state.esm.selectedIds);
    const mappingConfig = yield select((state) => state.esm.mappingConfig);
    const transformRules = yield select((state) => state.esm.transformRules);
    const selectedTransformRuleIds = yield select((state) => state.esm.selectedTransformRuleIds);
    const output_dir = yield select((state) => state.files.output_dir);

    if (!Array.isArray(slides) || slides.length === 0 || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      continue;
    }

    // Filter slides to selection (IDs align with ESMAgGrid normalize logic)
    const selectedSlides = slides.filter((s) => {
      const accession = getAccessionFromBarcodeId(s?.BarcodeId);
      const id = (s?.ImageId ?? s?.SlideId ?? `${accession}:${s?.SlideNum ?? ""}:${s?.CompressedFileLocation ?? ""}`).toString();
      return selectedIds.includes(id);
    });

    if (selectedSlides.length === 0) continue;

    // Build base filenames for duplicate handling across the selection.
    const selectedRules = getSelectedTransformRules(transformRules, selectedTransformRuleIds);
    const filenameItems = selectedSlides.map((s) => {
      const accessionToken = computeAccessionToken(s, mappingConfig);
      const baseName = buildBaseFilename(
        s,
        accessionToken,
        mappingConfig,
        (value) => applyRules(value, selectedRules),
      );
      const ext = getFileExtFromPath(s?.CompressedFileLocation);
      const id = (s?.ImageId ?? s?.SlideId ?? `${getAccessionFromBarcodeId(s?.BarcodeId)}:${s?.SlideNum ?? ""}:${s?.CompressedFileLocation ?? ""}`).toString();
      return { id, slide: s, baseName, ext };
    });

    const deduped = applyDuplicateStrategy(
      filenameItems.map((it) => ({ id: it.id, baseName: it.baseName, ext: it.ext })),
      mappingConfig?.duplicateStrategy,
    );

    const renameById = new Map();
    for (const it of deduped) {
      const base = it.finalBaseName || it.baseName || "";
      renameById.set(it.id, base || "");  // Store stem only, no extension
    }

    const file_rows = [];
    for (const it of filenameItems) {
      const rename = renameById.get(it.id) || "";
      // If duplicateStrategy skipped the slide, it won't be present in renameById.
      if (!renameById.has(it.id) && (mappingConfig?.duplicateStrategy === "skip-duplicates")) {
        continue;
      }
      const row = yield call(slideToFileRow, it.slide, output_dir, rename);
      if (row) file_rows.push(row);
    }

    if (file_rows.length > 0) {
      yield put({ type: files_actions.ADD_FILE_ROWS, payload: file_rows });
      // Trigger metadata processing (thumbnails, file size, etc.)
      yield put({ type: files_actions.UPDATE_FILES_WITHOUT_METADATA });
    }

    // Clear staging state but keep modal open for continued searching while processing.
    yield put({ type: esm_actions.ESM_CLEAR_RESULTS });
    yield put({ type: modal_actions.TOGGLE_MODAL, payload: { type: "esm" } });
  }
}

