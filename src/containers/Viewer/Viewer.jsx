import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import OpenSeadragon from '../../components/OpenSeaDragon/OpenSeadragon';
import useLabelIconForPreview from '../../components/config/useLabelIconForPreview.js';

import { encodeURLParameters } from '../../helpers/url_helpers';
import { buildThumbnailProtocolUrl } from '../../helpers/thumbnail_helpers.js';
import { isViewerDebugEnabled, logViewerDebug } from '../../helpers/viewer_debug';
import { logMetadataPreview } from '../../helpers/metadata_preview_debug';
import {
  hasUsableMetadataTable,
  PREVIEW_ERROR_KEY,
} from '../../helpers/metadata_preview_ui';
import {
  LABEL_ICON_MISSING_SUMMARY,
  LABEL_ICON_UNREADABLE_SUMMARY,
  configForLabelPreview,
  isLabelIconMissing,
} from '../../helpers/label_icon_batch.js';
import './Viewer.scss';

import * as app_actions from '../../actions/app';
import * as modal_actions from '../../actions/modal';
import * as preview_actions from '../../actions/preview';

import Modal from '../Modal/Modal';

function use_param(name) {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has(name)) {
    return useParams()[name];
  }
  return urlParams.get(name);
}

function pathsMatch(storedPath, filePath) {
  if (!storedPath || !filePath) return false;
  if (storedPath === filePath) return true;
  try {
    return decodeURIComponent(storedPath) === decodeURIComponent(filePath);
  } catch {
    return false;
  }
}

function resolveFileRow(fileRows, rowIdxParam, filePath) {
  if (!Array.isArray(fileRows) || !filePath) {
    return { rowIndex: null, fileRow: null };
  }

  const parsed = Number(rowIdxParam ?? 0);
  if (Number.isFinite(parsed) && fileRows[parsed]?.__reserved) {
    return { rowIndex: parsed, fileRow: fileRows[parsed] };
  }

  const byPath = fileRows.findIndex(
    (row) => pathsMatch(row?.__reserved?.source?.path, filePath)
      || pathsMatch(row?.__reserved?.output_path, filePath),
  );
  if (byPath >= 0) {
    return { rowIndex: byPath, fileRow: fileRows[byPath] };
  }

  return { rowIndex: null, fileRow: null };
}

function logImgLoadError(kind, src) {
  logViewerDebug('imgLoadError', { kind, src });
}

