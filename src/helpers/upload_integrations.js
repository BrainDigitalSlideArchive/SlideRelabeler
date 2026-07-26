/**
 * Upload destination integrations (DSA / Globus) — opt-in via config flags.
 * Enabled only when integrationEnabled === true (missing → off).
 */

export const UPLOAD_DESTINATIONS = [
  {
    value: 'dsa',
    label: 'DSA',
    isEnabled: (state) => state.config?.dsa_upload?.integrationEnabled === true,
  },
  {
    value: 'globus',
    label: 'Globus',
    isEnabled: (state) => state.config?.globus_upload?.integrationEnabled === true,
  },
];

export function isDsaUploadIntegrationEnabled(state) {
  return state.config?.dsa_upload?.integrationEnabled === true;
}

export function isGlobusUploadIntegrationEnabled(state) {
  return state.config?.globus_upload?.integrationEnabled === true;
}

/**
 * @returns {{ value: 'dsa'|'globus', label: string }[]}
 */
export function getEnabledUploadDestinations(state) {
  return UPLOAD_DESTINATIONS
    .filter((dest) => dest.isEnabled(state))
    .map(({ value, label }) => ({ value, label }));
}
