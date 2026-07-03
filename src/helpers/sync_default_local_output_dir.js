export function shouldSeedSessionOutputDir(outputDir, defaultLocalOutputDir) {
  const defaultPath = typeof defaultLocalOutputDir === 'string' ? defaultLocalOutputDir.trim() : '';
  if (!defaultPath) return false;
  const current = typeof outputDir === 'string' ? outputDir.trim() : '';
  return !current;
}

export function buildSeedOutputDirPayload(defaultLocalOutputDir) {
  return {
    folder: String(defaultLocalOutputDir).trim(),
    mode: 'default_only',
  };
}
