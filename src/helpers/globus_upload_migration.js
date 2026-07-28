import { resolveMaxUploadBatchSize } from './globus_upload_batch.js';

/**
 * Migrate legacy state.globus preference fields into config.globus_upload.
 *
 * @param {object|null|undefined} globusUpload existing config.globus_upload
 * @param {object|null|undefined} globus state.globus
 * @returns {object} normalized config.globus_upload
 */
export function migrateGlobusUploadConfig(globusUpload, globus) {
  const base = {
    default_target_endpoint_id: '',
    default_target_endpoint_label: '',
    source_endpoint: '',
    disable_ssl_verification: false,
    max_upload_batch_size: 1,
    ...(globusUpload && typeof globusUpload === 'object' ? globusUpload : {}),
  };

  const hasDefaultEndpoint = String(base.default_target_endpoint_id || '').trim();
  if (!hasDefaultEndpoint && globus) {
    const remember = !!globus.remember_target_endpoint;
    const savedId = String(globus.saved_target_endpoint_id || '').trim();
    const savedLabel = String(globus.saved_target_endpoint_label || '').trim();
    const liveId = String(globus.target_endpoint_id || '').trim();
    const liveLabel = String(globus.target_endpoint_label || '').trim();
    if (remember && savedId) {
      base.default_target_endpoint_id = savedId;
      base.default_target_endpoint_label = savedLabel || savedId;
    } else if (liveId) {
      base.default_target_endpoint_id = liveId;
      base.default_target_endpoint_label = liveLabel || liveId;
    }
  }

  if (!String(base.source_endpoint || '').trim() && globus?.source_endpoint) {
    base.source_endpoint = String(globus.source_endpoint).trim();
  }

  if (
    (globusUpload == null || globusUpload.disable_ssl_verification === undefined)
    && globus
    && typeof globus.disable_ssl_verification === 'boolean'
  ) {
    base.disable_ssl_verification = globus.disable_ssl_verification;
  }

  let maxUploadBatchSize = 1;
  if (
    globusUpload
    && typeof globusUpload === 'object'
    && Object.prototype.hasOwnProperty.call(globusUpload, 'max_upload_batch_size')
  ) {
    if (globusUpload.max_upload_batch_size === null || globusUpload.max_upload_batch_size === '') {
      maxUploadBatchSize = null;
    } else {
      const resolved = resolveMaxUploadBatchSize(globusUpload.max_upload_batch_size);
      maxUploadBatchSize = resolved === null ? 1 : resolved;
    }
  }

  return {
    integrationEnabled: base.integrationEnabled === true,
    default_target_endpoint_id: String(base.default_target_endpoint_id || '').trim(),
    default_target_endpoint_label: String(base.default_target_endpoint_label || '').trim(),
    source_endpoint: String(base.source_endpoint || '').trim(),
    disable_ssl_verification: Boolean(base.disable_ssl_verification),
    max_upload_batch_size: maxUploadBatchSize,
  };
}
