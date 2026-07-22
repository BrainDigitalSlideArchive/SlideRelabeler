import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as upload_routing_actions from '../../actions/uploadRouting';
import {
  CONFIG_DEFAULT_LOCAL_OUTPUT_DESC,
  CONFIG_DEFAULT_LOCAL_OUTPUT_EMPTY,
  CONFIG_DEFAULT_LOCAL_OUTPUT_HELP,
} from '../../selectors/saveLocallyPanelCopy';
import {
  GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE,
  globusParallelExceedsUploadQueue,
} from '../../selectors/uploadRouting.js';
import GridHoverTooltip from '../AgGrid/GridHoverTooltip';
import HelpIconPopover from '../controls/HelpIconPopover';
import Button from '../controls/button/Button';
import InputText from '../controls/input/InputText';
import DsaAfterUploadSettings from './DsaAfterUploadSettings';
import DsaDefaultUrlField from './DsaDefaultUrlField';
import GlobusDefaultEndpointField from './GlobusDefaultEndpointField';
import GlobusSourceEndpointField from './GlobusSourceEndpointField';
import GlobusSslField from './GlobusSslField';
import * as config_actions from '../../actions/config';

import './OutputDeliverySection.scss';

const SECTION_HELP = (
  <>
    Configure defaults for saving finished slides on this computer and for uploading them.
    Enable <strong>Save locally</strong> and/or <strong>Upload</strong> on the main Delivery panel.
    Sign-in and folder selection for DSA or Globus stay on that panel.
  </>
);

const TEMP_FOLDER_HELP = (
  <>
    If Upload is on and Save locally is off, finished files land here briefly before they are sent.
    The default uses your system temporary folder. Choose a custom path if you need a specific scratch disk.
  </>
);

const TEMP_EMPTY_CUSTOM = 'No folder selected.';

function PathChip({ path }) {
  if (!path) return null;
  return (
    <div className="output-delivery-section__path">
      <i className="fi fi-rr-folder" aria-hidden="true" />
      <GridHoverTooltip
        content={path}
        show="whenTruncated"
        placement="below"
        className="output-delivery-section__path-text"
      >
        {path}
      </GridHoverTooltip>
    </div>
  );
}

