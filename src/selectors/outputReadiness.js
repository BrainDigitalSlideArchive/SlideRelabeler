import {
  resolveRowsAfterSetOutputDir,
  rowHasDestinationDirectory,
  summarizeDestinationDirectories,
} from '../helpers/destination_directory.js';
import { selectPatternValidationFromState } from '../helpers/pattern_validation.js';
import { selectUploadReadiness } from './uploadRouting.js';
import { getSaveLocallyPanelCopy, SAVE_LOCALLY_CHOOSE_LABEL } from './saveLocallyPanelCopy.js';

export {
  getSaveLocallyPanelCopy,
  getSaveLocallyNeedsLocationHint,
  getSaveLocallyTooltipCopy,
  SAVE_LOCALLY_ALL_ROWS_OPTIONAL_HINT,
  SAVE_LOCALLY_CHANGE_TOOLTIP,
  SAVE_LOCALLY_CHOOSE_LABEL,
  SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT,
  SAVE_LOCALLY_NEW_FILES_EMPTY_TABLE_HINT,
  SAVE_LOCALLY_OFF_TEXT,
} from './saveLocallyPanelCopy.js';

export {
  resolveRowsAfterSetOutputDir,
  rowHasDestinationDirectory,
  summarizeDestinationDirectories,
};

export function allRowsHaveDestinationDirectory(file_rows) {
  return summarizeDestinationDirectories(file_rows).perRowComplete;
}

export function normalizeSetOutputDirPayload(payload) {
  if (typeof payload === 'string') {
    return { folder: payload, mode: 'fill_empty' };
  }
  return {
    folder: payload.folder,
    mode: payload.mode ?? 'fill_empty',
  };
}

/** @deprecated Use getSaveLocallyPanelCopy */
export function getSaveLocallyInlineCopy(destSummary, outputDir, { localEnabled = true } = {}) {
  return getSaveLocallyPanelCopy(destSummary, outputDir, { localEnabled }).hint;
}

export function selectOutputReadiness(state) {
  const { output_dir, file_rows, csv, file_cols } = state.files ?? {};
  const ur = state.uploadRouting ?? {};
  const localEnabled = !!ur.local_output_enabled;
  const uploadEnabled = !!ur.auto_upload;
  const anyDeliveryEnabled = localEnabled || uploadEnabled;
  const uploadOnly = uploadEnabled && !localEnabled;
  const rowCount = (file_rows ?? []).length;
  const perRowComplete = rowCount > 0 && allRowsHaveDestinationDirectory(file_rows);

  const uploadReadiness = selectUploadReadiness(state);
  const localConfigured = !localEnabled || perRowComplete;
  const uploadConfigured = !uploadEnabled || uploadReadiness.ready;

  const patternValidation = selectPatternValidationFromState({
    config: state.config,
    file_rows,
    file_cols,
  });

  const needsSlideDestination = localEnabled && (
    csv.needs_output_dir || !csv.headers
  );

  return {
    localEnabled,
    uploadEnabled,
    anyDeliveryEnabled,
    uploadOnly,
    perRowComplete,
    localConfigured,
    uploadConfigured,
    uploadReadiness,
    patternValidation,
    processReady:
      anyDeliveryEnabled
      && localConfigured
      && uploadConfigured
      && !patternValidation.blocking,
    outputDirRequired: needsSlideDestination && !perRowComplete,
  };
}

/**
 * @deprecated Use getSaveLocallyPanelCopy
 */
export function getDeliveryLocalColumnCopy(destSummary, outputDir, { localEnabled = false } = {}) {
  const panel = getSaveLocallyPanelCopy(destSummary, outputDir, { localEnabled });
  return {
    helperText: panel.hint,
    path: outputDir || null,
    folderButtonLabel: outputDir ? 'Change folder' : SAVE_LOCALLY_CHOOSE_LABEL,
    showProgress: false,
    offText: panel.offText,
  };
}

/** @deprecated Use getDeliveryLocalColumnCopy */
export function getDeliveryPanelCopy(destSummary, outputDir, options = {}) {
  return getDeliveryLocalColumnCopy(destSummary, outputDir, {
    localEnabled: options.localEnabled ?? (!options.uploadOnly && (options.keepLocalCopy || !options.autoUpload)),
  });
}

export function getDeliveryUploadStatusCopy(uploadReadiness) {
  if (!uploadReadiness) return null;
  if (uploadReadiness.ready) return 'Upload connection ready';
  const blocker = uploadReadiness.blockers?.[0];
  if (blocker) return `Upload connection: ${blocker}`;
  return 'Upload connection not ready';
}

/** Modal for destination setup CTAs. DSA/Globus use inline Delivery controls + Config. */
export function getDeliverySetupModalType(_destination) {
  return null;
}

export function getDeliverySetupButtonLabel(destination, ready = false) {
  const name = destination === 'globus' ? 'Globus' : 'DSA';
  return ready ? `Manage ${name}…` : `Set up ${name}…`;
}
