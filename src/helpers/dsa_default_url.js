// helpers/dsa_default_url.js — sync durable default DSA URL with session api_url.

import { resolveDefaultSessionHydration } from './default_session_hydration.js';

/**
 * @param {{ default_api_url?: string }|null|undefined} dsaUpload
 * @param {{ api_url?: string }|null|undefined} dsa
 * @returns {{ defaultApiUrl: string, sessionApiUrl: string, migrateDefaultFromSession: boolean, hydrateSessionFromDefault: boolean }}
 */
export function resolveDsaUrlHydration(dsaUpload, dsa) {
  const {
    defaultValue,
    sessionValue,
    migrateDefaultFromSession,
    hydrateSessionFromDefault,
  } = resolveDefaultSessionHydration({
    defaultValue: dsaUpload?.default_api_url,
    sessionValue: dsa?.api_url,
  });
  return {
    defaultApiUrl: defaultValue,
    sessionApiUrl: sessionValue,
    migrateDefaultFromSession,
    hydrateSessionFromDefault,
  };
}
