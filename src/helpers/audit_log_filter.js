// helpers/audit_log_filter.js — filter audit log entries for viewer and export.

export const DEFAULT_AUDIT_FILTER = {
  search: '',
  type: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

function parseFilterDate(value, endOfDay = false) {
  if (!value || !String(value).trim()) return null;
  const trimmed = String(value).trim();
  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    if (endOfDay) {
      return Date.UTC(year, month, day, 23, 59, 59, 999);
    }
    return Date.UTC(year, month, day, 0, 0, 0, 0);
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

export function filterAuditEntries(entries, filter = DEFAULT_AUDIT_FILTER) {
  const list = Array.isArray(entries) ? entries : [];
  const search = (filter.search ?? '').trim().toLowerCase();
  const type = filter.type ?? '';
  const status = filter.status ?? '';
  const fromMs = parseFilterDate(filter.dateFrom, false);
  const toMs = parseFilterDate(filter.dateTo, true);

  return list.filter((entry) => {
    if (type && entry.type !== type) return false;
    if (status && entry.status !== status) return false;

    if (fromMs != null || toMs != null) {
      const ts = new Date(entry.timestamp).getTime();
      if (Number.isNaN(ts)) return false;
      if (fromMs != null && ts < fromMs) return false;
      if (toMs != null && ts > toMs) return false;
    }

    if (search) {
      const haystack = [
        entry.sourcePath,
        entry.outputPath,
        entry.outputName,
        entry.errorMessage,
        entry.type,
        entry.uuid,
      ].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function sortAuditEntriesNewestFirst(entries) {
  return [...(entries ?? [])].sort((a, b) => {
    const sa = a.sequence ?? 0;
    const sb = b.sequence ?? 0;
    if (sb !== sa) return sb - sa;
    return String(b.id).localeCompare(String(a.id));
  });
}