export default function OutputDeliverySection({ disabled = false }) {
  const dispatch = useDispatch();
  const ur = useSelector((state) => state.uploadRouting);
  const dsaUpload = useSelector((state) => state.config.dsa_upload);
  const [resolvedSystemPath, setResolvedSystemPath] = useState('');

  const defaultLocalPath = ur?.default_local_output_dir || '';
  const stagingMode = ur?.staging_dir_mode === 'custom' ? 'custom' : 'system';
  const customPath = ur?.staging_dir_custom || '';
  const defaultDsaUrl = dsaUpload?.default_api_url || '';
  const queueExceeded = globusParallelExceedsUploadQueue(ur);

  useEffect(() => {
    let cancelled = false;
    electronAPI.getStagingDirectory({ mode: 'system', customPath: '' })
      .then((path) => {
        if (!cancelled && typeof path === 'string') {
          setResolvedSystemPath(path);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const stagingDisplayedPath = stagingMode === 'system'
    ? resolvedSystemPath
    : (customPath || '');

  return (
    <section className="__config-control-section output-delivery-section" id="config-output-delivery">
      <div className="__config-control-section-title">Output delivery</div>
      <div className="__config-control-section-description">
        Where finished slides go. Enable Save locally / Upload on the Delivery panel.
        {' '}
        <HelpIconPopover helpLabel="Output delivery help" variant="onLight">
          {SECTION_HELP}
        </HelpIconPopover>
      </div>

      <div className="config-section-panel output-delivery-section__panel">
        {/* —— Save locally —— */}
        <div
          className="data-loading-section__subsection output-delivery-section__subsection output-delivery-section__subsection--primary"
          id="config-save-locally"
        >
          <div className="output-delivery-section__category-header">
            <h3 className="output-delivery-section__category-title">Save locally</h3>
            <span className="output-delivery-section__category-desc">
              Defaults for keeping a copy on this computer.
            </span>
          </div>

          <div className="output-delivery-section__setting-header" id="config-default-local-output">
            <h4 className="output-delivery-section__subheading">Default save folder</h4>
            <span className="output-delivery-section__setting-desc">
              {CONFIG_DEFAULT_LOCAL_OUTPUT_DESC}
              {' '}
              <HelpIconPopover helpLabel="Default save folder help" variant="onLight">
                {CONFIG_DEFAULT_LOCAL_OUTPUT_HELP}
              </HelpIconPopover>
            </span>
          </div>

          {defaultLocalPath ? (
            <>
              <PathChip path={defaultLocalPath} />
              <div className="output-delivery-section__actions">
                <Button
                  variant="onLight"
                  text="Change folder…"
                  disabled={disabled}
                  onClick={() => dispatch({
                    type: upload_routing_actions.CHOOSE_DEFAULT_LOCAL_OUTPUT_DIR,
                  })}
                />
                <button
                  type="button"
                  className={`output-delivery-section__text-btn${disabled ? ' _disabled' : ''}`}
                  disabled={disabled}
                  onClick={() => dispatch({
                    type: upload_routing_actions.SET_DEFAULT_LOCAL_OUTPUT_DIR,
                    payload: '',
                  })}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="output-delivery-section__helper">{CONFIG_DEFAULT_LOCAL_OUTPUT_EMPTY}</p>
              <div className="output-delivery-section__actions">
                <Button
                  variant="onLight"
                  text="Choose folder…"
                  disabled={disabled}
                  onClick={() => dispatch({
                    type: upload_routing_actions.CHOOSE_DEFAULT_LOCAL_OUTPUT_DIR,
                  })}
                />
              </div>
            </>
          )}
        </div>

        <hr className="data-loading-section__divider" aria-hidden="true" />

        {/* —— Upload —— */}
        <div
          className="data-loading-section__subsection output-delivery-section__subsection output-delivery-section__subsection--primary"
          id="config-upload"
        >
          <div className="output-delivery-section__category-header">
            <h3 className="output-delivery-section__category-title">Upload</h3>
            <span className="output-delivery-section__category-desc">
              Configure Slide Relabeler to send slides to an online archive.
            </span>
          </div>

          {/* Upload locations */}
          <div
            className="output-delivery-section__location"
            id="config-dsa-upload"
          >
            <h5 className="output-delivery-section__location-title">Digital Slide Archive (DSA)</h5>
            <p className="output-delivery-section__subsection-desc">
              Each uploaded file becomes a DSA item. You can keep the item name the same as the file,
              or set a different name and attach table data.
            </p>
            <DsaDefaultUrlField
              disabled={disabled}
              value={defaultDsaUrl}
              onChange={(value) => dispatch({
                type: config_actions.SET_DSA_UPLOAD_CONFIG,
                payload: { default_api_url: value },
              })}
            />
            <DsaAfterUploadSettings disabled={disabled} />
          </div>

          <div
            className="output-delivery-section__location output-delivery-section__location--globus"
            id="config-globus-upload"
          >
            <h5 className="output-delivery-section__location-title">Globus</h5>
            <p className="output-delivery-section__subsection-desc">
              Sign-in and folder selection stay on the Delivery panel. Set machine and destination
              defaults here.
            </p>
            <GlobusSourceEndpointField disabled={disabled} />
            <GlobusDefaultEndpointField disabled={disabled} />
            <div className="output-delivery-section__quiet-row">
              <GlobusSslField disabled={disabled} />
            </div>
            <div className="output-delivery-section__inline-field">
              <label
                className="output-delivery-section__queue-label"
                htmlFor="output-delivery-max-globus-parallel"
              >
                Max transfers at once:
              </label>
              <InputText
                omitLabel
                inputId="output-delivery-max-globus-parallel"
                ariaLabel="Max transfers at once"
                type="number"
                compact
                variant="onLight"
                disabled={disabled}
                value={String(ur?.max_globus_parallel_uploads ?? 2)}
                onChange={(value) => dispatch({
                  type: upload_routing_actions.SET_MAX_GLOBUS_PARALLEL_UPLOADS,
                  payload: value,
                })}
              />
            </div>
            {queueExceeded ? (
              <p className="output-delivery-section__warn" role="alert">
                {GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE}
              </p>
            ) : null}
          </div>

          <hr className="data-loading-section__divider" aria-hidden="true" />

          {/* Temporary folder */}
          <div
            className="output-delivery-section__quiet"
            id="config-staging-directory"
          >
            <div className="output-delivery-section__setting-header output-delivery-section__setting-header--quiet">
              <h4 className="output-delivery-section__subheading output-delivery-section__subheading--quiet">
                Temporary folder for uploads
              </h4>
              <span className="output-delivery-section__setting-desc">
                Usually leave as default. Used when uploading without keeping a local copy.
                {' '}
                <HelpIconPopover helpLabel="Temporary folder for uploads help" variant="onLight">
                  {TEMP_FOLDER_HELP}
                </HelpIconPopover>
              </span>
            </div>

            <div className="output-delivery-section__temp-controls">
              <div
                className="output-delivery-section__temp-radios config-filename-style config-filename-style--compact"
                role="radiogroup"
                aria-label="Temporary folder for uploads"
              >
                <div className="config-filename-style__modes config-filename-style__modes--compact">
                  <label className="config-filename-style__option">
                    <input
                      type="radio"
                      name="staging-dir-mode"
                      disabled={disabled}
                      checked={stagingMode === 'system'}
                      onChange={() => dispatch({
                        type: upload_routing_actions.SET_STAGING_DIR_MODE,
                        payload: 'system',
                      })}
                    />
                    <span className="config-filename-style__label">System temporary folder (recommended)</span>
                  </label>
                  <label className="config-filename-style__option">
                    <input
                      type="radio"
                      name="staging-dir-mode"
                      disabled={disabled}
                      checked={stagingMode === 'custom'}
                      onChange={() => dispatch({
                        type: upload_routing_actions.SET_STAGING_DIR_MODE,
                        payload: 'custom',
                      })}
                    />
                    <span className="config-filename-style__label">Custom folder</span>
                  </label>
                </div>
              </div>

              {stagingDisplayedPath ? (
                <PathChip path={stagingDisplayedPath} />
              ) : stagingMode === 'custom' ? (
                <span className="output-delivery-section__path-empty">{TEMP_EMPTY_CUSTOM}</span>
              ) : null}

              {stagingMode === 'custom' ? (
                <Button
                  variant="onLight"
                  text={customPath ? 'Change folder…' : 'Choose folder…'}
                  disabled={disabled}
                  onClick={() => dispatch({ type: upload_routing_actions.CHOOSE_STAGING_DIR })}
                />
              ) : null}
            </div>
          </div>

          <hr className="data-loading-section__divider" aria-hidden="true" />

          {/* Upload queue */}
          <div className="output-delivery-section__quiet" id="config-upload-queue">
            <div className="output-delivery-section__setting-header output-delivery-section__setting-header--quiet">
              <h4 className="output-delivery-section__subheading output-delivery-section__subheading--quiet">
                Upload queue
              </h4>
              <span className="output-delivery-section__setting-desc">
                Usually leave as default. Limits how many finished files can wait before upload.
              </span>
            </div>
            <div className="output-delivery-section__queue-control">
              <label
                className="output-delivery-section__queue-label"
                htmlFor="output-delivery-max-pending"
              >
                Max files waiting to upload:
              </label>
              <InputText
                omitLabel
                inputId="output-delivery-max-pending"
                ariaLabel="Max files waiting to upload"
                type="number"
                compact
                variant="onLight"
                disabled={disabled}
                value={String(ur?.max_local_pending ?? 2)}
                onChange={(value) => dispatch({
                  type: upload_routing_actions.SET_MAX_LOCAL_PENDING,
                  payload: value,
                })}
              />
            </div>
            {queueExceeded ? (
              <p className="output-delivery-section__warn" role="alert">
                {GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
