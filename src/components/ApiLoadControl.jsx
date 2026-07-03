import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as api_integrations_actions from '../actions/apiIntegrations';
import * as modal_actions from '../actions/modal';
import {
  getEnabledApiIntegrations,
  resolveSelectedApiIntegration,
} from '../helpers/api_integrations';
import ToolbarSelectAction from './ToolbarSelectAction';

const NO_APIS_MESSAGE = 'No API integrations are enabled. Enable one under Configuration → Data loading → API Integrations.';

export default function ApiLoadControl({ disabled = false }) {
  const dispatch = useDispatch();
  const enabledIntegrations = useSelector(getEnabledApiIntegrations);
  const selectedIntegration = useSelector(resolveSelectedApiIntegration);
  const hasApis = enabledIntegrations.length > 0;
  const controlsDisabled = disabled || !hasApis;
  const selectValue = selectedIntegration?.id ?? '';

  const options = hasApis
    ? enabledIntegrations.map((integration) => ({
      value: integration.id,
      label: integration.label,
    }))
    : [{ value: '', label: 'No APIs available', disabled: true }];

  const selectTooltip = hasApis ? 'Choose an API to use' : NO_APIS_MESSAGE;
  const actionTooltip = hasApis ? 'Launch API' : NO_APIS_MESSAGE;

  function handleSelectChange(event) {
    const nextId = event.target.value;
    if (!nextId) return;
    dispatch({
      type: api_integrations_actions.SET_LAST_SELECTED_API_INTEGRATION,
      payload: nextId,
    });
  }

  function handleOpen() {
    if (!selectedIntegration) return;
    dispatch({
      type: modal_actions.TOGGLE_MODAL,
      payload: { type: selectedIntegration.modalType },
    });
  }

  return (
    <ToolbarSelectAction
      selectId="api-load-control-select"
      ariaLabel="Load from API"
      options={options}
      value={selectValue}
      disabled={controlsDisabled}
      actionDisabled={!selectedIntegration}
      actionIcon="fi fi-rr-cloud-download"
      actionAriaLabel="Launch API"
      selectTooltip={selectTooltip}
      actionTooltip={actionTooltip}
      onChange={handleSelectChange}
      onAction={handleOpen}
    />
  );
}
