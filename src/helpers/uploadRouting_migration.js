/**
 * Build uploadRouting from persisted `uploadRouting` or legacy dsa/globus flags.
 * If both legacy upload toggles were on, destination prefers Globus (single active path).
 */
export function migrateUploadRoutingFromLegacy(dsa, globus, savedRouting) {
  if (savedRouting && typeof savedRouting === 'object') {
    return {
      auto_upload: !!savedRouting.auto_upload,
      delete_local_after: !!savedRouting.delete_local_after,
      max_local_pending: clampPending(savedRouting.max_local_pending),
      max_globus_parallel_uploads: clampGlobusParallel(savedRouting.max_globus_parallel_uploads),
      destination: savedRouting.destination === 'globus' ? 'globus' : 'dsa',
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

  const delete_local_after = !!(dsa?.delete_after || globus?.delete_after);
  const max_local_pending = clampPending(dsa?.upload_throttle_limit);

  return {
    auto_upload,
    delete_local_after,
    max_local_pending,
    max_globus_parallel_uploads: 4,
    destination,
  };
}

function clampPending(n) {
  const v = parseInt(n, 10);
  if (Number.isFinite(v) && v >= 1 && v <= 50) return v;
  return 2;
}

function clampGlobusParallel(n) {
  const v = parseInt(n, 10);
  if (Number.isFinite(v) && v >= 1 && v <= 16) return v;
  return 4;
}
