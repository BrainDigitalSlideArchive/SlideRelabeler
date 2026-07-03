/** Staging directory mode for upload-only processing (before remote delivery). */

export const STAGING_DIR_MODE_SYSTEM = 'system';
export const STAGING_DIR_MODE_CUSTOM = 'custom';

export function normalizeStagingDirMode(mode) {
  return mode === STAGING_DIR_MODE_CUSTOM ? STAGING_DIR_MODE_CUSTOM : STAGING_DIR_MODE_SYSTEM;
}

export function resolveCustomStagingPath(customPath) {
  const trimmed = typeof customPath === 'string' ? customPath.trim() : '';
  return trimmed.length > 0 ? trimmed : null;
}

export function shouldUseStagingForRow(uploadRouting) {
  return !!(uploadRouting?.auto_upload && !uploadRouting?.local_output_enabled);
}

export function isCopyToColumnEnabled(uploadRouting) {
  return !!uploadRouting?.local_output_enabled;
}
