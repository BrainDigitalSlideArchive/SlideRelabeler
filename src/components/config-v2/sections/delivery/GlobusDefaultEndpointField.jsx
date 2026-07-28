import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import * as globus_actions from '../../../../actions/globus';
import HelpIconPopover from '../../../controls/HelpIconPopover';
import Button from '../../../controls/button/Button';
import { openGlobusDurableEndpointPicker } from '../../../DeliveryPanel/GlobusEndpointChangeControl.jsx';
import ConfigPathChip from '../../primitives/ConfigPathChip';
import ConfigStatusField from '../../primitives/ConfigStatusField';
import ConfigTextButton from '../../primitives/ConfigTextButton';
import ConfigWarnText from '../../primitives/ConfigWarnText';
import { GlobusCliUnavailableMessage } from './globus_cli_copy.jsx';

const DEFAULT_EP_HELP = (
  <>
    Default remote Globus collection used when Upload via Globus is enabled on the Delivery panel.
    That panel can override the endpoint for this session without changing this default.
  </>
);

/**
 * Durable default Globus destination endpoint (config-v2 kit).
 */
export default function GlobusDefaultEndpointField({ disabled = false }) {
  const dispatch = useDispatch();
  const id = useSelector(
    (state) => state.config?.globus_upload?.default_target_endpoint_id || '',
  );
  const label = useSelector(
    (state) => state.config?.globus_upload?.default_target_endpoint_label || '',
  );
  const cliAvailable = useSelector((state) => state.globus?.cli_available);
  const hasDefault = Boolean(String(id || '').trim());
  const display = label || id;
  const cliMissing = cliAvailable === false;
  const pickerDisabled = disabled || cliMissing;
  const chipText = hasDefault
    ? (id && display !== id ? `${display} (${id})` : display)
    : '';

  useEffect(() => {
    let cancelled = false;
    async function ensureCliStatus() {
      if (cliAvailable != null) return;
      try {
        const response = await window.electronAPI.globusCheckCliAvailable();
        if (cancelled) return;
        dispatch({
          type: globus_actions.CHECK_CLI_AVAILABLE,
          payload: !!(response && response[0]),
        });
      } catch (e) {
        if (cancelled) return;
        dispatch({ type: globus_actions.CHECK_CLI_AVAILABLE, payload: false });
      }
    }
    ensureCliStatus();
    return () => {
      cancelled = true;
    };
  }, [cliAvailable, dispatch]);

  function clearDefault() {
    dispatch({
      type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
      payload: {
        default_target_endpoint_id: '',
        default_target_endpoint_label: '',
      },
    });
  }

  return (
    <div>
      <ConfigStatusField
        compact={!hasDefault}
        label={(
          <>
            Default destination endpoint
            <HelpIconPopover helpLabel="Default Globus destination help" variant="onLight">
              {DEFAULT_EP_HELP}
            </HelpIconPopover>
          </>
        )}
        action={(
          <>
            <Button
              variant="onLight"
              text={hasDefault ? 'Change default…' : 'Choose default…'}
              disabled={pickerDisabled}
              onClick={() => openGlobusDurableEndpointPicker(dispatch)}
            />
            {hasDefault ? (
              <ConfigTextButton disabled={disabled} onClick={clearDefault}>
                Clear
              </ConfigTextButton>
            ) : null}
          </>
        )}
      >
        {hasDefault ? (
          <ConfigPathChip path={chipText} />
        ) : (
          <p className="cfg-status-field__empty">No default endpoint configured.</p>
        )}
      </ConfigStatusField>
      {cliMissing ? (
        <ConfigWarnText role="status">
          <GlobusCliUnavailableMessage trailing=". Endpoint search is disabled until they are installed." />
        </ConfigWarnText>
      ) : null}
    </div>
  );
}
