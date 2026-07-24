export const CONFIG_DEFAULT_LOCAL_OUTPUT_DESC =
  'Used when Save locally is on and a row does not already have a folder.';

export const CONFIG_DEFAULT_LOCAL_OUTPUT_EMPTY =
  'No default folder configured.';

export const CONFIG_DEFAULT_LOCAL_OUTPUT_HELP = (
  'When set, this folder seeds the Save locally default at startup and after clearing the file list. '
  + 'CSV-defined or manually set Copy To paths always take precedence. '
  + 'You can still pick a different folder on the main page for the current session.'
);

export function getSaveLocallyTooltipCopy() {
  return [
    'Pick a location where deidentified WSIs will be saved.',
    'Note: If the output location is defined manually or by CSV file, that takes precedence.',
  ].join(' ');
}

export const SAVE_LOCALLY_OFF_TEXT = 'Off — enable to configure';
export const SAVE_LOCALLY_CHOOSE_LABEL = 'Choose folder…';
export const SAVE_LOCALLY_CHANGE_TOOLTIP = 'Pick a different directory';
export const SAVE_LOCALLY_ALL_ROWS_OPTIONAL_HINT =
  'All rows have an output location defined in the table. Selecting a directory to be applied to newly loaded files is optional.';
export const SAVE_LOCALLY_NEW_FILES_EMPTY_TABLE_HINT =
  'This location will apply to new files. CSV-defined output locations take precedence.';
export const SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT =
  'This location applies to new files. CSV or manually set locations take precedence.';

export function getSaveLocallyNeedsLocationHint(empty) {
  const n = empty ?? 0;
  const noun = n === 1 ? 'file needs' : 'files need';
  return `${n} ${noun} an output location. Choose a folder here or set Copy To per row in the table.`;
}

/**
 * Hint/tip copy for every Save locally column state (C, A1–A3, B1–B3).
 * B2 (outputDir + empty rows) is defensive — likely unreachable via normal UI.
 */
export function getSaveLocallyPanelCopy(destSummary, outputDir, { localEnabled = false } = {}) {
  const summary = destSummary ?? { total: 0, filled: 0, empty: 0, perRowComplete: false };
  const { total, empty, perRowComplete } = summary;

  const result = {
    offText: SAVE_LOCALLY_OFF_TEXT,
    chooseLabel: SAVE_LOCALLY_CHOOSE_LABEL,
    changeTooltip: SAVE_LOCALLY_CHANGE_TOOLTIP,
    hint: null,
    hintTone: null,
    showChooseButton: false,
    showPathRow: false,
  };

  if (!localEnabled) {
    return result;
  }

  if (!outputDir) {
    result.showChooseButton = true;
    if (empty > 0) {
      result.hint = getSaveLocallyNeedsLocationHint(empty);
      result.hintTone = 'blocked';
    } else if (total === 0) {
      result.hint = getSaveLocallyTooltipCopy();
      result.hintTone = 'muted';
    } else if (perRowComplete) {
      result.hint = SAVE_LOCALLY_ALL_ROWS_OPTIONAL_HINT;
      result.hintTone = 'muted';
    }
    return result;
  }

  result.showPathRow = true;
  if (empty > 0) {
    result.hint = getSaveLocallyNeedsLocationHint(empty);
    result.hintTone = 'blocked';
  } else if (total === 0) {
    result.hint = SAVE_LOCALLY_NEW_FILES_EMPTY_TABLE_HINT;
    result.hintTone = 'muted';
  } else if (perRowComplete) {
    result.hint = SAVE_LOCALLY_NEW_FILES_COMPLETE_HINT;
    result.hintTone = 'muted';
  }
  return result;
}
