// helpers/esm_filename_helpers.js — re-exports from slide_naming.js for eSM staging compatibility.

export {
  safeToken,
  getAccessionFromBarcodeId,
  getEsmStagingSlideId,
  computeAccessionToken,
  buildBaseFilename,
  applyDuplicateStrategy,
} from './slide_naming.js';
