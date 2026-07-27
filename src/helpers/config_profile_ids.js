export function createProfileId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const emptyConfigProfilesDocument = () => ({
  schemaVersion: 1,
  activeProfileId: null,
  activeFingerprint: null,
  profiles: [],
});
