const PROTO_VALUE_KEYS = [
  "nullValue",
  "numberValue",
  "stringValue",
  "boolValue",
  "structValue",
  "listValue",
];

function getWrappedKind(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  // protobufjs/proto-loader sometimes keeps oneof marker in "kind"
  if (
    typeof value.kind === "string" &&
    PROTO_VALUE_KEYS.includes(value.kind) &&
    Object.prototype.hasOwnProperty.call(value, value.kind)
  ) {
    return value.kind;
  }

  const present = PROTO_VALUE_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(value, key),
  );
  if (present.length === 1) return present[0];

  return null;
}

export function protoValueToJs(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => protoValueToJs(item));
  if (typeof value !== "object") return value;

  const kind = getWrappedKind(value);
  if (kind) {
    switch (kind) {
      case "nullValue":
        return null;
      case "numberValue":
      case "stringValue":
      case "boolValue":
        return value[kind];
      case "structValue":
        return protoStructToJs(value.structValue);
      case "listValue": {
        const raw = value.listValue;
        const values = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.values)
            ? raw.values
            : [];
        return values.map((item) => protoValueToJs(item));
      }
      default:
        return null;
    }
  }

  // Support receiving a bare Struct shape directly.
  if (Object.prototype.hasOwnProperty.call(value, "fields")) {
    return protoStructToJs(value);
  }

  // Plain object fallback.
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = protoValueToJs(val);
  }
  return out;
}

export function protoStructToJs(struct) {
  if (!struct || typeof struct !== "object") return {};
  const fields = struct.fields && typeof struct.fields === "object" ? struct.fields : struct;
  const out = {};
  for (const [key, val] of Object.entries(fields)) {
    out[key] = protoValueToJs(val);
  }
  return out;
}

export const structToObject = protoStructToJs;

/**
 * Extract the underlying Python/backend cause from a gRPC or Electron IPC error.
 */
export function extractBackendErrorCause(err) {
  if (err == null) return null;
  if (typeof err === 'string') {
    return extractCauseFromString(err);
  }

  const details = typeof err.details === 'string' ? err.details : '';
  const message = typeof err.message === 'string' ? err.message : '';

  const fromDetails = extractCauseFromString(details);
  if (fromDetails && details !== 'internal_error') {
    return fromDetails;
  }

  const fromMessage = extractCauseFromString(message);
  if (fromMessage) {
    return fromMessage;
  }

  const ipcStripped = message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^Error:\s*\d+\s+[A-Z_]+:\s*/i, '')
    .trim();
  if (ipcStripped && ipcStripped !== message) {
    const fromStripped = extractCauseFromString(ipcStripped);
    if (fromStripped) {
      return fromStripped;
    }
    return ipcStripped;
  }

  return message || details || null;
}

function extractCauseFromString(text) {
  if (!text || typeof text !== 'string') return null;
  const internalMatch = text.match(/internal_error:(?:[^:]+): (.+)$/s);
  if (internalMatch) {
    return internalMatch[1].trim();
  }
  return text.trim() || null;
}

function looksTechnicalErrorText(text) {
  return /internal_error:|path_error:|Error invoking remote method|^\d+\s+INTERNAL:/i.test(text || '');
}

function summaryFromPathErrorCode(code) {
  switch (code) {
    case 'invalid_path':
      return 'Path is missing or invalid.';
    case 'not_found':
      return 'File could not be found at this path. It may be on another computer, a network share that is not mounted, or the path in the import may be incorrect.';
    case 'not_a_file':
      return 'Path points to a folder, not a slide file.';
    case 'permission_denied':
      return 'File exists but cannot be read. Check permissions or network access.';
    case 'inaccessible':
      return 'File could not be accessed from this computer.';
    default:
      return 'File could not be accessed from this computer.';
  }
}

function isPathAccessCause(cause, errCode = '') {
  const lower = (cause || '').toLowerCase();
  const code = String(errCode || '').toLowerCase();

  if (code === 'invalid_path') return true;
  if (code === 'not_found' || code === 'enoent') return true;
  if (code === 'not_a_file' || code === 'eisdir') return true;
  if (code === 'permission_denied' || code === 'eacces' || code === 'eperm') return true;
  if (code === 'inaccessible') return true;

  if (lower.startsWith('path_error:')) return true;
  if (lower.includes('file not found') || lower.includes('filenotfounderror')) return true;
  if (lower.includes('no such file') || lower.includes('enoent')) return true;
  if (lower.includes('slide path is empty')) return true;
  if (lower.includes('not a file') || lower.includes('isadirectoryerror')) return true;
  if (lower.includes('cannot read file') || lower.includes('permissionerror')) return true;
  if (lower.includes('permission denied') || lower.includes('eacces') || lower.includes('eperm')) {
    return true;
  }
  return false;
}

