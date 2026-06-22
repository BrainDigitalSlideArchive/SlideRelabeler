// helpers/audit_log_views.js — tab filtering and consolidated batch rows for audit log UI.

import { AUDIT_STATUS } from './audit_log.js';

export const AUDIT_VIEW_SLIDE_TYPES = ['slide_processed', 'slide_error'];
export const AUDIT_VIEW_UPLOAD_TYPES = ['upload_complete', 'upload_failed'];
export const AUDIT_VIEW_BATCH_TYPES = ['batch_start', 'batch_complete'];

export function formatBatchId(runId) {
  if (!runId) return '';
  const id = String(runId).replace(/-/g, '');
  return id.slice(0, 8).toUpperCase();
}

export function deriveBatchStatusFromCounts({ successCount = 0, errorCount = 0 } = {}) {
  if (errorCount === 0) return AUDIT_STATUS.SUCCESS;
  if (successCount === 0) return AUDIT_STATUS.ERROR;
  return AUDIT_STATUS.SUCCESS;
}

export function filterEntriesByTypes(entries, types) {
  const allowed = new Set(types ?? []);
  if (allowed.size === 0) return [];
  return (entries ?? []).filter((entry) => allowed.has(entry.type));
}

function sortTimestampDesc(a, b) {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
  if (Number.isNaN(ta)) return 1;
  if (Number.isNaN(tb)) return -1;
  return tb - ta;
}

export function collectSlideStatsByRunId(entries) {
  const byRunId = new Map();
  for (const entry of entries ?? []) {
    if (entry.type !== 'slide_processed' && entry.type !== 'slide_error') continue;
    if (!entry.runId) continue;

    const stats = byRunId.get(entry.runId) ?? {
      successCount: 0,
      errorCount: 0,
      latestTimestamp: null,
    };

    if (entry.type === 'slide_processed') {
      stats.successCount += 1;
    } else {
      stats.errorCount += 1;
    }

    if (entry.timestamp) {
      if (!stats.latestTimestamp || sortTimestampDesc(entry.timestamp, stats.latestTimestamp) < 0) {
        stats.latestTimestamp = entry.timestamp;
      }
    }

    byRunId.set(entry.runId, stats);
  }
  return byRunId;
}

export function deriveBatchRows(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const slideStatsByRunId = collectSlideStatsByRunId(list);
  const byRunId = new Map();

  for (const entry of list) {
    if (entry.type !== 'batch_start' && entry.type !== 'batch_complete') continue;
    const runId = entry.runId;
    if (!runId) continue;

    const existing = byRunId.get(runId) ?? {
      runId,
      batchId: formatBatchId(runId),
      startEntry: null,
      completeEntry: null,
    };

    if (entry.type === 'batch_start') {
      existing.startEntry = entry;
    } else {
      existing.completeEntry = entry;
    }
    byRunId.set(runId, existing);
  }

  const rows = [];
  for (const group of byRunId.values()) {
    const { startEntry, completeEntry, runId, batchId } = group;
    const slideStats = slideStatsByRunId.get(runId);
    const startedAt = startEntry?.timestamp ?? null;
    let completedAt = completeEntry?.timestamp ?? null;
    const summary = completeEntry?.summary ?? {};
    const fileCount = startEntry?.summary?.fileCount ?? summary.totalCount ?? null;
    let successCount = summary.successCount ?? null;
    let errorCount = summary.errorCount ?? null;
    let totalCount = summary.totalCount ?? fileCount ?? null;
    let inferredComplete = false;

    let status = AUDIT_STATUS.PENDING;
    if (completeEntry) {
      status = deriveBatchStatusFromCounts({
        successCount: successCount ?? 0,
        errorCount: errorCount ?? 0,
      });
    } else if (slideStats && (slideStats.successCount + slideStats.errorCount) > 0) {
      const slideTotal = slideStats.successCount + slideStats.errorCount;
      const canInferComplete = fileCount == null || slideTotal >= fileCount;
      if (canInferComplete) {
        successCount = slideStats.successCount;
        errorCount = slideStats.errorCount;
        totalCount = fileCount ?? slideTotal;
        completedAt = slideStats.latestTimestamp;
        status = deriveBatchStatusFromCounts({ successCount, errorCount });
        inferredComplete = true;
      }
    }

    const sortTime = completedAt || startedAt || '';
    rows.push({
      id: runId,
      runId,
      batchId,
      startedAt,
      completedAt,
      displayTime: completedAt || startedAt,
      status,
      fileCount,
      totalCount,
      successCount,
      errorCount,
      inferredComplete,
      sequence: completeEntry?.sequence ?? startEntry?.sequence ?? 0,
      _sortTime: sortTime,
    });
  }

  rows.sort((a, b) => {
    const timeCmp = sortTimestampDesc(a._sortTime, b._sortTime);
    if (timeCmp !== 0) return timeCmp;
    return (b.sequence ?? 0) - (a.sequence ?? 0);
  });

  return rows.map(({ _sortTime, ...row }) => row);
}

export function resolveAuditEntryIdsToDelete({ activeTab, selectedRows, allEntries }) {
  const selected = Array.isArray(selectedRows) ? selectedRows : [];
  if (selected.length === 0) return [];

  if (activeTab === 'batches') {
    const runIds = new Set(selected.map((row) => row.runId).filter(Boolean));
    if (runIds.size === 0) return [];
    return (allEntries ?? [])
      .filter((entry) => runIds.has(entry.runId))
      .map((entry) => entry.id)
      .filter(Boolean);
  }

  return selected.map((row) => row.id).filter(Boolean);
}
