// helpers/audit_log.js — internal audit log entry builders and trimming.

import { resolveOutputFilenameStem } from './output_filename.js';

export const AUDIT_ENTRY_TYPES = [
  'batch_start',
  'slide_processed',
  'slide_error',
  'upload_complete',
  'upload_failed',
  'batch_complete',
];

export const AUDIT_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
};

export function createAuditId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createRunId() {
  return createAuditId();
}

export function extractRowMetadata(fileRow) {
  if (!fileRow || typeof fileRow !== 'object') return {};
  const metadata = {};
  for (const key of Object.keys(fileRow)) {
    if (key !== '__reserved' && !key.startsWith('__')) {
      metadata[key] = fileRow[key];
    }
  }
  return metadata;
}

export function trimAuditEntries(entries, maxEntries) {
  const limit = Number(maxEntries);
  if (!Number.isFinite(limit) || limit < 1 || entries.length <= limit) {
    return entries;
  }
  return entries.slice(entries.length - limit);
}

export const AUDIT_DEFAULT_FINITE_LIMIT = 5000;
export const AUDIT_MIN_MAX_ENTRIES = 100;
export const AUDIT_MAX_MAX_ENTRIES = 100000;

export function resolveAuditMaxEntries(settings, defaultMaxEntries = null) {
  const raw = settings?.maxEntries;
  if (raw === undefined) return defaultMaxEntries;
  return raw;
}

export function clampAuditMaxEntries(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return AUDIT_DEFAULT_FINITE_LIMIT;
  return Math.min(AUDIT_MAX_MAX_ENTRIES, Math.max(AUDIT_MIN_MAX_ENTRIES, n));
}

export function countEntriesToTrim(entryCount, maxEntries) {
  if (maxEntries == null) return 0;
  const limit = Number(maxEntries);
  if (!Number.isFinite(limit) || limit < 1) return 0;
  const count = Number(entryCount) || 0;
  if (count <= limit) return 0;
  return count - limit;
}

export function hasSlideAuditForSource(entries, runId, sourcePath) {
  if (!runId || !sourcePath) return false;
  const types = new Set(['slide_error', 'slide_processed']);
  return (entries ?? []).some(
    (entry) => entry.runId === runId
      && entry.sourcePath === sourcePath
      && types.has(entry.type),
  );
}

export function hasSlideErrorAuditForSource(entries, runId, sourcePath) {
  if (!runId || !sourcePath) return false;
  return (entries ?? []).some(
    (entry) => entry.runId === runId
      && entry.sourcePath === sourcePath
      && entry.type === 'slide_error',
  );
}

export function buildSlideAuditEntry({
  type,
  runId,
  fileRow,
  config,
  fileCols = [],
  outputPath = '',
  errorMessage = '',
  errorDetails = '',
  status = AUDIT_STATUS.SUCCESS,
  upload = null,
  summary = null,
}) {
  const reserved = fileRow?.__reserved ?? {};
  const enrichedConfig = config ? { ...config, fileCols } : null;
  const outputName = fileRow && enrichedConfig
    ? resolveOutputFilenameStem(fileRow, enrichedConfig)
    : (reserved.rename != null ? String(reserved.rename) : '');

  const resolvedErrorMessage = errorMessage || reserved.error || '';
  const resolvedErrorDetails = errorDetails || reserved.errorDetails || '';

  const entry = {
    id: createAuditId(),
    timestamp: new Date().toISOString(),
    runId: runId ?? null,
    type,
    sourcePath: reserved.source?.path ?? '',
    outputPath: outputPath || reserved.output_path || '',
    outputName,
    destination: reserved.destinationDirectory ?? '',
    uuid: reserved.uuid ?? '',
    labelText: reserved.labelText ?? '',
    qrPayload: reserved.qrPayload ?? '',
    dsaAlias: reserved.dsaAlias ?? '',
    status,
    errorMessage: resolvedErrorMessage,
    metadata: extractRowMetadata(fileRow),
  };

  if (resolvedErrorDetails) {
    entry.errorDetails = resolvedErrorDetails;
  }

  if (upload) {
    entry.upload = upload;
  }
  if (summary) {
    entry.summary = summary;
  }

  return entry;
}

export function buildSlideErrorAuditEntry({ runId, fileRow, config, fileCols = [] }) {
  const reserved = fileRow?.__reserved ?? {};
  return buildSlideAuditEntry({
    type: 'slide_error',
    runId,
    fileRow,
    config,
    fileCols,
    errorMessage: reserved.error || '',
    errorDetails: reserved.errorDetails || '',
    status: AUDIT_STATUS.ERROR,
  });
}

export function buildBatchStartEntry(runId, fileCount) {
  return {
    id: createAuditId(),
    timestamp: new Date().toISOString(),
    runId,
    type: 'batch_start',
    sourcePath: '',
    outputPath: '',
    outputName: '',
    destination: '',
    uuid: '',
    labelText: '',
    qrPayload: '',
    dsaAlias: '',
    status: AUDIT_STATUS.PENDING,
    errorMessage: '',
    metadata: {},
    summary: { fileCount },
  };
}

export function deriveBatchCompleteStatus(summary) {
  const successCount = summary?.successCount ?? 0;
  const errorCount = summary?.errorCount ?? 0;
  if (errorCount === 0) return AUDIT_STATUS.SUCCESS;
  if (successCount === 0) return AUDIT_STATUS.ERROR;
  return AUDIT_STATUS.SUCCESS;
}

export function buildBatchCompleteEntry(runId, summary) {
  return {
    id: createAuditId(),
    timestamp: new Date().toISOString(),
    runId,
    type: 'batch_complete',
    sourcePath: '',
    outputPath: '',
    outputName: '',
    destination: '',
    uuid: '',
    labelText: '',
    qrPayload: '',
    dsaAlias: '',
    status: deriveBatchCompleteStatus(summary),
    errorMessage: '',
    metadata: {},
    summary,
  };
}

export function buildUploadAuditEntry({
  type,
  runId,
  fileRow,
  config,
  fileCols = [],
  upload,
  errorMessage = '',
}) {
  return buildSlideAuditEntry({
    type,
    runId,
    fileRow,
    config,
    fileCols,
    outputPath: fileRow?.__reserved?.output_path ?? '',
    errorMessage,
    status: type === 'upload_failed' ? AUDIT_STATUS.ERROR : AUDIT_STATUS.SUCCESS,
    upload,
  });
}