function Viewer(props) {
  const file = use_param('file');
  const row_idx_param = use_param('row_idx');

  const [thumbnail_url, set_thumbnail_url] = useState(null);
  const [label_url, set_label_url] = useState(null);
  const [preview_label_url, set_preview_label_url] = useState(null);
  const [macro_url, set_macro_url] = useState(null);
  const [preview_macro_url, set_preview_macro_url] = useState(null);
  const [debugStatus, setDebugStatus] = useState(null);

  const ifds = useSelector((state) => state.files.ifds);
  const dispatch = useDispatch();
  const files = useSelector((state) => state.files);
  const config = useSelector((state) => state.config);

  const { bytesBase64: labelIconBytes, iconReadable } = useLabelIconForPreview(config);
  const iconMissing = isLabelIconMissing(config);
  const previewConfig = useMemo(
    () => configForLabelPreview(config, labelIconBytes),
    [config, labelIconBytes],
  );

  const [metadata, setMetadata] = useState(null);
  const [image_type, set_image_type] = useState('');

  const { rowIndex, fileRow } = useMemo(
    () => resolveFileRow(files.file_rows, row_idx_param, file),
    [files.file_rows, row_idx_param, file],
  );

  useEffect(() => {
    logViewerDebug('init', {
      file,
      row_idx_param,
      locationSearch: window.location.search,
    });
  }, [file, row_idx_param]);

  useEffect(() => {
    logViewerDebug('resolveFileRow', {
      row_idx_param,
      parsedRowIndex: rowIndex,
      file_rows_count: files.file_rows?.length ?? 0,
      resolved: !!fileRow?.__reserved,
      sample_paths: (files.file_rows ?? []).slice(0, 3).map((r) => ({
        source: r?.__reserved?.source?.path,
        output: r?.__reserved?.output_path,
        associatedImages: r?.__reserved?.associatedImages,
        hasBytes: !!r?.__reserved?.bytes,
      })),
    });
  }, [fileRow, rowIndex, row_idx_param, files.file_rows]);

  useEffect(() => {
    if (file) {
      window.electronAPI.getMetadata(file).then((md) => {
        md.file = file;
        setMetadata(md);
      });
    } else {
      logViewerDebug('init', { warning: 'No file in query params' });
    }
    dispatch({ type: app_actions.START_VIEWER });
  }, [dispatch, file]);

  useEffect(() => {
    const sourcePath = fileRow?.__reserved?.source?.path;
    if (!sourcePath || rowIndex == null || fileRow?.__reserved?.processed === 1) {
      return;
    }
    if (fileRow?.__reserved?.error) {
      return;
    }
    const existing = ifds[sourcePath];
    if (
      hasUsableMetadataTable(existing)
      || (existing && typeof existing === 'object' && !Array.isArray(existing) && existing[PREVIEW_ERROR_KEY])
    ) {
      return;
    }

    logMetadataPreview('dispatch', { path: sourcePath, rowIndex });
    dispatch({
      type: preview_actions.GET_METADATA_PREVIEW,
      payload: { row_idx: rowIndex, file_row: fileRow },
    });
  }, [file, rowIndex, fileRow, ifds, dispatch]);

  function view_image(type) {
    set_image_type(type);
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'image' } });
  }

  useEffect(() => {
    const file_row = fileRow;
    if (!file || !file_row || !file_row.__reserved) {
      const blocked = {
        reason: !file ? 'missing_file' : !file_row ? 'missing_file_row' : 'missing___reserved',
        file,
        row_idx_param,
        rowIndex,
        file_rows_count: files.file_rows?.length ?? 0,
      };
      logViewerDebug('sidePanelBlocked', blocked);
      if (isViewerDebugEnabled()) {
        setDebugStatus(blocked);
      }
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
      config: previewConfig,
    };

    let file_encoded;
    if (file_row.__reserved.processed !== 1) {
      file_encoded = encodeURIComponent(file);
    } else {
      file_encoded = encodeURIComponent(file_row.__reserved.output_path);
    }

    const params = encodeURLParameters(output_dict);
    // Prefer live getMetadata (same source OSD uses) over hydrated file_row,
    // which can lag when the viewer opens before store-updated lands.
    let associated_images;
    let assoc_source;
    if (Array.isArray(metadata?.associatedImages)) {
      associated_images = metadata.associatedImages;
      assoc_source = 'metadata';
    } else if (Array.isArray(file_row.__reserved.associatedImages)) {
      associated_images = file_row.__reserved.associatedImages;
      assoc_source = 'file_row';
    } else {
      associated_images = [];
      assoc_source = 'none';
    }

    const next_thumbnail_url = associated_images.includes('thumbnail')
      ? buildThumbnailProtocolUrl(file) : null;
    const next_label_url = associated_images.includes('label')
      ? `label://${file_encoded}` : null;
    const next_preview_label_url = associated_images.includes('label')
      ? `preview-label://preview?${params}` : null;
    const next_macro_url = associated_images.includes('macro')
      ? `macro://${file_encoded}` : null;
    const next_preview_macro_url = associated_images.includes('macro')
      ? `preview-macro://preview?${params}` : null;

    const urlsBuilt = {
      associated_images,
      assoc_source,
      has_thumbnail: associated_images.includes('thumbnail'),
      has_label: associated_images.includes('label'),
      has_macro: associated_images.includes('macro'),
      processed: file_row.__reserved.processed,
      file_encoded_preview: file_encoded?.slice(0, 80),
      thumbnail_url_set: !!next_thumbnail_url,
      label_url_set: !!next_label_url,
      macro_url_set: !!next_macro_url,
    };

    if (associated_images.length === 0) {
      logViewerDebug('sidePanelUrls', { ...urlsBuilt, note: 'no_associated_images' });
    } else {
      logViewerDebug('sidePanelUrls', urlsBuilt);
    }
    if (isViewerDebugEnabled()) {
      setDebugStatus(urlsBuilt);
    }

    set_thumbnail_url(next_thumbnail_url);
    set_label_url(next_label_url);
    set_preview_label_url(next_preview_label_url);
    set_macro_url(next_macro_url);
    set_preview_macro_url(next_preview_macro_url);
  }, [
    file,
    fileRow,
    rowIndex,
    row_idx_param,
    files.file_rows,
    previewConfig,
    metadata,
  ]);

  const showViewerDebug = isViewerDebugEnabled();

  return ([
    <div key={0} className="viewer-container">
      {OpenSeadragon(metadata)}
      <div className="__preview">
        <div className="__preview-panel">
          <div className="__preview-header">
            <span className="__preview-header-label" />
            <span>Current</span>
            <span>After</span>
          </div>
          <div className="__preview-body">
        <table>
          <tbody>
            {
              thumbnail_url && (
                <tr>
                  <td>Thumbnail:</td>
                  <td>
                    <img
                      onClick={() => view_image('thumbnail')}
                      src={thumbnail_url}
                      alt="Current thumbnail"
                      onError={() => logImgLoadError('thumbnail', thumbnail_url)}
                    />
                  </td>
                  {fileRow?.__reserved?.processed !== 1 ? (
                    <td>
                      <img
                        onClick={() => view_image('thumbnail')}
                        src={thumbnail_url}
                        alt="After thumbnail"
                        onError={() => logImgLoadError('thumbnail_after', thumbnail_url)}
                      />
                    </td>
                  ) : (
                    <td>Row processed</td>
                  )}
                </tr>
              )
            }
            {
              label_url && preview_label_url && (
                <tr>
                  <td>Label:</td>
                  <td>
                    <img
                      onClick={() => view_image('label')}
                      src={label_url}
                      alt="Current label"
                      onError={() => logImgLoadError('label', label_url)}
                    />
                  </td>
                  {fileRow?.__reserved?.processed !== 1 ? (
                    <td>
                      <img
                        onClick={() => view_image('preview_label')}
                        src={preview_label_url}
                        alt="After label"
                        onError={() => logImgLoadError('preview_label', preview_label_url)}
                      />
                      {iconMissing ? (
                        <div className="__preview-icon-warning" role="status">
                          {LABEL_ICON_MISSING_SUMMARY}
                        </div>
                      ) : iconReadable === false ? (
                        <div className="__preview-icon-warning" role="status">
                          {LABEL_ICON_UNREADABLE_SUMMARY}
                        </div>
                      ) : null}
                    </td>
                  ) : (
                    <td>Row processed</td>
                  )}
                </tr>
              )
            }
            {
              macro_url && preview_macro_url && (
                <tr>
                  <td>Macro:</td>
                  <td>
                    <img
                      onClick={() => view_image('macro')}
                      src={macro_url}
                      alt="Current macro"
                      onError={() => logImgLoadError('macro', macro_url)}
                    />
                  </td>
                  {fileRow?.__reserved?.processed !== 1 ? (
                    config.wsi && !config.wsi.save_macro_image ? (
                      <td>
                        <img
                          onClick={() => view_image('preview_macro')}
                          src={preview_macro_url}
                          alt="After macro"
                          onError={() => logImgLoadError('preview_macro', preview_macro_url)}
                        />
                      </td>
                    ) : (
                      <td>
                        <img
                          onClick={() => view_image('macro')}
                          src={macro_url}
                          alt="After macro"
                          onError={() => logImgLoadError('macro_after', macro_url)}
                        />
                      </td>
                    )
                  ) : (
                    <td>Row processed</td>
                  )}
                </tr>
              )
            }
            <tr>
              <td>Metadata:</td>
              <td colSpan={2}>
                <button
                  type="button"
                  className="__preview-action"
                  onClick={() => dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'metadata' } })}
                >
                  Compare
                </button>
              </td>
            </tr>
            {showViewerDebug && (
              <tr>
                <td>Debug:</td>
                <td colSpan={2}>
                  <button
                    type="button"
                    className="__preview-action"
                    onClick={() => dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'viewerDebug' } })}
                  >
                    View
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
          </div>
        </div>
      </div>
    </div>,
    <Modal
      key={1}
      file={file}
      row_idx={rowIndex ?? row_idx_param}
      image_type={image_type}
      preview_macro_url={preview_macro_url}
      thumbnail_url={thumbnail_url}
      label_url={label_url}
      preview_label_url={preview_label_url}
      macro_url={macro_url}
      debug_status={debugStatus}
    />,
  ]);
}

export default Viewer;
