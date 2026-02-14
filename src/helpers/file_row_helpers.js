/**
 * Get a stable identifier for a file row (UUID or file path)
 * @param {object} file_row - The file row object
 * @returns {string|undefined} - UUID if available, otherwise file path, or undefined if neither exists
 */
export function getFileRowIdentifier(file_row) {
  return file_row.__reserved?.uuid || file_row.__reserved?.source?.path;
}
