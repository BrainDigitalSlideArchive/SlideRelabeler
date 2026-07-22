import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../actions/config';
import Checkbox from '../controls/checkbox/Checkbox';

/**
 * Durable Globus SSL verification toggle (Configuration).
 */
export default function GlobusSslField({ disabled = false }) {
  const dispatch = useDispatch();
  const disableSsl = useSelector(
    (state) => Boolean(state.config?.globus_upload?.disable_ssl_verification),
  );

  return (
    <Checkbox
      compact
      label="Disable SSL verification"
      helpVariant="onLight"
      disabled={disabled}
      checked={disableSsl}
      onClick={() => {
        dispatch({
          type: config_actions.SET_GLOBUS_UPLOAD_CONFIG,
          payload: { disable_ssl_verification: !disableSsl },
        });
      }}
      tooltip={
        <>
          <strong>When to use:</strong> Some corporate firewalls perform SSL/TLS inspection, which
          can break certificate verification. Disabling verification is a workaround that reduces
          security. Prefer installing your organization&apos;s CA on this machine when possible.
        </>
      }
    />
  );
}
