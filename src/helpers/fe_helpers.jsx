export function displayBytes(bytes = null, places = 2) {
  if (bytes === null) return '?';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let numDivisions = 0;
  let output = bytes;
  while (output > 1000 && numDivisions < units.length - 1) {
    output = output / 1024;
    numDivisions += 1;
  }
  return output.toFixed(places) + ' ' + units[numDivisions]
}

/** Compact size for narrow grid columns: integer B/KB, 1 decimal for MB+. */
export function displayBytesCompact(bytes = null) {
  if (bytes === null) return '?';
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  const units = ['MB', 'GB', 'TB', 'PB'];
  let output = bytes / (1024 * 1024);
  let unitIdx = 0;
  while (output >= 1024 && unitIdx < units.length - 1) {
    output /= 1024;
    unitIdx += 1;
  }
  return `${output.toFixed(1)} ${units[unitIdx]}`;
}

export function displayUploadRate(upload_transfer_rate_bytes_per_ms, places = 2) {
  if (upload_transfer_rate_bytes_per_ms === null) return '?';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s'];
  let numDivisions = 0;
  let output = upload_transfer_rate_bytes_per_ms*1000;
  while (output > 1000 && numDivisions < units.length - 1) {
    output = output / 1024;
    numDivisions += 1;
  }
  return output.toFixed(places) + ' ' + units[numDivisions]
}

export function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '0s';
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let out = '';
  if (h > 0) out += `${h}h `;
  if (m > 0 || h > 0) out += `${m}m `;
  out += `${s}s`;
  return out.trim();
}

function sessionLiveMs(closedMs, wallStartMs, nowMs) {
  let t = typeof closedMs === 'number' ? closedMs : 0;
  if (wallStartMs != null && typeof nowMs === 'number') {
    t += Math.max(0, nowMs - wallStartMs);
  }
  return t;
}

export function formatLeftEllipsis(text = '') {
  if (text == '') {
    return '';
  }
  const m = text.match(/^([^a-z0-9\{\}\[\]\(\)]*)(.*?)([^a-z0-9\{\}\[\]\(\)]*)$/i);
  return m[3].split('').reverse() + m[2] + m[1].split('').reverse();
}

/** Same rules as countPendingUploads in process_files.js — processed rows not fully uploaded or still queued. */
export function countPendingUploadFiles(file_rows, dsa_upload_queue, globus_upload_queue) {
  const queuedRowIds = new Set();
  const mergeQueues = [dsa_upload_queue, globus_upload_queue].filter(Array.isArray);
  mergeQueues.forEach((upload_queue) => {
    upload_queue.forEach((q) => {
      if (q && typeof q.row_idx !== 'undefined') {
        queuedRowIds.add(String(q.row_idx));
      }
    });
  });

  let n = 0;
  for (const row_idx in file_rows) {
    const row = file_rows[row_idx];
    if (row?.__reserved?.processed !== 1) continue;
    if (row.__reserved.deleted_after === true) continue;

    const uploadProgress = row?.__reserved?.upload_progress;
    const isQueued = row?.__reserved?.upload_queued === true;
    const isInQueue = queuedRowIds.has(String(row_idx));

    if (isQueued || uploadProgress === undefined || uploadProgress < 100 || isInQueue) {
      n++;
    }
  }
  return n;
}

/**
 * Bytes left to upload; stable between per-file uploads (does not depend on transient progress IPC).
 * When includeUnprocessedFutureUploads is true, adds each not-yet-processed row’s __reserved.bytes
 * (approximate output size) so ETA matches the full list under max_local_pending throttling, not only
 * rows already processed and in the upload queue.
 */
export function computeUploadBacklogBytes(
  file_rows,
  dsa_upload_queue,
  globus_upload_queue,
  includeUnprocessedFutureUploads = false
) {
  const queuedRowIds = new Set();
  const mergeQueues = [dsa_upload_queue, globus_upload_queue].filter(Array.isArray);
  mergeQueues.forEach((upload_queue) => {
    upload_queue.forEach((q) => {
      if (q && typeof q.row_idx !== 'undefined') {
        queuedRowIds.add(String(q.row_idx));
      }
    });
  });

  let bytes = 0;
  for (let row_idx = 0; row_idx < file_rows.length; row_idx++) {
    const row = file_rows[row_idx];
    if (!row?.__reserved || row.__reserved.processed !== 1 || row.__reserved.deleted_after) continue;

    const uploadProgress = row.__reserved.upload_progress;
    const isInQueue = queuedRowIds.has(String(row_idx));
    const sz = row.__reserved.bytes || 0;

    if (uploadProgress === undefined || uploadProgress < 100 || isInQueue) {
      if (typeof uploadProgress === 'number' && uploadProgress >= 0 && uploadProgress < 100) {
        bytes += sz * ((100 - uploadProgress) / 100);
      } else {
        bytes += sz;
      }
    }
  }

  if (includeUnprocessedFutureUploads) {
    for (let row_idx = 0; row_idx < file_rows.length; row_idx++) {
      const row = file_rows[row_idx];
      if (!row?.__reserved || row.__reserved.deleted_after) continue;
      if (row.__reserved.error) continue;
      if (row.__reserved.processed === 1) continue;
      const sz = row.__reserved.bytes || 0;
      if (sz > 0) bytes += sz;
    }
  }

  return bytes;
}

