import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import HelpIconPopover from '../../../controls/HelpIconPopover';
import Checkbox from '../../../controls/checkbox/Checkbox';
import ConfigLabeledRow from '../../primitives/ConfigLabeledRow';

const SSL_HELP = (
  <>
    <strong>When to use:</strong> Some corporate firewalls perform SSL/TLS inspection, which
    can break certificate verification. Disabling verification is a workaround that reduces
    security. Prefer installing your organization&apos;s CA on this machine when possible.
  </>
);

const SSL_LABEL_ID = 'globus-ssl-verification-label-v2';

/**
 * Durable Globus SSL verification toggle (config-v2 kit).
 * Uses ConfigLabeledRow so the checkbox aligns with Status / numeric fields.
 */
export default function GlobusSslField({ disabled = false }) {
  const dispatch = useDispatch();
  const disableSsl = useSelector(
    (state) => Boolean(state.config?.globus_upload?.disable_ssl_verification),
  );

  return (
    <ConfigLabeledRow
      labelId={SSL_LABEL_ID}
      label={(
        <>
          Disable SSL
          {' '}
          <HelpIconPopover helpLabel="Disable SSL verification help" variant="onLight">
            {SSL_HELP}
          </HelpIconPopover>
        </>
      )}
    >
      <Checkbox
        compact
        hideLabel
        ariaLabelledBy={SSL_LABEL_ID}
        checked={disableSsl}
        disabled={disabled}
        onClick={() => {
          dispatch({
            type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
            payload: { disable_ssl_verification: !disableSsl },
          });
        }}
      />
    </ConfigLabeledRow>
  );
}
