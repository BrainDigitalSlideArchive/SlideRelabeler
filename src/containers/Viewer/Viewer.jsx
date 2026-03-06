import React from 'react';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import OpenSeadragon from '../../components/OpenSeaDragon/OpenSeadragon';

import { encodeURLParameters } from "../../helpers/url_helpers";
import './Viewer.scss';

import * as app_actions from '../../actions/app';
import * as modal_actions from '../../actions/modal';
import * as viewer_actions from '../../actions/viewer';
import * as preview_actions from '../../actions/preview';

import Modal from "../Modal/Modal";

function use_param(name) {
  let value;

  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has(name)) {
    value = useParams()[name];
  } else {
    value = urlParams.get(name);
  }
  return value
}

function Viewer(props) {
  let file = use_param('file');
  let [row_idx, set_row_idx] = useState(Number(use_param('row_idx') ?? 0));
  let [thumbnail_url, set_thumbnail_url] = useState(null);
  let [label_url, set_label_url] = useState(null);
  let [preview_label_url, set_preview_label_url] = useState(null);
  let [macro_url, set_macro_url] = useState(null);
  let [preview_macro_url, set_preview_macro_url] = useState(null);
  let [file_row_idx, set_file_row_idx] = useState(null);
  let [file_processed, set_file_processed] = useState(false);

  let ifds = useSelector(state => state.files.ifds);
  const dispatch = useDispatch();

  let files = useSelector(state => state.files);

  let config = useSelector(state => state.config);

  const [metadata, setMetadata] = useState(null);
  const [image_type, set_image_type] = useState('');

  useEffect(() => {
    if (file) {
      window.electronAPI.getMetadata(file).then(md => {
        md.file = file;
        setMetadata(md);
      })
    } else {
      console.log('No file found in query params')
      console.log(urlParams)
    }
    dispatch({ type: app_actions.START_VIEWER });
  }, []);

  function view_image(type) {
    set_image_type(type)
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'image' } })
  }

  useEffect(() => {
    const file_row = files?.file_rows?.[row_idx];
    if (!file || !file_row || !file_row.__reserved) {
      set_thumbnail_url(null);
      set_label_url(null);
      set_preview_label_url(null);
      set_macro_url(null);
      set_preview_macro_url(null);
      return;
    }

    const output_dict = {
      ...file_row,
      __reserved: file_row.__reserved,
      config: config,
    };
    let file_encoded = null;
    if (file_row.__reserved.processed !== 1) {
      file_encoded = encodeURIComponent(file);
    } else {
      file_encoded = encodeURIComponent(file_row.__reserved.output_path);
    }

    console.log("File encoded", file_encoded);
    
    const params = encodeURLParameters(output_dict);
    const associated_images = file_row.__reserved.associatedImages || [];

    // gRPC-backed protocols:
    // - thumbnail/label/macro use hostname as file path
    // - preview-* use query params payload only
    set_thumbnail_url(associated_images.includes('thumbnail') ? `thumbnail://${file_encoded}` : null);
    set_label_url(associated_images.includes('label') ? `label://${file_encoded}` : null);
    set_preview_label_url(associated_images.includes('label') ? `preview-label://preview?${params}` : null);
    set_macro_url(associated_images.includes('macro') ? `macro://${file_encoded}` : null);
    set_preview_macro_url(associated_images.includes('macro') ? `preview-macro://preview?${params}` : null);

    if (file_row_idx !== row_idx && file_row.__reserved.processed !== file_processed) {
      set_file_row_idx(row_idx);
      set_file_processed(file_row.__reserved.processed);
      dispatch({ type: preview_actions.GET_METADATA_PREVIEW, payload: { row_idx: row_idx, file_row } });
    }
  }, [file, row_idx, files, config, file_row_idx, file_processed])

  return ([
    <div key={0} className={"viewer-container"}>
      {OpenSeadragon(metadata)}
      <div className={"__preview"}>
        <table>
          <thead>
            <tr>
              <td></td>
              <td>Current</td>
              <td>After</td>
            </tr>
          </thead>
          <tbody>
            {
              thumbnail_url && (
                <tr>
                  <td>Thumbnail:</td>
                  <td><img onClick={() => view_image('thumbnail')} src={thumbnail_url}></img></td>
                  {files.file_rows[row_idx] && files.file_rows[row_idx].__reserved.processed !== 1 ? <td><img onClick={() => view_image('thumbnail')} src={thumbnail_url}></img></td> : <td>Row processed</td>}
                </tr>
              )
            }
            {
              label_url && preview_label_url && (
                <tr>
                  <td>Label:</td>
                  <td><img onClick={() => view_image('label')} src={label_url}></img></td>
                  {files.file_rows[row_idx] && files.file_rows[row_idx].__reserved.processed !== 1 ? <td><img onClick={() => view_image('preview_label')} src={preview_label_url}></img></td> :
                    <td>Row processed</td>}
                </tr>
              )
            }
            {
              macro_url && preview_macro_url && (
                <tr>
                  <td>Macro:</td>
                  <td><img onClick={() => view_image('macro')} src={macro_url}></img></td>
                  {files.file_rows[row_idx] && files.file_rows[row_idx].__reserved.processed !== 1 ?
                    config.wsi && !config.wsi.save_macro_image ?
                      <td><img onClick={() => view_image('preview_macro')} src={preview_macro_url}></img></td> :
                      <td><img onClick={() => view_image('macro')} src={macro_url}></img></td>
                    : <td>Row processed</td>}
                </tr>
              )
            }
            <tr>
              <td>Metadata:</td>
              <td><button onClick={() => dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'metadata' } })}>View</button></td>
              <td><button onClick={() => dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'metadata' } })}>View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>,
    <Modal key={1} file={file} row_idx={row_idx} image_type={image_type} preview_macro_url={preview_macro_url} thumbnail_url={thumbnail_url} label_url={label_url} preview_label_url={preview_label_url} macro_url={macro_url} />
  ]
  )
}

export default Viewer;