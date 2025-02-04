import React from 'react';
import { useState, useEffect, useLayoutEffect} from 'react';
import { useSelector, useDispatch} from 'react-redux';
import { useParams } from 'react-router-dom';
import OpenSeadragon from '../../components/OpenSeaDragon/OpenSeadragon';

import {decodeURLParameters, encodeURLParameters} from "../../helpers/url_helpers";
import './Viewer.scss';

import * as app_actions from '../../actions/app';
import * as modal_actions from '../../actions/modal';
import * as viewer_actions from '../../actions/viewer';
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

function Viewer(props){
  let file = use_param('file');
  let [row_idx, set_row_idx] = useState(use_param('row_idx'));
  let [thumbnail_url, set_thumbnail_url] = useState(null);
  let [label_url, set_label_url] = useState(null);
  let [preview_label_url, set_preview_label_url] = useState(null);
  let [macro_url, set_macro_url] = useState(null);
  let [preview_macro_url, set_preview_macro_url] = useState(null);
  const dispatch = useDispatch();

  let files = useSelector(state => state.files);

  let config = useSelector(state => state.config);

  const [metadata, setMetadata] = useState(null);
  const [image_type, set_image_type] = useState('');

  useEffect(()=>{
    if(file){
      window.electronAPI.getMetadata(file).then(md => {
        md.file = file;
        setMetadata(md);
      })
    } else {
      console.log('No file found in query params')
      console.log(urlParams)
    }
    dispatch({type: app_actions.START_VIEWER});
  }, []);

  function view_image(type) {
    set_image_type(type)
    dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: 'image'}})
  }

  useLayoutEffect(() => {
    // set_row_data({...files.fileRows[row_idx], config: config})
    let output_dict = {...files.fileRows[row_idx], config: config}


    const file_encoded = encodeURIComponent(file);
    const params = encodeURLParameters(output_dict);

    set_thumbnail_url(`thumbnail://${file_encoded}?${params}`);
    set_label_url(`label://${file_encoded}?${params}`);
    set_preview_label_url(`preview-label://${file_encoded}?${params}`);
    set_macro_url(`macro://${file_encoded}?${params}`);
    set_preview_macro_url(`preview-macro://${file_encoded}?${params}`)
  })

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
            <tr>
              <td>Thumbnail:</td>
              <td><img onClick={() => view_image('thumbnail')} src={thumbnail_url}></img></td>
              {files.fileRows[row_idx] && files.fileRows[row_idx].processed !== 1? <td><img onClick={() => view_image('thumbnail')} src={thumbnail_url}></img></td> : <td>Row processed</td>}
            </tr>
            <tr>
              <td>Label:</td>
              <td><img onClick={() => view_image('label')} src={label_url}></img></td>
              {files.fileRows[row_idx] && files.fileRows[row_idx].processed !== 1? <td><img onClick={() => view_image('preview_label')} src={preview_label_url}></img></td> :
              <td>Row processed</td>}

            </tr>
            <tr>
              <td>Macro:</td>
              <td><img onClick={() => view_image('macro')} src={macro_url}></img></td>
              {files.fileRows[row_idx] && files.fileRows[row_idx].processed !== 1?
                config.wsi && !config.wsi.save_macro_image?
                  <td><img onClick={() => view_image('preview_macro')} src={preview_macro_url}></img></td> :
                  <td><img onClick={() => view_image('macro')} src={macro_url}></img></td>
              : <td>Row processed</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>,
    <Modal key={1} image_type={image_type} preview_macro_url={preview_macro_url} thumbnail_url={thumbnail_url} label_url={label_url} preview_label_url={preview_label_url} macro_url={macro_url}/>
      ]
  )
}

export default Viewer;