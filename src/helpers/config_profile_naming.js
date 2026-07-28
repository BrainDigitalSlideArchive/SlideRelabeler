/**
 * Naming rules for configuration profiles (library + portable files).
 */

export const PROFILE_NAME_MAX_LEN = 80;

/**
 * @param {string} raw
 * @returns {{ ok: true, name: string } | { ok: false, error: string }}
 */
export function validateProfileName(raw) {
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (!name) {
    return { ok: false, error: 'Enter a profile name.' };
  }
  if (name.length > PROFILE_NAME_MAX_LEN) {
    return { ok: false, error: `Name must be ${PROFILE_NAME_MAX_LEN} characters or fewer.` };
  }
  return { ok: true, name };
}

export function normalizeNameKey(name) {
  return String(name || '').trim().toLowerCase();
}

/**
 * @param {string} name
 * @param {Array<{ id: string, name: string }>} profiles
 * @param {string | null} [excludeId] - profile being renamed (allowed to keep/re-case its own name)
 */
export function isProfileNameTaken(name, profiles, excludeId = null) {
  const key = normalizeNameKey(name);
  if (!key) return false;
  return (profiles || []).some(
    (p) => p.id !== excludeId && normalizeNameKey(p.name) === key,
  );
}

/**
 * Resolve a free library name for import (never overwrites).
 * @param {string} rawName
 * @param {Array<{ name: string }>} existingProfiles - library so far (mutated list as imports accumulate)
 */
export function resolveImportedProfileName(rawName, existingProfiles) {
  let base = typeof rawName === 'string' ? rawName.trim() : '';
  if (!base) base = 'Imported profile';
  if (base.length > PROFILE_NAME_MAX_LEN) {
    base = base.slice(0, PROFILE_NAME_MAX_LEN).trim() || 'Imported profile';
  }

  if (!isProfileNameTaken(base, existingProfiles)) return base;

  const first = `${base} (imported)`;
  if (first.length <= PROFILE_NAME_MAX_LEN && !isProfileNameTaken(first, existingProfiles)) {
    return first;
  }

  let n = 2;
  while (n < 10000) {
    const candidate = `${base} (imported ${n})`;
    const clipped =
      candidate.length > PROFILE_NAME_MAX_LEN
        ? `${base.slice(0, Math.max(1, PROFILE_NAME_MAX_LEN - ` (imported ${n})`.length))} (imported ${n})`
        : candidate;
    if (!isProfileNameTaken(clipped, existingProfiles)) return clipped;
    n += 1;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Sanitize a profile name into a default save-dialog filename (no extension).
 */
export function sanitizeProfileFilenameBase(name, { bundle = false } = {}) {
  let s = typeof name === 'string' ? name.trim() : '';
  s = s.replace(/\s+/g, '-');
  s = s.replace(/[/\\?%*:|"<>]/g, '-');
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (s.length > 60) s = s.slice(0, 60).replace(/-$/, '');
  if (!s) return bundle ? 'config-profiles' : 'config-profile';
  return s;
}

export function defaultExportFilename(name, { bundle = false } = {}) {
  if (bundle) return 'config-profiles.json';
  return `${sanitizeProfileFilenameBase(name, { bundle: false })}.json`;
}
