import { createSelector } from '@reduxjs/toolkit';

export const API_INTEGRATIONS = [
  {
    id: 'esm',
    label: 'eSlideManager',
    modalType: 'esm',
    isEnabled: (state) => state.esm?.integrationEnabled !== false,
  },
];

export function getApiIntegrationById(id) {
  if (!id) return null;
  return API_INTEGRATIONS.find((integration) => integration.id === id) ?? null;
}

/** Inputs used by catalog `isEnabled` checks — keep in sync when adding integrations. */
const selectApiIntegrationEnableFlags = (state) => state.esm?.integrationEnabled;

export const getEnabledApiIntegrations = createSelector(
  [selectApiIntegrationEnableFlags],
  (integrationEnabled) => {
    const sliceState = { esm: { integrationEnabled } };
    return API_INTEGRATIONS.filter((integration) => integration.isEnabled(sliceState));
  },
);

export const resolveSelectedApiIntegration = createSelector(
  [getEnabledApiIntegrations, (state) => state.apiIntegrations?.lastSelectedId],
  (enabled, lastSelectedId) => {
    if (enabled.length === 0) return null;

    const persisted = enabled.find((integration) => integration.id === lastSelectedId);
    if (persisted) return persisted;

    return enabled[0];
  },
);
