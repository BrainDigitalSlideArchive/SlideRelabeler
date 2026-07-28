/** Routing: DSA is the active auto-upload destination. */
export function isDsaUploadRoutingActive(uploadRouting) {
  return !!(uploadRouting?.auto_upload && uploadRouting?.destination === 'dsa');
}

/** Routing: Globus is the active auto-upload destination. */
export function isGlobusUploadRoutingActive(uploadRouting) {
  return !!(uploadRouting?.auto_upload && uploadRouting?.destination === 'globus');
}

/**
 * Single source of truth for files.uploading / upload session wall clock.
 * DSA keeps the current item in the queue until complete, so queue length covers in-flight DSA.
 * Globus dequeues before transfer finishes, so upload_in_flight is required.
 */
export function computeWantUploading({ dsaQueueLen = 0, globusQueueLen = 0, globusInFlight = 0 } = {}) {
  return (
    (Number(dsaQueueLen) || 0) > 0
    || (Number(globusQueueLen) || 0) > 0
    || (Number(globusInFlight) || 0) > 0
  );
}
