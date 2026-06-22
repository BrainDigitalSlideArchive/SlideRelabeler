import { selectPatternValidationFromState } from '../helpers/pattern_validation.js';

export function rowHasDestinationDirectory(row) {
  const dest = row?.__reserved?.destinationDirectory;
  return typeof dest === 'string' && dest.trim().length > 0;
}

export function summarizeDestinationDirectories(file_rows) {
  const rows = file_rows ?? [];
  const total = rows.length;
  const filled = rows.filter(rowHasDestinationDirectory).length;
  const empty = total - filled;
  return {
    total,
    filled,
    empty,
    perRowComplete: total > 0 && empty === 0,
  };
}

export function allRowsHaveDestinationDirectory(file_rows) {
  return summarizeDestinationDirectories(file_rows).perRowComplete;
}

export function normalizeSetOutputDirPayload(payload) {
  if (typeof payload === 'string') {
    return { folder: payload, mode: 'all' };
  }
  return {
    folder: payload.folder,
    mode: payload.mode ?? 'all',
  };
}

export function resolveRowsAfterSetOutputDir(file_rows, folder, mode) {
  return (file_rows ?? []).map((row) => {
    if (mode === 'empty_only' && rowHasDestinationDirectory(row)) {
      return row;
    }
    return {
      ...row,
      __reserved: {
        ...row.__reserved,
        destinationDirectory: folder,
      },
    };
  });
}

export function selectOutputReadiness(state) {
  const { output_dir, file_rows, csv, file_cols } = state.files ?? {};
  const config = state.config ?? {};
  const perRowComplete = allRowsHaveDestinationDirectory(file_rows);

  const slideOutputReady = Boolean(output_dir) || perRowComplete;

  const csvOutputReady = !csv.needs_csv_output_dir || Boolean(csv.output_dir);

  const patternValidation = selectPatternValidationFromState({
    config: state.config,
    file_rows,
    file_cols,
  });

  return {
    perRowComplete,
    slideOutputReady,
    csvOutputReady,
    patternValidation,
    processReady: slideOutputReady && csvOutputReady && !patternValidation.blocking,
    outputDirRequired: csv.needs_output_dir && !output_dir && !perRowComplete,
    csvOutputDirRequired: csv.needs_csv_output_dir && !csv.output_dir,
  };
}

/**
 * Copy strings and UI flags for OutputDirectoryPanel.
 * @returns {{ title: string, badge: string|null, body: string|null, path: string|null, buttonLabel: string, showProgress: boolean, optionalAction: boolean }}
 */
export function getOutputDirectoryPanelCopy(variant, destSummary, outputDir, required) {
  const summary = destSummary ?? { total: 0, filled: 0, empty: 0, perRowComplete: false };

  if (variant === 'csv') {
    if (outputDir) {
      return {
        title: 'Output CSV location',
        badge: 'Folder set',
        body: null,
        path: outputDir,
        buttonLabel: 'Change folder…',
        showProgress: false,
        optionalAction: false,
      };
    }
    return {
      title: 'Output CSV location',
      badge: required ? 'Required' : null,
      body: 'Select where to write the output CSV.',
      path: null,
      buttonLabel: 'Choose folder…',
      showProgress: false,
      optionalAction: false,
    };
  }

  if (outputDir) {
    return {
      title: 'Output Destination',
      badge: 'Folder set',
      body: null,
      path: outputDir,
      buttonLabel: 'Change folder…',
      showProgress: summary.total > 0,
      optionalAction: false,
    };
  }

  if (summary.perRowComplete) {
    return {
      title: 'Output Destination',
      badge: 'All ready',
      body: 'All files have an output path.',
      path: null,
      buttonLabel: 'Choose folder…',
      showProgress: true,
      optionalAction: true,
    };
  }

  if (summary.filled > 0) {
    return {
      title: 'Output Destination',
      badge: `${summary.filled} of ${summary.total} ready`,
      body: 'Set the rest individually in the Copy To column in the table below, or choose a destination folder for the remaining files.',
      path: null,
      buttonLabel: 'Choose folder…',
      showProgress: true,
      optionalAction: false,
    };
  }

  return {
    title: 'Output Destination',
    badge: required ? 'Required' : null,
    body: 'Set Copy To per file in the table below, or choose one folder for all.',
    path: null,
    buttonLabel: 'Choose folder…',
    showProgress: summary.total > 0,
    optionalAction: !required,
  };
}
