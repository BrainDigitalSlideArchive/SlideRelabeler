// helpers/csv_import_config.js — CSV import column mapping and template headers.

import { CSV_TEMPLATE_DEFAULT_HEADERS } from './csv_column_config.js';

export { CSV_TEMPLATE_DEFAULT_HEADERS };

/**
 * CSV template column headers in display order.
 * Always uses default header names shown in the config UI.
 */
export function getCsvTemplateHeaders(_csvConfig = {}) {
  return {
    filePath: CSV_TEMPLATE_DEFAULT_HEADERS.filePath,
    outputName: CSV_TEMPLATE_DEFAULT_HEADERS.outputName,
    label: CSV_TEMPLATE_DEFAULT_HEADERS.label,
    qr: CSV_TEMPLATE_DEFAULT_HEADERS.qr,
  };
}

/** Ordered header list for CSV template export (unique, preserves order). */
export function getCsvTemplateHeaderList(csvConfig = {}) {
  const headers = getCsvTemplateHeaders(csvConfig);
  const ordered = [
    headers.filePath,
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
    [headers.outputName]: '',
    [headers.label]: '',
    [headers.qr]: '',
  };

  if (!fileRow) return row;

  if (fileRow.__reserved?.source?.path) {
    row[headers.filePath] = fileRow.__reserved.source.path;
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
