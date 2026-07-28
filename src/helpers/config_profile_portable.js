import { validateProfileName } from './config_profile_naming.js';

export const PROFILE_KIND_SINGLE = 'slideRelabeler.configProfile';
export const PROFILE_KIND_BUNDLE = 'slideRelabeler.configProfileBundle';
export const PROFILE_SCHEMA_VERSION = 1;

export function buildSinglePortableFile({ name, payload, exportedAt = new Date().toISOString() }) {
  return {
    kind: PROFILE_KIND_SINGLE,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    name,
    exportedAt,
    payload,
  };
}

export function buildBundlePortableFile({ profiles, exportedAt = new Date().toISOString() }) {
  return {
    kind: PROFILE_KIND_BUNDLE,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    exportedAt,
    profiles: (profiles || []).map((p) => ({
      name: p.name,
      payload: p.payload,
    })),
  };
}

/**
 * Parse and validate a portable JSON document.
 * @returns {{ ok: true, mode: 'single'|'bundle', entries: Array<{ name: string, payload: object }> }
 *   | { ok: false, error: string }}
 */
export function parsePortableProfileDocument(raw) {
  let doc = raw;
  if (typeof raw === 'string') {
    try {
      doc = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'File is not valid JSON.' };
    }
  }
  if (!doc || typeof doc !== 'object') {
    return { ok: false, error: 'Invalid profile file.' };
  }

  const version = doc.schemaVersion;
  if (version != null && version !== PROFILE_SCHEMA_VERSION) {
    return { ok: false, error: `Unsupported profile schema version (${version}).` };
  }

  if (doc.kind === PROFILE_KIND_SINGLE) {
    if (!doc.payload || typeof doc.payload !== 'object') {
      return { ok: false, error: 'Profile file is missing settings payload.' };
    }
    const nameCheck = validateProfileName(doc.name || 'Imported profile');
    const name = nameCheck.ok ? nameCheck.name : 'Imported profile';
    return {
      ok: true,
      mode: 'single',
      entries: [{ name, payload: doc.payload }],
    };
  }

  if (doc.kind === PROFILE_KIND_BUNDLE) {
    if (!Array.isArray(doc.profiles) || doc.profiles.length === 0) {
      return { ok: false, error: 'Profile bundle has no profiles.' };
    }
    const entries = [];
    for (const item of doc.profiles) {
      if (!item || typeof item !== 'object' || !item.payload || typeof item.payload !== 'object') {
        return { ok: false, error: 'Profile bundle contains an invalid entry.' };
      }
      const nameCheck = validateProfileName(item.name || 'Imported profile');
      entries.push({
        name: nameCheck.ok ? nameCheck.name : 'Imported profile',
        payload: item.payload,
      });
    }
    return { ok: true, mode: 'bundle', entries };
  }

  return {
    ok: false,
    error: 'Unrecognized file. Expected a SlideRelabeler configuration profile or bundle.',
  };
}
