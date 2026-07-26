/**
 * Helpers for metadata preview modal: resolve ifds entry and pick UI branch.
 */

export const PREVIEW_ERROR_KEY = '__previewError';

export const METADATA_UNAVAILABLE_MESSAGE = 'Metadata preview is not available for this file.';

function pathsMatch(storedPath, filePath) {
  if (!storedPath || !filePath) return false;
  if (storedPath === filePath) return true;
  try {
    return decodeURIComponent(storedPath) === decodeURIComponent(filePath);
  } catch {
    return false;
  }
}

/**
 * @param {object} ifds
 * @param {string|null|undefined} file
 * @param {object|null|undefined} fileRow
 * @returns {{ table: unknown, pathKey: string|null|undefined, matchedBy: string|null, pathInIfds: boolean }}
 */
export function resolveMetadataTable(ifds, file, fileRow) {
  const store = ifds && typeof ifds === 'object' ? ifds : {};
  const pathKey = fileRow?.__reserved?.source?.path;

  const tryKey = (key, matchedBy) => {
    if (key != null && Object.prototype.hasOwnProperty.call(store, key)) {
      return { table: store[key], pathKey: key, matchedBy, pathInIfds: true };
    }
    return null;
  };

  const fromSource = tryKey(pathKey, 'source.path');
  if (fromSource) return fromSource;

  const fromFile = tryKey(file, 'file-query');
  if (fromFile) return fromFile;

  if (pathKey || file) {
    try {
      const decoded = decodeURIComponent(file || '');
      const fromDecoded = tryKey(decoded, 'decoded-file-query');
      if (fromDecoded) return fromDecoded;
    } catch {
      /* ignore */
    }
  }

  return {
    table: null,
    pathKey: pathKey ?? file,
    matchedBy: null,
    pathInIfds: false,
  };
}

/**
 * @param {unknown} table
 * @returns {boolean}
 */
export function hasUsableMetadataTable(table) {
  if (Array.isArray(table)) {
    return table.length > 0;
  }
  if (!table || typeof table !== 'object') {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(table, PREVIEW_ERROR_KEY)) {
    return false;
  }
  return Object.keys(table).length > 0;
}

/**
 * @param {unknown} table
 * @param {object|null|undefined} fileRow
 * @param {boolean} pathInIfds
 * @returns {{ branch: 'loading'|'processed'|'error'|'grid'|'unavailable', message?: string }}
 */
export function getMetadataModalBranch(table, fileRow, pathInIfds) {
  if (!fileRow?.__reserved) {
    return { branch: 'loading' };
  }
  if (fileRow.__reserved.processed === 1) {
    return { branch: 'processed', message: 'Metadata not available for processed files.' };
  }

  if (table && typeof table === 'object' && !Array.isArray(table) && table[PREVIEW_ERROR_KEY]) {
    return {
      branch: 'error',
      message: String(table[PREVIEW_ERROR_KEY]),
    };
  }

  if (hasUsableMetadataTable(table)) {
    return { branch: 'grid' };
  }

  if (pathInIfds) {
    return { branch: 'unavailable', message: METADATA_UNAVAILABLE_MESSAGE };
  }

  return { branch: 'loading' };
}

export function makePreviewErrorTable(summary) {
  return {
    [PREVIEW_ERROR_KEY]: summary
      || 'Metadata could not be read for this file. The file may be unreadable or in an unsupported format.',
  };
}

export { pathsMatch };
