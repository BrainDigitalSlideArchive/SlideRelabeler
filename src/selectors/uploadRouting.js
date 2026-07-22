import { isGlobusEndpointUuid } from '../helpers/globus_helpers.js';

export const GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE =
  'Globus allows more simultaneous transfers than files allowed waiting to upload. '
  + 'Lower Max transfers at once or raise Max files waiting to upload.';

/**
 * @param {{ max_globus_parallel_uploads?: unknown, max_local_pending?: unknown }} [ur]
 * @returns {boolean}
 */
export function globusParallelExceedsUploadQueue(ur) {
  const parallel = parseInt(ur?.max_globus_parallel_uploads, 10);
  const pending = parseInt(ur?.max_local_pending, 10);
  if (!Number.isFinite(parallel) || !Number.isFinite(pending)) return false;
  return parallel > pending;
}

/**
 * Connection readiness for the active auto-upload destination.
 * @returns {{ ready: boolean, destination: string, blockers: string[], label: string }}
 */
export function selectUploadReadiness(state) {
  const ur = state.uploadRouting;
  const dsa = state.dsa;
  const globus = state.globus;

  if (!ur?.auto_upload) {
    return {
      ready: true,
      destination: ur?.destination || 'dsa',
      blockers: [],
      label: 'Auto-upload is off.',
    };
  }

  const dest = ur.destination === 'globus' ? 'globus' : 'dsa';

  if (dest === 'dsa') {
    const blockers = [];
    if (!String(dsa?.api_url || '').trim()) {
      blockers.push('Configure a DSA server.');
    } else if (!dsa?.api_auth?.authToken) {
      blockers.push('Sign in to DSA.');
    }
    if (!String(dsa?.folder_id || '').trim()) {
      blockers.push('Choose a DSA folder.');
    }
    if (dsa?.dsa_folder_exists === false) {
      blockers.push(dsa.dsa_folder_error_message || 'DSA folder was not found or is not accessible.');
    }
    const ready = blockers.length === 0;
    return {
      ready,
      destination: 'dsa',
      blockers,
      label: ready
        ? 'DSA is connected and ready for auto-upload.'
        : 'Auto-upload is on for DSA, but it will not run until the issues below are resolved.',
    };
  }

  const blockers = [];
  if (globus?.cli_available === false) {
    blockers.push('Globus CLI is not available. Install it or use a packaged build.');
  }
  if (!globus?.api_auth) {
    blockers.push('Log in to Globus.');
  }
  const src = String(globus?.source_endpoint || '').trim();
  if (!src || !isGlobusEndpointUuid(src)) {
    blockers.push(
      'Set a valid local Globus Connect Personal endpoint ID in Configuration → Output delivery → Globus.',
    );
  }
  const targetId = String(globus?.target_endpoint_id || '').trim();
  if (!targetId) {
    blockers.push('Select a Globus target endpoint.');
  }
  const path = String(globus?.collection_path || '').trim();
  if (!path || !path.includes(':')) {
    blockers.push('Choose a target directory (collection path).');
  }
  if (globus?.globus_collection_exists === false) {
    blockers.push(globus.globus_collection_error_message || 'Globus target path could not be verified.');
  }
  if (globusParallelExceedsUploadQueue(ur)) {
    blockers.push(GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE);
  }
  const ready = blockers.length === 0;
  return {
    ready,
    destination: 'globus',
    blockers,
    label: ready
      ? 'Globus is connected and ready for auto-upload.'
      : 'Auto-upload is on for Globus, but it will not run until the issues below are resolved.',
  };
}
