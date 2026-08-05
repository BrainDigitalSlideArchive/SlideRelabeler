/**
 * Prefer the Process response path over the pre-process prediction.
 * Process is authoritative when it reports where the file was written.
 */
export function pickProcessedOutputPath(predictedPath, processedJson) {
  const actual = processedJson?.output_path;
  if (actual != null && String(actual).trim()) {
    return String(actual);
  }
  return predictedPath;
}
