import React from 'react';

import GridHoverTooltip from '../AgGrid/GridHoverTooltip';

import './esm_portal.scss';

const SWITCH_TOOLTIP = 'Switch profile';
const LOGOUT_TOOLTIP = 'Sign out';

export default function ESMSessionBar({
  profileName,
  username,
  disabled = false,
  onSwitchProfile,
  onSignOut,
}) {
  return (
    <div className="esm-session-bar">
      <div className="esm-session-bar__identity">
        {profileName ? (
          <span className="esm-session-bar__profile">{profileName}</span>
        ) : null}
        <span className="esm-session-bar__username">{username}</span>
      </div>
      <div className="esm-session-bar__actions">
        <GridHoverTooltip content={SWITCH_TOOLTIP} show="always" placement="below">
          <button
            type="button"
            className="esm-icon-btn"
            aria-label={SWITCH_TOOLTIP}
            disabled={disabled}
            onClick={onSwitchProfile}
          >
            <i className="fi fi-rr-arrows-repeat" aria-hidden="true" />
          </button>
        </GridHoverTooltip>
        <GridHoverTooltip content={LOGOUT_TOOLTIP} show="always" placement="below">
          <button
            type="button"
            className="esm-icon-btn"
            aria-label={LOGOUT_TOOLTIP}
            disabled={disabled}
            onClick={onSignOut}
          >
            <i className="fi fi-rr-sign-out-alt" aria-hidden="true" />
          </button>
        </GridHoverTooltip>
      </div>
    </div>
  );
}
