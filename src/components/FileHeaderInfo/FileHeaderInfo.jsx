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

  return (
    <h3 className={"FileHeaderInfo"}>
      {headerInfo(file_rows, count, totalBytes, processing, metadata_updating, remainingBytes, transfer_rate)}
    </h3>
  )
}