// helpers/csv_import_config.js — CSV import column mapping and template headers.

export const CSV_TEMPLATE_DEFAULT_HEADERS = {
  filePath: 'path',
  outputFolder: 'output_folder',
  outputName: 'output_name',
  label: 'label',
  qr: 'qr',
};

function trimOrDefault(value, fallback) {
  const trimmed = value != null ? String(value).trim() : '';
  return trimmed || fallback;
}

/**
 * Resolved CSV template column headers in display order.
 * Uses configured import mapping names when set; otherwise sensible defaults.
 */
export function getCsvTemplateHeaders(csvConfig = {}) {
  return {
    filePath: trimOrDefault(csvConfig.file_path_column, CSV_TEMPLATE_DEFAULT_HEADERS.filePath),
    outputFolder: trimOrDefault(
      csvConfig.file_destination_directory_column,
      CSV_TEMPLATE_DEFAULT_HEADERS.outputFolder,
    ),
    outputName: trimOrDefault(csvConfig.file_rename_column, CSV_TEMPLATE_DEFAULT_HEADERS.outputName),
    label: CSV_TEMPLATE_DEFAULT_HEADERS.label,
    qr: CSV_TEMPLATE_DEFAULT_HEADERS.qr,
  };
}

/** Ordered header list for CSV template export (unique, preserves order). */
export function getCsvTemplateHeaderList(csvConfig = {}) {
  const headers = getCsvTemplateHeaders(csvConfig);
  const ordered = [
    headers.filePath,
    headers.outputFolder,
    headers.outputName,
    headers.label,
    headers.qr,
  ];
  return [...new Set(ordered)];
}

/**
 * Build one template row from a file table row, or empty strings when no row.
 */
export function buildCsvTemplateRow(fileRow, csvConfig, { resolveOutputBasename, config } = {}) {
  const headers = getCsvTemplateHeaders(csvConfig);
  const row = {
    [headers.filePath]: '',
    [headers.outputFolder]: '',
    [headers.outputName]: '',
    [headers.label]: '',
    [headers.qr]: '',
  };

  if (!fileRow) return row;

  if (fileRow.__reserved?.source?.path) {
    row[headers.filePath] = fileRow.__reserved.source.path;
  }
  if (fileRow.__reserved?.destinationDirectory) {
    row[headers.outputFolder] = fileRow.__reserved.destinationDirectory;
  }
  if (fileRow.__reserved?.rename != null && String(fileRow.__reserved.rename).trim()) {
    row[headers.outputName] = String(fileRow.__reserved.rename);
  } else if (typeof resolveOutputBasename === 'function' && config) {
    row[headers.outputName] = resolveOutputBasename(fileRow, config) ?? '';
  }
  if (fileRow.__reserved?.labelText != null && String(fileRow.__reserved.labelText).trim()) {
    row[headers.label] = String(fileRow.__reserved.labelText);
  }
  if (fileRow.__reserved?.qrPayload != null && String(fileRow.__reserved.qrPayload).trim()) {
    row[headers.qr] = String(fileRow.__reserved.qrPayload);
  }

  return row;
}