function pathSummaryFromCause(cause, errCode = '') {
  const pathErrorMatch = (cause || '').match(/^path_error:([^:]+):/i);
  if (pathErrorMatch) {
    return summaryFromPathErrorCode(pathErrorMatch[1]);
  }

  const lower = (cause || '').toLowerCase();
  const code = String(errCode || '').toLowerCase();

  if (code === 'not_a_file' || lower.includes('isadirectoryerror') || lower.includes('not a file')) {
    return summaryFromPathErrorCode('not_a_file');
  }
  if (
    code === 'permission_denied'
    || code === 'eacces'
    || code === 'eperm'
    || lower.includes('permissionerror')
    || lower.includes('cannot read file')
    || lower.includes('permission denied')
  ) {
    return summaryFromPathErrorCode('permission_denied');
  }
  if (code === 'invalid_path' || lower.includes('slide path is empty')) {
    return summaryFromPathErrorCode('invalid_path');
  }
  if (
    code === 'not_found'
    || code === 'enoent'
    || lower.includes('filenotfounderror')
    || lower.includes('file not found')
    || lower.includes('no such file')
  ) {
    return summaryFromPathErrorCode('not_found');
  }
  return summaryFromPathErrorCode('inaccessible');
}

/**
 * Slide opens fine but carries no vendor metadata to de-identify (e.g. a slide
 * converted to plain pyramidal TIFF). Re-downloading it will not help.
 */
export const UNSUPPORTED_FORMAT_SUMMARY =
  'This slide has no vendor metadata to de-identify, so it is not supported for de-identification or metadata preview. It can still be delivered with "Copy files without changing them".';

export function isUnsupportedFormatSummary(summary) {
  return String(summary || '').trim() === UNSUPPORTED_FORMAT_SUMMARY;
}

export function buildUserFacingErrorSummary(cause, context = '', errCode = '') {
  if (isPathAccessCause(cause, errCode)) {
    return pathSummaryFromCause(cause, errCode);
  }

  const lower = (cause || '').toLowerCase();
  if (
    lower.includes('tilesourceerror')
    || lower.includes('could not open tile source')
    || lower.includes('no available tilesource')
  ) {
    return 'There was an error opening this file. It may be corrupt, incomplete, or not a supported whole-slide image format.';
  }
  if (lower.includes('no ifds')) {
    return 'This file does not appear to be a valid whole-slide image (missing image data).';
  }
  if (lower.includes('unsupported_format:') || lower.includes('format not available for deid')) {
    return UNSUPPORTED_FORMAT_SUMMARY;
  }
  if (context.toLowerCase().includes('metadata')) {
    return 'Metadata could not be read for this file. The file may be unreadable or in an unsupported format.';
  }
  return 'This file could not be processed. Try re-downloading it or opening it in another viewer to verify it is valid.';
}

/**
 * Build user summary + full technical text for file-row error storage/display.
 */
export function buildFileRowErrorFromBackend(err, context = '') {
  const message = typeof err?.message === 'string' ? err.message : '';
  const details = typeof err?.details === 'string' ? err.details : '';
  const errCode = typeof err?.code === 'string' ? err.code : '';
  const technical = [message, details].filter((part) => part && part.trim()).join(' | ')
    || (typeof err === 'string' ? err : String(err ?? 'Unknown error'));

  if (details.match(/^path_error:/i)) {
    const pathCause = extractCauseFromString(details) || details;
    return {
      summary: buildUserFacingErrorSummary(pathCause, context, errCode),
      details: technical,
    };
  }

  const cause = extractBackendErrorCause(err) || technical;
  const summary = buildUserFacingErrorSummary(cause, context, errCode);
  return { summary, details: technical };
}

/**
 * Parse stored row error fields for display (supports legacy single-string errors).
 */
export function parseStoredRowError(error, errorDetails) {
  const storedSummary = error != null ? String(error).trim() : '';
  if (!storedSummary) {
    return null;
  }

  const storedDetails = errorDetails != null ? String(errorDetails).trim() : '';
  if (storedDetails && storedDetails !== storedSummary) {
    return { summary: storedSummary, details: storedDetails };
  }

  if (looksTechnicalErrorText(storedSummary)) {
    const cause = extractBackendErrorCause(storedSummary) || storedSummary;
    return {
      summary: buildUserFacingErrorSummary(cause, 'Error getting metadata'),
      details: storedSummary,
    };
  }

  return { summary: storedSummary, details: null };
}

/**
 * Turn a gRPC / backend error into a short user-facing message.
 * Engine errors use details like: internal_error:GetMetadata: <last traceback line>
 */
export function formatBackendError(err, context = "") {
  return buildFileRowErrorFromBackend(err, context).summary;
}
