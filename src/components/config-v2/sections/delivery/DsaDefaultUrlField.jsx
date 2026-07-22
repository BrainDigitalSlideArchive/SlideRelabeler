import React, { useCallback, useRef, useState } from 'react';

import {
  INVALID_GIRDER_API_URL_MESSAGE,
  getGirderVersionLabel,
} from '../../../../helpers/dsa_url.js';
import HelpIconPopover from '../../../controls/HelpIconPopover';
import Button from '../../../controls/button/Button';
import ConfigField from '../../primitives/ConfigField';
import ConfigStatusField from '../../primitives/ConfigStatusField';

const DSA_URL_HELP = (
  <>
    Default DSA / Girder API address for this configuration. It usually ends with <strong>/api/v1</strong>.
    Sign-in uses this URL on the Delivery panel unless you choose a temporary URL there.
  </>
);

function statusToneFor(status) {
  if (status === 'valid') return 'ok';
  if (status === 'invalid') return 'warn';
  if (status === 'checking') return 'muted';
  return 'neutral';
}

/**
 * Default DSA server URL with blur/button reachability check (config-v2 kit).
 */
export default function DsaDefaultUrlField({ disabled = false, value = '', onChange }) {
  const [status, setStatus] = useState('idle'); // idle | checking | valid | invalid
  const [statusMessage, setStatusMessage] = useState('');
  const lastCheckedUrlRef = useRef('');
  const statusRef = useRef('idle');
  const checkGenRef = useRef(0);

  const runCheck = useCallback(async (rawUrl, { force = false } = {}) => {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) {
      lastCheckedUrlRef.current = '';
      statusRef.current = 'idle';
      setStatus('idle');
      setStatusMessage('');
      return;
    }
    if (
      !force
      && trimmed === lastCheckedUrlRef.current
      && statusRef.current !== 'idle'
      && statusRef.current !== 'checking'
    ) {
      return;
    }

    const gen = ++checkGenRef.current;
    statusRef.current = 'checking';
    setStatus('checking');
    setStatusMessage('Checking…');

    try {
      const response = await electronAPI.dsaCheckServerUrl(trimmed);
      if (gen !== checkGenRef.current) return;

      const ok = Array.isArray(response) && response[0] === true;
      lastCheckedUrlRef.current = trimmed;
      if (ok) {
        const ver = getGirderVersionLabel(response[1]);
        statusRef.current = 'valid';
        setStatus('valid');
        setStatusMessage(ver ? `DSA server reachable (API ${ver})` : 'DSA server reachable');
      } else {
        statusRef.current = 'invalid';
        setStatus('invalid');
        setStatusMessage(INVALID_GIRDER_API_URL_MESSAGE);
      }
    } catch {
      if (gen !== checkGenRef.current) return;
      lastCheckedUrlRef.current = trimmed;
      statusRef.current = 'invalid';
      setStatus('invalid');
      setStatusMessage(INVALID_GIRDER_API_URL_MESSAGE);
    }
  }, []);

  function handleChange(next) {
    onChange?.(next);
    const trimmed = String(next || '').trim();
    if (trimmed !== lastCheckedUrlRef.current) {
      statusRef.current = 'idle';
      setStatus('idle');
      setStatusMessage('');
    }
  }

  function handleBlur() {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      lastCheckedUrlRef.current = '';
      statusRef.current = 'idle';
      setStatus('idle');
      setStatusMessage('');
      return;
    }
    runCheck(trimmed);
  }

  function handleCheckClick() {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      statusRef.current = 'idle';
      setStatus('idle');
      setStatusMessage('');
      return;
    }
    runCheck(trimmed, { force: true });
  }

  return (
    <ConfigStatusField
      label={(
        <>
          Default server address
          <HelpIconPopover helpLabel="Default server API URL help" variant="onLight">
            {DSA_URL_HELP}
          </HelpIconPopover>
        </>
      )}
      status={status !== 'idle' ? statusMessage : undefined}
      statusTone={statusToneFor(status)}
      action={(
        <Button
          variant="onLight"
          text="Check"
          disabled={disabled || status === 'checking' || !String(value || '').trim()}
          onClick={handleCheckClick}
        />
      )}
    >
      <ConfigField
        size="fill"
        omitLabel
        disabled={disabled}
        value={value}
        placeholder="https://example-dsa.org/api/v1"
        ariaLabel="Default DSA server API URL"
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </ConfigStatusField>
  );
}
