import React from 'react';
import { useDispatch } from 'react-redux';

import * as globus_actions from '../../actions/globus';
import * as modal_actions from '../../actions/modal';
import { openConfigSettings } from '../config-v2/ConfigV2Nav';
import DestinationChangeControl from './DestinationChangeControl.jsx';

/**
 * Pencil control: change durable default (Config) or temporary session endpoint (picker modal).
 */
export default function GlobusEndpointChangeControl({
  disabled = false,
  showHostInline = false,
  hostLabel = '',
  hostTitle = '',
}) {
  const dispatch = useDispatch();

  function openSessionEndpointPicker() {
    dispatch({
      type: globus_actions.SET_GLOBUS_ENDPOINT_PICKER_MODE,
      payload: 'session',
    });
    dispatch({
      type: modal_actions.TOGGLE_MODAL,
      payload: { type: 'globusEndpointPicker' },
    });
  }

  return (
    <DestinationChangeControl
      disabled={disabled}
      tooltip="Change destination endpoint"
      ariaLabel="Change destination endpoint"
      dialogLabel="Change Globus destination endpoint"
      showHostInline={showHostInline}
      hostLabel={hostLabel}
      hostTitle={hostTitle || hostLabel}
      durableMenuLabel="Update default destination endpoint."
      temporaryMenuLabel="Use a different endpoint this time only."
      onDurable={() => openConfigSettings(dispatch, 'config-globus-upload')}
      onTemporary={openSessionEndpointPicker}
    />
  );
}

/** Open Configuration scrolled to Globus upload settings. */
export function openGlobusConfigSettings(dispatch) {
  openConfigSettings(dispatch, 'config-globus-upload');
}

/** Open endpoint picker for a one-time (session) destination. */
export function openGlobusSessionEndpointPicker(dispatch) {
  dispatch({
    type: globus_actions.SET_GLOBUS_ENDPOINT_PICKER_MODE,
    payload: 'session',
  });
  dispatch({
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'globusEndpointPicker' },
  });
}

/** Open endpoint picker to set the durable Config default. */
export function openGlobusDurableEndpointPicker(dispatch) {
  dispatch({
    type: globus_actions.SET_GLOBUS_ENDPOINT_PICKER_MODE,
    payload: 'durable',
  });
  dispatch({
    type: modal_actions.TOGGLE_MODAL,
    payload: { type: 'globusEndpointPicker' },
  });
}
