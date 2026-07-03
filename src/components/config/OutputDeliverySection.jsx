import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as upload_routing_actions from '../../actions/uploadRouting';
import {
  CONFIG_DEFAULT_LOCAL_OUTPUT_DESC,
  CONFIG_DEFAULT_LOCAL_OUTPUT_EMPTY,
  CONFIG_DEFAULT_LOCAL_OUTPUT_HELP,
} from '../../selectors/saveLocallyPanelCopy';
import HelpIconPopover from '../controls/HelpIconPopover';
import Button from '../controls/button/Button';
import InputText from '../controls/input/InputText';

import './OutputDeliverySection.scss';

const SECTION_HELP = (
  <>
    Configure default local save folder, upload staging, and upload throttling. Enable Save locally
    and/or Upload on the main Delivery panel.
  </>
);

const STAGING_HELP = (
  <>
    When auto-upload runs without keeping a local copy, de-identified files are written to this
    staging directory before upload. The default uses your system temporary folder. Choose a custom
    path if you need a specific scratch disk.
  </>
);

const STAGING_EMPTY_CUSTOM = 'No folder selected.';

function PathChip({ path }) {
  return (
    <div className="output-delivery-section__path" title={path}>
      <i className="fi fi-rr-folder" aria-hidden="true" />
      <span>{path}</span>
    </div>
  );
}

export default function OutputDeliverySection({ disabled = false }) {
  const dispatch = useDispatch();
  const ur = useSelector((state) => state.uploadRouting);
  const [resolvedSystemPath, setResolvedSystemPath] = useState('');

  const defaultLocalPath = ur?.default_local_output_dir || '';
  const stagingMode = ur?.staging_dir_mode === 'custom' ? 'custom' : 'system';
  const customPath = ur?.staging_dir_custom || '';

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
        Local save defaults, upload staging, and upload processing limits.
        {' '}
        <HelpIconPopover helpLabel="Output delivery help" variant="onLight">
          {SECTION_HELP}
        </HelpIconPopover>
      </div>

      <div className="config-section-panel output-delivery-section__panel">
        <div
          className="data-loading-section__subsection output-delivery-section__subsection"
          id="config-default-local-output"
        >
          <h3 className="data-loading-section__subsection-title">Default local output directory</h3>
          <p className="output-delivery-section__subsection-desc">
            {CONFIG_DEFAULT_LOCAL_OUTPUT_DESC}
            {' '}
            <HelpIconPopover helpLabel="Default local output directory help" variant="onLight">
              {CONFIG_DEFAULT_LOCAL_OUTPUT_HELP}
            </HelpIconPopover>
          </p>

          {defaultLocalPath ? (
            <>
              <PathChip path={defaultLocalPath} />
              <div className="output-delivery-section__actions">
                <Button
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

        <div
          className="data-loading-section__subsection output-delivery-section__subsection"
          id="config-staging-directory"
        >
          <h3 className="data-loading-section__subsection-title">Upload staging directory</h3>
          <p className="output-delivery-section__subsection-desc">
            Used when uploading without keeping a local copy.
            {' '}
            <HelpIconPopover helpLabel="Staging directory help" variant="onLight">
              {STAGING_HELP}
            </HelpIconPopover>
          </p>

          <div
            className="output-delivery-section__radios config-filename-style config-filename-style--compact"
            role="radiogroup"
            aria-label="Staging directory location"
          >
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
              <span className="config-filename-style__label">System temporary directory (recommended)</span>
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
              <span className="config-filename-style__label">Custom path</span>
            </label>
          </div>

          {stagingMode === 'system' && stagingDisplayedPath && (
            <PathChip path={stagingDisplayedPath} />
          )}

          {stagingMode === 'custom' && (
            <>
              {stagingDisplayedPath ? (
                <PathChip path={stagingDisplayedPath} />
              ) : (
                <p className="output-delivery-section__helper">{STAGING_EMPTY_CUSTOM}</p>
              )}
              <div className="output-delivery-section__actions">
                <Button
                  text={customPath ? 'Change folder…' : 'Choose folder…'}
                  disabled={disabled}
                  onClick={() => dispatch({ type: upload_routing_actions.CHOOSE_STAGING_DIR })}
                />
              </div>
            </>
          )}
        </div>

        <hr className="data-loading-section__divider" aria-hidden="true" />

        <div className="data-loading-section__subsection output-delivery-section__subsection">
          <h3 className="data-loading-section__subsection-title">Upload processing</h3>
          <p className="output-delivery-section__subsection-desc">
            Limits how many finished files can sit in staging while uploads finish (upload-only mode).
          </p>
          <div className="output-delivery-section__field">
            <InputText
              label="Max files waiting on disk during upload"
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
          {ur?.auto_upload && ur?.destination === 'globus' && (
            <div className="output-delivery-section__field">
              <InputText
                label="Max parallel Globus transfers"
                type="number"
                compact
                variant="onLight"
                disabled={disabled}
                value={String(ur?.max_globus_parallel_uploads ?? 4)}
                onChange={(value) => dispatch({
                  type: upload_routing_actions.SET_MAX_GLOBUS_PARALLEL_UPLOADS,
                  payload: value,
                })}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
