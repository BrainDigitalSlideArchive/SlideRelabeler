/**
 * Map raw Globus CLI / SDK errors from `globus ls` (and similar) to user-facing copy.
 * Pure helpers — safe in renderer and main.
 */

export const GLOBUS_LS_FAILURE_KIND = {
  INVALID_UUID: 'invalid_uuid',
  ACCESS_DENIED: 'access_denied',
  CONSENT: 'consent',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  NETWORK: 'network',
  CLI_UNAVAILABLE: 'cli_unavailable',
  UNKNOWN: 'unknown',
};

/**
 * Strip PyInstaller / loader noise for technical disclosure.
 * @param {string} text
 * @returns {string}
 */
export function stripGlobusCliNoise(text) {
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = (line || '').trim();
      if (!trimmed) return true;
      if (/\[PYI-\d+:(DEBUG|INFO|WARN|ERROR)\]/.test(trimmed)) return false;
      if (/^(LOADER:|DYLIB:)/.test(trimmed)) return false;
      if (/^PYI-\d+:(DEBUG|INFO|WARN|ERROR)/.test(trimmed)) return false;
      return true;
    })
    .join('\n')
    .trim();
}

/**
 * @param {string} rawMessage
 * @returns {{ kind: string, userSummary: string, userDetail: string, technical: string }}
 */
export function interpretGlobusLsFailure(rawMessage) {
  const raw = (rawMessage || '').toString();
  const technical = stripGlobusCliNoise(raw) || raw.trim();

  const lower = raw.toLowerCase();
  const tLower = technical.toLowerCase();

  if (/not a valid uuid/i.test(raw)) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.INVALID_UUID,
      userSummary:
        'This value is not a valid endpoint UUID. Pick a result from Search or paste a full endpoint UUID.',
      userDetail: '',
      technical,
    };
  }

  if (
    /consentrequired/i.test(raw) ||
    /consent required/i.test(lower) ||
    /"code"\s*:\s*"ConsentRequired"/i.test(raw) ||
    /\bneeds?\s+consent\b/i.test(lower)
  ) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.CONSENT,
      userSummary: 'Globus needs you to approve access to this endpoint.',
      userDetail:
        'Open the Globus web app if prompted, complete consent for this endpoint, then click Retry listing below. If nothing appears, try another endpoint from the list above.',
      technical,
    };
  }

  if (
    /\b403\b/.test(raw) ||
    /\bforbidden\b/i.test(lower) ||
    /permission denied/i.test(lower) ||
    /access denied/i.test(lower) ||
    /not authorized/i.test(lower) ||
    /unauthorized/i.test(lower) ||
    /"code"\s*:\s*"PermissionDenied"/i.test(raw) ||
    /permissiondenied/i.test(raw)
  ) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.ACCESS_DENIED,
      userSummary: 'Your Globus account cannot list folders on this endpoint.',
      userDetail:
        'The endpoint is selected, but you do not have access (or approval) to browse it. Choose a different endpoint from Matching endpoints above, or ask your administrator to grant access.',
      technical,
    };
  }

  if (
    /\b404\b/.test(raw) ||
    /not found/i.test(lower) ||
    /no such file/i.test(lower) ||
    /endpoint not found/i.test(lower) ||
    /could not be resolved/i.test(lower)
  ) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.NOT_FOUND,
      userSummary: 'Globus could not find this endpoint or path.',
      userDetail: 'Check the endpoint ID and path, or pick another endpoint from the list above.',
      technical,
    };
  }

  if (/"code"\s*:\s*"Conflict"/i.test(raw) || /\bconflict\b/i.test(lower)) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.CONFLICT,
      userSummary: 'Globus reported a conflict for this endpoint or path.',
      userDetail: 'Try another folder or endpoint, or verify the path with your administrator.',
      technical,
    };
  }

  if (
    /econnrefused/i.test(lower) ||
    /enotfound/i.test(lower) ||
    /etimedout/i.test(lower) ||
    /network/i.test(lower) && /error/i.test(lower)
  ) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.NETWORK,
      userSummary: 'A network error occurred while contacting Globus.',
      userDetail: 'Check your connection and try Retry listing. If it persists, try again later.',
      technical,
    };
  }

  if (/globus cli not available/i.test(lower) || !raw.trim()) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE,
      userSummary: 'Globus CLI is not available.',
      userDetail: 'Install or enable globus-cli in your environment, then try again.',
      technical,
    };
  }

  if (/^command failed:/i.test(tLower) || /^error:/i.test(tLower.trim())) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.UNKNOWN,
      userSummary: 'Globus could not list this folder.',
      userDetail:
        'The endpoint may require different credentials, consent, or membership. Try another endpoint from the list above, or use Show technical details if you need to share this with support.',
      technical,
    };
  }

  const firstLine =
    technical
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean) || 'List directory failed';

  return {
    kind: GLOBUS_LS_FAILURE_KIND.UNKNOWN,
    userSummary: 'Globus could not list folders here.',
    userDetail: firstLine.length < 120 ? firstLine : '',
    technical,
  };
}
