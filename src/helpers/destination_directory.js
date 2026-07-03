export const DESTINATION_SOURCE = {
  DEFAULT: 'default',
  CSV: 'csv',
  USER: 'user',
};

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

function isDefaultDestinationSource(source) {
  return source === DESTINATION_SOURCE.DEFAULT || source === undefined || source === null || source === '';
}

export function markDestinationSource(reserved, source) {
  return { ...reserved, destinationDirectorySource: source };
}

export function initDestinationSource(reserved) {
  return markDestinationSource(reserved, DESTINATION_SOURCE.DEFAULT);
}

export function summarizeDestinationBySource(file_rows) {
  const dest = summarizeDestinationDirectories(file_rows);
  let defaultSourced = 0;
  let csvSourced = 0;
  let userSourced = 0;

  for (const row of file_rows ?? []) {
    if (!rowHasDestinationDirectory(row)) continue;
    const source = row?.__reserved?.destinationDirectorySource;
    if (source === DESTINATION_SOURCE.CSV) csvSourced += 1;
    else if (source === DESTINATION_SOURCE.USER) userSourced += 1;
    else defaultSourced += 1;
  }

  return {
    ...dest,
    defaultSourced,
    csvSourced,
    userSourced,
  };
}

export function resolveRowsAfterSetOutputDir(file_rows, folder, mode) {
  if (mode === 'default_only') {
    return file_rows ?? [];
  }

  return (file_rows ?? []).map((row) => {
    const reserved = row.__reserved ?? {};
    const hasDest = rowHasDestinationDirectory(row);
    const source = reserved.destinationDirectorySource;

    if (mode === 'fill_empty') {
      if (hasDest) return row;
      return {
        ...row,
        __reserved: markDestinationSource(
          { ...reserved, destinationDirectory: folder },
          DESTINATION_SOURCE.DEFAULT,
        ),
      };
    }

    if (mode === 'update_default_sourced') {
      if (hasDest && !isDefaultDestinationSource(source)) return row;
      return {
        ...row,
        __reserved: markDestinationSource(
          { ...reserved, destinationDirectory: folder },
          DESTINATION_SOURCE.DEFAULT,
        ),
      };
    }

    // Legacy aliases
    if (mode === 'empty_only') {
      if (hasDest) return row;
      return {
        ...row,
        __reserved: markDestinationSource(
          { ...reserved, destinationDirectory: folder },
          DESTINATION_SOURCE.DEFAULT,
        ),
      };
    }

    if (mode === 'all') {
      if (hasDest && !isDefaultDestinationSource(source)) return row;
      return {
        ...row,
        __reserved: markDestinationSource(
          { ...reserved, destinationDirectory: folder },
          DESTINATION_SOURCE.DEFAULT,
        ),
      };
    }

    return row;
  });
}
