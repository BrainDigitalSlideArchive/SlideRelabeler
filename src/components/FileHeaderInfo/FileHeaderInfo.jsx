import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { headerInfo, countPendingUploadFiles } from '../../helpers/fe_helpers';

import './FileHeaderInfo.scss';

export default function FileHeaderInfo(props) {
  const totalBytes = useSelector((state) => state.files.totalBytes);
  const file_rows = useSelector((state) => state.files.file_rows);
  const remainingBytes = useSelector((state) => state.files.remainingBytes);
  const count = useSelector((state) => state.files.count);
  const transfer_rate = useSelector((state) => state.files.transfer_rate);
  const processing = useSelector((state) => state.files.processing);
  const metadata_updating = useSelector((state) => state.files.metadata_updating);
  const upload_transfer_rate_bytes_per_ms = useSelector((state) => state.files.upload_transfer_rate_bytes_per_ms);
  const session_metrics = useSelector((state) => state.files.session_metrics);
  const uploading = useSelector((state) => state.files.uploading);
  const upload_destination = useSelector((state) => state.uploadRouting.destination);
  const auto_upload = useSelector((state) => state.uploadRouting.auto_upload);
  const dsa_upload_queue = useSelector((state) => state.dsa.upload_queue);
  const globus_upload_queue = useSelector((state) => state.globus.upload_queue);
  const globus_upload_in_flight = useSelector((state) => state.globus.upload_in_flight);

  const pendingUploadFiles = countPendingUploadFiles(file_rows, dsa_upload_queue, globus_upload_queue);
  const needSessionClock =
    processing ||
    uploading ||
    pendingUploadFiles > 0 ||
    (typeof globus_upload_in_flight === 'number' && globus_upload_in_flight > 0);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!needSessionClock) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [needSessionClock]);

  const nowMs = Date.now();

  return (
    <h3 className={'FileHeaderInfo'}>
      {headerInfo(
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
      )}
    </h3>
  );
}