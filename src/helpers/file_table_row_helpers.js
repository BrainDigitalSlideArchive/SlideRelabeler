import { parseStoredRowError } from './grpc_helpers.js';

export function rowHasError(data) {
  const raw = data?.__reserved?.error;
  return raw != null && String(raw).trim().length > 0;
}

export function getRowErrorDisplay(data) {
  if (!rowHasError(data)) {
    return null;
  }
  const parsed = parseStoredRowError(
    data.__reserved.error,
    data.__reserved.errorDetails,
  );
  if (parsed?.summary) {
    return parsed;
  }
  return {
    summary: String(data.__reserved.error).trim(),
    details: data.__reserved.errorDetails ?? null,
  };
}

export function getRowErrorMessage(data) {
  const display = getRowErrorDisplay(data);
  return display?.summary ?? null;
}

export function canOpenViewerForRow(data) {
  return !rowHasError(data);
}
