/**
 * Resolve whether to migrate durable default ← session, or hydrate session ← default.
 * Used by DSA URL sync and Globus endpoint/source sync.
 *
 * @param {{ defaultValue?: string|null, sessionValue?: string|null }} args
 * @returns {{
 *   defaultValue: string,
 *   sessionValue: string,
 *   migrateDefaultFromSession: boolean,
 *   hydrateSessionFromDefault: boolean,
 * }}
 */
export function resolveDefaultSessionHydration({ defaultValue, sessionValue } = {}) {
  const normalizedDefault = String(defaultValue ?? '').trim();
  const normalizedSession = String(sessionValue ?? '').trim();
  return {
    defaultValue: normalizedDefault,
    sessionValue: normalizedSession,
    migrateDefaultFromSession: !normalizedDefault && !!normalizedSession,
    hydrateSessionFromDefault: !normalizedSession && !!normalizedDefault,
  };
}
