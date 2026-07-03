import { inferEsmConnectionConfig } from './esm_profile_helpers';

export function esmConnectionKey(profile) {
  const { canonicalUrl, proxyUrl } = inferEsmConnectionConfig(profile);
  return `${canonicalUrl || ''}|${proxyUrl || ''}`;
}

export function profilesShareEsmHost(profileA, profileB) {
  if (!profileA || !profileB) return false;
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