/**
 * Bytes uploaded so far for Progress display: completed rows (full size) plus
 * determinate in-progress fraction. Skips queued and indeterminate (e.g. Globus)
 * rows so Globus stays at finalized totals until Complete.
 */
export function computeLiveUploadedBytes(file_rows) {
  if (!Array.isArray(file_rows)) return 0;
  let bytes = 0;
  for (let i = 0; i < file_rows.length; i++) {
    const r = file_rows[i]?.__reserved;
    if (!r) continue;
    const sz = typeof r.bytes === 'number' ? r.bytes : 0;
    if (!(sz > 0)) continue;
    if (r.upload_queued) continue;
    if (r.upload_progress_indeterminate) continue;
    const p = r.upload_progress;
    if (typeof p !== 'number' || Number.isNaN(p)) continue;
    if (p >= 100 || r.upload_duration_sec != null) {
      bytes += sz;
    } else if (p > 0) {
      bytes += sz * (p / 100);
    }
  }
  return bytes;
}

export function renderProcessingStatus(
  file_rows,
  count,
  totalBytes,
  processing,
  metadata_updating,
  remainingBytes,
  transfer_rate,
  upload_transfer_rate_bytes_per_ms,
  upload_destination,
  auto_upload,
  dsa_upload_queue,
  globus_upload_queue,
  session_metrics,
  nowMs,
  uploading
) {
  // upload_destination kept for call-site compatibility; layout gates on auto_upload only.
  void upload_destination;

  const pendingUploadFiles = countPendingUploadFiles(file_rows, dsa_upload_queue, globus_upload_queue);
  const uploadBacklogBytes = computeUploadBacklogBytes(
    file_rows,
    dsa_upload_queue,
    globus_upload_queue,
    !!auto_upload
  );
  // Reserve upload chrome whenever uploads are enabled so layout does not jump at start.
  const showUploadStatsRow = !!auto_upload;

  let bytes_being_copied = 0;

  for (let row_idx = 0; row_idx < file_rows.length; row_idx++) {
    let file_row = file_rows[row_idx];
    if (file_row && file_row.__reserved.progress > 0 && file_row.__reserved.processed === 0) {
      bytes_being_copied += file_row.__reserved.bytes * (file_row.__reserved.progress / 100);
    }
  }

  let timeDisplay = '';
  let upload_timeDisplay = '';

  if (transfer_rate) {
    let estimated_remaining_bytes = remainingBytes - bytes_being_copied;
    let estimated_remaining_seconds = estimated_remaining_bytes / transfer_rate;

    let estimated_remaining_hours = Math.floor(estimated_remaining_seconds / 3600);
    let estimated_remaining_minutes = Math.floor((estimated_remaining_seconds % 3600) / 60);
    let estimated_remaining_seconds_remaining = Math.floor(estimated_remaining_seconds % 60);


    if (estimated_remaining_hours > 0) {
      timeDisplay += `${estimated_remaining_hours}h `;
    }
    if (estimated_remaining_minutes > 0 || estimated_remaining_hours > 0) {
      timeDisplay += `${estimated_remaining_minutes}m `;
    }
    timeDisplay += `${estimated_remaining_seconds_remaining}s`;
  }

  if (upload_transfer_rate_bytes_per_ms && uploadBacklogBytes > 0) {
    let upload_estimated_remaining_ms = uploadBacklogBytes / upload_transfer_rate_bytes_per_ms;
    let upload_estimated_remaining_seconds = upload_estimated_remaining_ms / 1000;

    let upload_estimated_remaining_hours = Math.floor(upload_estimated_remaining_seconds / 3600);
    let upload_estimated_remaining_minutes = Math.floor((upload_estimated_remaining_seconds % 3600) / 60);
    let upload_estimated_remaining_seconds_remaining = Math.floor(upload_estimated_remaining_seconds % 60);

    if (upload_estimated_remaining_hours > 0) {
      upload_timeDisplay += `${upload_estimated_remaining_hours}h `;
    }
    if (upload_estimated_remaining_minutes > 0 || upload_estimated_remaining_hours > 0) {
      upload_timeDisplay += `${upload_estimated_remaining_minutes}m `;
    }
    upload_timeDisplay += `${upload_estimated_remaining_seconds_remaining}s`;
  }

  const sm = session_metrics && typeof session_metrics === 'object' ? session_metrics : {};
  const copy_bytes = sm.copy_bytes ?? 0;
  const copy_ms_closed = sm.copy_ms_closed ?? 0;
  const copy_wall_start_ms = sm.copy_wall_start_ms ?? null;
  const upload_bytes = sm.upload_bytes ?? 0;
  const upload_ms_closed = sm.upload_ms_closed ?? 0;
  const upload_wall_start_ms = sm.upload_wall_start_ms ?? null;
  const copyDisplayMs = sessionLiveMs(copy_ms_closed, copy_wall_start_ms, nowMs);
  const uploadDisplayMs = sessionLiveMs(upload_ms_closed, upload_wall_start_ms, nowMs);
  const hasCopySession =
    copy_bytes > 0 || copy_ms_closed > 0 || copy_wall_start_ms != null;
  const hasUploadSession =
    upload_bytes > 0 || upload_ms_closed > 0 || upload_wall_start_ms != null;
  const uploadModeActive = !!uploading || pendingUploadFiles > 0;
  const filesReady = file_rows.length > 0 && count >= file_rows.length;
  // Live DSA (determinate) progress; finalized session counter alone stays 0 until each file completes.
  const liveUploadedBytes = uploadModeActive
    ? computeLiveUploadedBytes(file_rows)
    : upload_bytes;

  let sessionLine = null;
  if (filesReady) {
    if (auto_upload) {
      if (uploadModeActive) {
        sessionLine = (
          <p>
            Upload session: {displayBytes(liveUploadedBytes)} in {formatDuration(uploadDisplayMs)}
          </p>
        );
      } else if (!processing && hasCopySession && hasUploadSession) {
        sessionLine = (
          <p>
            Session totals: copied {displayBytes(copy_bytes)} in {formatDuration(copyDisplayMs)}; uploaded{' '}
            {displayBytes(upload_bytes)} in {formatDuration(uploadDisplayMs)}
          </p>
        );
      } else if (processing || hasCopySession) {
        sessionLine = (
          <p>
            Copy session: {displayBytes(copy_bytes)} in {formatDuration(copyDisplayMs)}
          </p>
        );
      } else if (hasUploadSession) {
        sessionLine = (
          <p>
            Upload session: {displayBytes(upload_bytes)} in {formatDuration(uploadDisplayMs)}
          </p>
        );
      } else {
        sessionLine = (
          <p>
            Upload session: not started
          </p>
        );
      }
    } else if (!processing && hasCopySession && hasUploadSession) {
      sessionLine = (
        <p>
          Session totals: copied {displayBytes(copy_bytes)} in {formatDuration(copyDisplayMs)}; uploaded{' '}
          {displayBytes(upload_bytes)} in {formatDuration(uploadDisplayMs)}
        </p>
      );
    } else if (processing || hasCopySession) {
      sessionLine = (
        <p>
          Copy session: {displayBytes(copy_bytes)} in {formatDuration(copyDisplayMs)}
        </p>
      );
    } else if (hasUploadSession) {
      sessionLine = (
        <p>
          Upload session: {displayBytes(upload_bytes)} in {formatDuration(uploadDisplayMs)}
        </p>
      );
    }
  }

  const uploadRateLabel =
    upload_transfer_rate_bytes_per_ms != null && upload_transfer_rate_bytes_per_ms > 0
      ? displayUploadRate(upload_transfer_rate_bytes_per_ms)
      : (processing || uploadModeActive || hasUploadSession)
        ? '—'
        : 'not started';
  const uploadEtaLabel =
    upload_timeDisplay.length > 0
      ? upload_timeDisplay
      : (processing || uploadModeActive || hasUploadSession)
        ? '—'
        : 'not started';

  if (file_rows.length === 0) {
    return <p>No files selected</p>;
  } else if (count < file_rows.length) {
    return <p>Found info for {count} of {file_rows.length} files; {file_rows.length - count} remaining.</p>
  } else {
    return <>
    <p>
      {metadata_updating && "Loading files..." && <span>&nbsp;</span>} 

      Total size: {displayBytes(totalBytes)} for {file_rows.length} files. &nbsp;

      {displayBytes(remainingBytes - bytes_being_copied)} left to copy. &nbsp;

      {timeDisplay.length > 0 && processing && `Estimated time remaining: ${timeDisplay}`}
    </p>
    {
      showUploadStatsRow && (
      <p>
        Upload rate: {uploadRateLabel}
        {' '}&nbsp;
        Estimated upload time remaining: {uploadEtaLabel}
      </p>
      )
    }
    {sessionLine}
    </>
  }
}

export function generate_dropdown_for_table_columns(all_cols, blocked_fields) {
  let new_column_options = [];

  for (let i = 0; i < all_cols.length; i++) {
    let col = all_cols[i];
    if (col.field && !blocked_fields.includes(col.field)) {
      if (col.field === "__reserved.source.path") {
        new_column_options.push({ label: "Path", value: "path" });
      } else if (col.field && !col.headerName) {
        new_column_options.push({ label: col.field, value: col.field });
      } else {
        new_column_options.push({ label: col.headerName, value: col.field });
      }
    }
  }

  return new_column_options;
}