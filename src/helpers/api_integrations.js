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

export function getEnabledApiIntegrations(state) {
  return API_INTEGRATIONS.filter((integration) => integration.isEnabled(state));
}

export function resolveSelectedApiIntegration(state) {
  const enabled = getEnabledApiIntegrations(state);
  if (enabled.length === 0) return null;

  const lastSelectedId = state.apiIntegrations?.lastSelectedId;
  const persisted = enabled.find((integration) => integration.id === lastSelectedId);
  if (persisted) return persisted;

  return enabled[0];
}
