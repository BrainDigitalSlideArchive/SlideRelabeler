import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import * as dsa_actions from '../../actions/dsa';
import { openConfigSettings } from '../config/ConfigStickyNav';
import DestinationChangeControl from './DestinationChangeControl.jsx';

/**
 * Pencil control: change durable default (Config) or temporary session URL.
 */
export default function DsaUrlChangeControl({
  disabled = false,
  currentUrl = '',
  showHostInline = false,
  hostLabel = '',
  hostTitle = '',
}) {
  const dispatch = useDispatch();
  const [draftUrl, setDraftUrl] = useState(currentUrl);

  useEffect(() => {
    setDraftUrl(currentUrl || '');
  }, [currentUrl]);

  return (
    <DestinationChangeControl
      disabled={disabled}
      tooltip="Change server URL"
      ariaLabel="Change server URL"
      dialogLabel="Change DSA server URL"
      showHostInline={showHostInline}
      hostLabel={hostLabel}
      hostTitle={hostTitle || currentUrl}
      durableMenuLabel="Update default DSA server URL."
      temporaryMenuLabel="Use a different DSA server this time only."
      onDurable={() => openConfigSettings(dispatch, 'config-dsa-upload')}
      renderTemporary={({ close, backToMenu, popoverId }) => (
        <div className="destination-change__temp">
          <label className="destination-change__temp-label" htmlFor={`${popoverId}-url`}>
            Temporary server URL
          </label>
          <input
            id={`${popoverId}-url`}
            type="text"
            className="destination-change__temp-input"
            value={draftUrl}
            placeholder="https://example.org/api/v1"
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                dispatch({
                  type: dsa_actions.SET_DSA_API_URL,
                  payload: String(draftUrl || '').trim(),
                });
                close();
              }
            }}
          />
          <p className="destination-change__hint">Does not update the Configuration default.</p>
          <div className="destination-change__temp-actions">
            <button type="button" className="destination-change__text-btn" onClick={backToMenu}>
              Back
            </button>
            <button
              type="button"
              className="destination-change__apply-btn"
              onClick={() => {
                dispatch({
                  type: dsa_actions.SET_DSA_API_URL,
                  payload: String(draftUrl || '').trim(),
                });
                close();
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    />
  );
}

/** Open Configuration scrolled to DSA upload settings. */
export function openDsaConfigSettings(dispatch) {
  openConfigSettings(dispatch, 'config-dsa-upload');
}
