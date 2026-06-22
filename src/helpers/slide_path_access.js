import { accessSync, constants, existsSync, statSync } from 'fs';

const PATH_ERROR_MESSAGES = {
  invalid_path: 'Path is missing or invalid.',
  not_found: 'File could not be found at this path. It may be on another computer, a network share that is not mounted, or the path in the import may be incorrect.',
  not_a_file: 'Path points to a folder, not a slide file.',
  permission_denied: 'File exists but cannot be read. Check permissions or network access.',
  inaccessible: 'File could not be accessed from this computer.',
};

function buildPathIssue(code, filePath, extra = '') {
  const message = PATH_ERROR_MESSAGES[code] || PATH_ERROR_MESSAGES.inaccessible;
  const technical = extra
    ? `path_error:${code}: ${extra} (${filePath})`
    : `path_error:${code}: ${message} (${filePath})`;
  return { code, message, technical };
}

/**
 * Fast local path check before calling Python metadata.
 * @returns {null | { code: string, message: string, technical: string }}
 */
export function checkSlidePathAccessible(filePath) {
  if (filePath == null || typeof filePath !== 'string' || !filePath.trim()) {
    return buildPathIssue('invalid_path', String(filePath ?? ''));
  }

  const normalized = filePath.trim();

  if (!existsSync(normalized)) {
    return buildPathIssue('not_found', normalized);
  }

  let stats;
  try {
    stats = statSync(normalized);
  } catch (err) {
    const code = err?.code === 'EACCES' || err?.code === 'EPERM'
      ? 'permission_denied'
      : 'inaccessible';
    return buildPathIssue(code, normalized, err?.message || String(err));
  }

  if (!stats.isFile()) {
    return buildPathIssue('not_a_file', normalized);
  }

  try {
    accessSync(normalized, constants.R_OK);
  } catch (err) {
    const code = err?.code === 'EACCES' || err?.code === 'EPERM'
      ? 'permission_denied'
      : 'inaccessible';
    return buildPathIssue(code, normalized, err?.message || String(err));
  }

  return null;
}

export function buildPathErrorForIpc(pathIssue) {
  if (!pathIssue) return null;
  const err = new Error(pathIssue.technical);
  err.code = pathIssue.code;
  err.details = `path_error:${pathIssue.code}: ${pathIssue.message}`;
  return err;
}
