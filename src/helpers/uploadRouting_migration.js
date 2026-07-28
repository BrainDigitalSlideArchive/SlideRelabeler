import { normalizeStagingDirMode } from './staging_path.js';

function clampPending(n) {
  const v = parseInt(n, 10);
  if (Number.isFinite(v) && v >= 1 && v <= 50) return v;
  return 2;
}

function clampGlobusParallel(n) {
  const v = parseInt(n, 10);
  if (Number.isFinite(v) && v >= 1 && v <= 16) return v;
  return 2;
}

function migrateKeepLocalCopy(savedRouting, dsa, globus) {
  if (savedRouting && typeof savedRouting.keep_local_copy === 'boolean') {
    return savedRouting.keep_local_copy;
  }
  if (savedRouting && typeof savedRouting.delete_local_after === 'boolean') {
    return !savedRouting.delete_local_after;
  }
  const deleteAfter = !!(dsa?.delete_after || globus?.delete_after);
  return !deleteAfter;
}

function migrateLocalOutputEnabled(savedRouting, dsa, globus) {
  if (savedRouting && typeof savedRouting.local_output_enabled === 'boolean') {
    return savedRouting.local_output_enabled;
  }
  if (!savedRouting) return false;
  return !savedRouting.auto_upload || migrateKeepLocalCopy(savedRouting, dsa, globus);
}

/**
 * Build uploadRouting from persisted `uploadRouting` or legacy dsa/globus flags.
 * If both legacy upload toggles were on, destination prefers Globus (single active path).
 */
export function migrateUploadRoutingFromLegacy(dsa, globus, savedRouting) {
  if (savedRouting && typeof savedRouting === 'object') {
    const localOutputEnabled = migrateLocalOutputEnabled(savedRouting, dsa, globus);
    return {
      local_output_enabled: localOutputEnabled,
      auto_upload: !!savedRouting.auto_upload,
      keep_local_copy: !!savedRouting.auto_upload && localOutputEnabled,
      staging_dir_mode: normalizeStagingDirMode(savedRouting.staging_dir_mode),
      staging_dir_custom: typeof savedRouting.staging_dir_custom === 'string'
        ? savedRouting.staging_dir_custom
        : '',
      max_local_pending: clampPending(savedRouting.max_local_pending),
      max_globus_parallel_uploads: clampGlobusParallel(savedRouting.max_globus_parallel_uploads),
      destination: savedRouting.destination === 'globus' ? 'globus' : 'dsa',
      default_local_output_dir: typeof savedRouting.default_local_output_dir === 'string'
        ? savedRouting.default_local_output_dir
        : '',
    };
  }

  const dsaOn = !!(dsa && dsa.upload);
  const globOn = !!(globus && globus.upload);
  let destination = 'dsa';
  let auto_upload = false;
  if (dsaOn && globOn) {
    destination = 'globus';
    auto_upload = true;
  } else if (globOn) {
    destination = 'globus';
    auto_upload = true;
  } else if (dsaOn) {
    destination = 'dsa';
    auto_upload = true;
  }

  const keepLocalCopy = migrateKeepLocalCopy(null, dsa, globus);
  const localOutputEnabled = !auto_upload || keepLocalCopy;
  return {
    local_output_enabled: localOutputEnabled,
    auto_upload,
    keep_local_copy: auto_upload && localOutputEnabled,
    staging_dir_mode: 'system',
    staging_dir_custom: '',
    max_local_pending: clampPending(dsa?.upload_throttle_limit),
    max_globus_parallel_uploads: 2,
    destination,
    default_local_output_dir: '',
  };
}
