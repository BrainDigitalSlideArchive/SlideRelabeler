import React from 'react';

import { useSelector} from "react-redux";

import { headerInfo } from "../../helpers/fe_helpers";

import './FileHeaderInfo.scss'

export default function FileHeaderInfo(props) {
  const totalBytes =  useSelector(state => state.files.totalBytes);
  const file_rows = useSelector(state => state.files.file_rows);
  const remainingBytes = useSelector(state => state.files.remainingBytes);
  const count = useSelector(state => state.files.count);
  const transfer_rate = useSelector(state => state.files.transfer_rate);
  const processing = useSelector(state => state.files.processing);
  const metadata_updating = useSelector(state => state.files.metadata_updating);
  const upload_remaining_bytes = useSelector(state => state.files.upload_remaining_bytes);
  const upload_transfer_rate_bytes_per_ms = useSelector(state => state.files.upload_transfer_rate_bytes_per_ms);

  return (
    <h3 className={"FileHeaderInfo"}>
      {headerInfo(file_rows, count, totalBytes, processing, metadata_updating, remainingBytes, transfer_rate, upload_remaining_bytes, upload_transfer_rate_bytes_per_ms)}
    </h3>
  )
}