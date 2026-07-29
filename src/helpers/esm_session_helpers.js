import { getActiveProfile, inferEsmConnectionConfig } from './esm_profile_helpers';

export function esmConnectionKey(profile) {
  const { canonicalUrl, proxyUrl } = inferEsmConnectionConfig(profile);
  return `${canonicalUrl || ''}|${proxyUrl || ''}`;
}

/**
 * True when both profiles have a usable request base and the same connection key.
 * Incomplete (blank URL) profiles never share a host — including with each other.
 */
export function profilesShareEsmHost(profileA, profileB) {
  if (!profileA || !profileB) return false;
  const a = inferEsmConnectionConfig(profileA);
  const b = inferEsmConnectionConfig(profileB);
  if (!a.requestBase || !b.requestBase) return false;
  return esmConnectionKey(profileA) === esmConnectionKey(profileB);
}

export function findProfileById(esmState, id) {
  if (!id) return null;
  const profiles = Array.isArray(esmState?.profiles) ? esmState.profiles : [];
  return profiles.find((p) => p && p.id === id) || null;
}

export function resolveSwitchOriginProfile(esmState) {
  return findProfileById(esmState, esmState?.switchOriginProfileId);
}

export function selectedProfileSharesSwitchOriginHost(esmState, selectedProfile) {
  const origin = resolveSwitchOriginProfile(esmState);
  return profilesShareEsmHost(origin, selectedProfile);
}

/**
 * True when the active profile can use the current authenticated eSM session.
 */
export function activeProfileCompatibleWithSession(esmState) {
  if (!esmState?.authenticated) return false;
  const sessionKey = esmState.sessionConnectionKey;
  if (!sessionKey) return false;
  const profile = getActiveProfile(esmState);
  const { requestBase } = inferEsmConnectionConfig(profile);
  if (!requestBase) return false;
  return esmConnectionKey(profile) === sessionKey;
}
