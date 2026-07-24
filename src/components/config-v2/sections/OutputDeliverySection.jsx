import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../actions/config';
import * as upload_routing_actions from '../../../actions/uploadRouting';
import {
  CONFIG_DEFAULT_LOCAL_OUTPUT_DESC,
  CONFIG_DEFAULT_LOCAL_OUTPUT_EMPTY,
  CONFIG_DEFAULT_LOCAL_OUTPUT_HELP,
} from '../../../selectors/saveLocallyPanelCopy';
import {
  GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE,
  globusParallelExceedsUploadQueue,
} from '../../../selectors/uploadRouting.js';
import HelpIconPopover from '../../controls/HelpIconPopover';
import Button from '../../controls/button/Button';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigCategory from '../primitives/ConfigCategory';
import ConfigSubsection from '../primitives/ConfigSubsection';
import ConfigSettingHeader from '../primitives/ConfigSettingHeader';
import ConfigDivider from '../primitives/ConfigDivider';
import ConfigChoiceChips from '../primitives/ConfigChoiceChips';
import ConfigField from '../primitives/ConfigField';
import ConfigPathChip from '../primitives/ConfigPathChip';
import ConfigTextButton from '../primitives/ConfigTextButton';
import ConfigHelperText from '../primitives/ConfigHelperText';
import ConfigWarnText from '../primitives/ConfigWarnText';
import DsaDefaultUrlField from './delivery/DsaDefaultUrlField';
import DsaAfterUploadSettings from './delivery/DsaAfterUploadSettings';
import GlobusSourceEndpointField from './delivery/GlobusSourceEndpointField';
import GlobusDefaultEndpointField from './delivery/GlobusDefaultEndpointField';
import GlobusSslField from './delivery/GlobusSslField';

const SECTION_HELP = (
  <>
    Configure defaults for saving finished slides on this computer and for uploading them.
    Enable <strong>Save locally</strong> and/or <strong>Upload</strong> on the Delivery panel
    (on the main window, above the file list).
  </>
);

const TEMP_FOLDER_HELP = (
  <>
    If Upload is on and Save locally is off, finished files land here briefly before they are sent.
    The default uses your system temporary folder. Choose a custom path if you need a specific scratch disk.
  </>
);

const STAGING_OPTIONS = [
  {
    value: 'system',
    label: 'System temporary folder (recommended)',
  },
  {
    value: 'custom',
    label: 'Custom folder',
  },
];

/**
 * Output delivery — Phase 2d.
 * Recipe: Section → Panel → Category×2 → Location (DSA/Globus) → SettingHeader + chips/field.
 */
