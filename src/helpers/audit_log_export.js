// helpers/audit_log_export.js — export audit entries to CSV-shaped data.

export const DEFAULT_AUDIT_EXPORT_COLUMNS = [
  { key: 'timestamp', header: 'timestamp' },
  { key: 'batchId', header: 'batch_id' },
  { key: 'type', header: 'type' },
  { key: 'status', header: 'status' },
  { key: 'sourcePath', header: 'path' },
  { key: 'outputPath', header: 'output_path' },
  { key: 'outputName', header: 'output_name' },
  { key: 'destination', header: 'destination' },
  { key: 'uuid', header: 'uuid' },
  { key: 'labelText', header: 'labelText' },
  { key: 'qrPayload', header: 'qrPayload' },
  { key: 'dsaAlias', header: 'dsaAlias' },
  { key: 'errorMessage', header: 'errorMessage' },
  { key: 'errorDetails', header: 'errorDetails' },
  { key: 'runId', header: 'runId' },
];

export const BATCH_EXPORT_COLUMNS = [
  { key: 'batchId', header: 'batch_id' },
  { key: 'runId', header: 'runId' },
  { key: 'status', header: 'status' },
  { key: 'totalCount', header: 'total' },
  { key: 'successCount', header: 'succeeded' },
  { key: 'errorCount', header: 'failed' },
  { key: 'startedAt', header: 'started' },
  { key: 'completedAt', header: 'completed' },
];

export const SLIDE_EXPORT_COLUMNS = DEFAULT_AUDIT_EXPORT_COLUMNS;

export const UPLOAD_EXPORT_COLUMNS = [
  { key: 'timestamp', header: 'timestamp' },
  { key: 'batchId', header: 'batch_id' },
  { key: 'type', header: 'type' },
  { key: 'status', header: 'status' },
  { key: 'sourcePath', header: 'path' },
  { key: 'outputName', header: 'output_name' },
  { key: 'destination', header: 'destination' },
  { key: 'errorMessage', header: 'errorMessage' },
  { key: 'runId', header: 'runId' },
];

function cellValue(entry, key) {
  if (key === 'upload') {
    const u = entry.upload;
    return u ? JSON.stringify(u) : '';
  }
  if (key === 'summary') {
    return entry.summary ? JSON.stringify(entry.summary) : '';
  }
  const val = entry[key];
  if (val == null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export function entriesToCsvData(entries, { columns = DEFAULT_AUDIT_EXPORT_COLUMNS } = {}) {
  const cols = columns?.length ? columns : DEFAULT_AUDIT_EXPORT_COLUMNS;
  const header = cols.map((c) => c.header);
  const rows = (entries ?? []).map((entry) => {
    const row = {};
    for (const col of cols) {
      row[col.header] = cellValue(entry, col.key);
    }
    return row;
  });
  return { header, rows };
}
