import React from 'react';

import { useSelector} from "react-redux";

import { headerInfo } from "../../helpers/fe_helpers";

import './FileHeaderInfo.scss'

export default function FileHeaderInfo(props) {
  const totalBytes =  useSelector(state => state.files.totalBytes);
  const fileRows = useSelector(state => state.files.fileRows);
  const remainingBytes = useSelector(state => state.files.remainingBytes);
  const count = useSelector(state => state.files.count);

  return (
    <h3 className={"FileHeaderInfo"}>
      {headerInfo(fileRows, count, totalBytes, remainingBytes)}
    </h3>
  )
}