export default function OutputDeliverySection() {
  const dispatch = useDispatch();
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);
  const disabled = processing || disableChanges;

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
    <ConfigSection
      id="config-output-delivery"
      title="Output delivery"
      description="Where finished slides are saved or uploaded. Turn on Save locally and/or Upload on the Delivery panel (on the main window, above the file list)."
      help={SECTION_HELP}
      helpLabel="Output delivery help"
    >
      <ConfigSectionPanel>
        <ConfigCategory
          id="config-save-locally"
          title="Save locally"
          description="Defaults for keeping a copy on this computer."
        >
          <ConfigSubsection
            id="config-default-local-output"
            location
            title="Default save folder"
            description={(
              <>
                {CONFIG_DEFAULT_LOCAL_OUTPUT_DESC}
                {' '}
                <HelpIconPopover helpLabel="Default save folder help" variant="onLight">
                  {CONFIG_DEFAULT_LOCAL_OUTPUT_HELP}
                </HelpIconPopover>
              </>
            )}
          >
            {defaultLocalPath ? (
              <>
                <ConfigPathChip path={defaultLocalPath} />
                <div className="cfg-panel-actions">
                  <Button
                    variant="onLight"
                    text="Change folder…"
                    disabled={disabled}
                    onClick={() => dispatch({
                      type: upload_routing_actions.CHOOSE_DEFAULT_LOCAL_OUTPUT_DIR,
                    })}
                  />
                  <ConfigTextButton
                    disabled={disabled}
                    onClick={() => dispatch({
                      type: upload_routing_actions.SET_DEFAULT_LOCAL_OUTPUT_DIR,
                      payload: '',
                    })}
                  >
                    Clear
                  </ConfigTextButton>
                </div>
              </>
            ) : (
              <>
                <ConfigHelperText>{CONFIG_DEFAULT_LOCAL_OUTPUT_EMPTY}</ConfigHelperText>
                <div className="cfg-panel-actions">
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
          </ConfigSubsection>
        </ConfigCategory>

        <ConfigDivider />

        <ConfigCategory
          id="config-upload"
          title="Upload"
          description="Configure SlideRelabeler to send finished slides to an online archive."
        >
          <ConfigSubsection
            id="config-dsa-upload"
            location
            title="Digital Slide Archive (DSA)"
            description={(
              <>
                Each uploaded file becomes a DSA item. You can keep the item name the same as the
                file, or set a different name and attach table data.
              </>
            )}
          >
            <DsaDefaultUrlField
              disabled={disabled}
              value={defaultDsaUrl}
              onChange={(value) => dispatch({
                type: config_actions.SET_DSA_UPLOAD_CONFIG,
                payload: { default_api_url: value },
              })}
            />
            <DsaAfterUploadSettings disabled={disabled} />
          </ConfigSubsection>

          <ConfigSubsection
            id="config-globus-upload"
            location
            title="Globus"
            description={(
              <>
                Set this computer&apos;s Globus endpoint and the default place to send files.
                When you upload, use the Delivery panel (above the file list) to sign in and choose folders.
              </>
            )}
          >
            <GlobusSourceEndpointField disabled={disabled} />
            <GlobusDefaultEndpointField disabled={disabled} />
            <div className="cfg-location-secondary">
              <GlobusSslField disabled={disabled} />
              <div className="cfg-inline-field">
                <label
                  className="cfg-inline-field__label"
                  htmlFor="output-delivery-max-globus-parallel-v2"
                >
                  Max transfers at once:
                </label>
                <ConfigField
                  size="xs"
                  omitLabel
                  inputId="output-delivery-max-globus-parallel-v2"
                  ariaLabel="Max transfers at once"
                  type="number"
                  disabled={disabled}
                  value={String(ur?.max_globus_parallel_uploads ?? 2)}
                  onChange={(value) => dispatch({
                    type: upload_routing_actions.SET_MAX_GLOBUS_PARALLEL_UPLOADS,
                    payload: value,
                  })}
                />
              </div>
              {queueExceeded ? (
                <ConfigWarnText role="alert">
                  {GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE}
                </ConfigWarnText>
              ) : null}
            </div>
          </ConfigSubsection>

          <ConfigSubsection
            title="Upload details"
            description="Usually leave as default. Temporary storage and upload pace used when sending files."
          >
            <ConfigSettingHeader
              id="config-staging-directory"
              quiet
              title="Temporary folder for uploads"
              description={(
                <>
                  Used when uploading without keeping a local copy.
                  {' '}
                  <HelpIconPopover helpLabel="Temporary folder for uploads help" variant="onLight">
                    {TEMP_FOLDER_HELP}
                  </HelpIconPopover>
                </>
              )}
            />
            <div className="cfg-setting-body">
              <ConfigChoiceChips
                name="staging-dir-mode-v2"
                value={stagingMode}
                options={STAGING_OPTIONS}
                disabled={disabled}
                ariaLabel="Temporary folder for uploads"
                onChange={(next) => dispatch({
                  type: upload_routing_actions.SET_STAGING_DIR_MODE,
                  payload: next,
                })}
              />
              {stagingDisplayedPath ? (
                <ConfigPathChip path={stagingDisplayedPath} />
              ) : stagingMode === 'custom' ? (
                <ConfigPathChip path="" emptyLabel="No folder selected." />
              ) : null}
              {stagingMode === 'custom' ? (
                <div className="cfg-panel-actions">
                  <Button
                    variant="onLight"
                    text={customPath ? 'Change folder…' : 'Choose folder…'}
                    disabled={disabled}
                    onClick={() => dispatch({ type: upload_routing_actions.CHOOSE_STAGING_DIR })}
                  />
                </div>
              ) : null}
            </div>

            <ConfigSettingHeader
              id="config-upload-queue"
              quiet
              title="Upload queue"
              description="Limits how many finished files can wait before upload."
            />
            <div className="cfg-inline-field">
              <label
                className="cfg-inline-field__label"
                htmlFor="output-delivery-max-pending-v2"
              >
                Max files waiting to upload:
              </label>
              <ConfigField
                size="xs"
                omitLabel
                inputId="output-delivery-max-pending-v2"
                ariaLabel="Max files waiting to upload"
                type="number"
                disabled={disabled}
                value={String(ur?.max_local_pending ?? 2)}
                onChange={(value) => dispatch({
                  type: upload_routing_actions.SET_MAX_LOCAL_PENDING,
                  payload: value,
                })}
              />
            </div>
            {queueExceeded ? (
              <ConfigWarnText role="alert">
                {GLOBUS_EXCEEDS_UPLOAD_QUEUE_MESSAGE}
              </ConfigWarnText>
            ) : null}
          </ConfigSubsection>
        </ConfigCategory>
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
