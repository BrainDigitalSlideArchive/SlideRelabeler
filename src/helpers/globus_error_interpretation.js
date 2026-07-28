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

/** Failure kinds for `globus endpoint local-id` / Auto-detect local endpoint. */
export const GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND = {
  CLI_UNAVAILABLE: 'cli_unavailable',
  LOGIN_REQUIRED: 'login_required',
  GCP_UNAVAILABLE: 'gcp_unavailable',
  INVALID_RESPONSE: 'invalid_response',
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

  if (
    /globus cli not available/i.test(lower)
    || /spawn\s+globus\s+enoent/i.test(lower)
    || /enoent/i.test(lower) && /globus/i.test(lower)
    || !raw.trim()
  ) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE,
      userSummary: 'Globus CLI is not available.',
      userDetail: 'Install Globus CLI (globus-cli) or use a packaged build, then try again.',
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

/**
 * Map `globus endpoint local-id` / Auto-detect failures to user-facing copy.
 * Accepts a string, Error, or IPC payload `{ code, message }`.
 * Does not truncate long IPC messages (unlike interpretGlobusCliFailure).
 * @param {string|Error|{ code?: string, message?: string }|null|undefined} raw
 * @returns {{ kind: string, userSummary: string, userDetail: string, technical: string }}
 */
export function interpretGlobusLocalEndpointFailure(raw) {
  let code = '';
  let message = '';
  if (raw && typeof raw === 'object' && !(raw instanceof Error)) {
    code = String(raw.code || '').trim().toLowerCase();
    message = raw.message != null ? String(raw.message) : '';
  } else if (raw && typeof raw === 'object' && raw.message != null) {
    message = String(raw.message);
  } else {
    message = (raw || '').toString();
  }

  const technical = stripGlobusCliNoise(message) || message.trim();
  const lower = `${code}\n${message}\n${technical}`.toLowerCase();

  if (
    code === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.CLI_UNAVAILABLE
    || /globus cli not available/i.test(lower)
    || /spawn\s+globus\s+enoent/i.test(lower)
    || (/enoent/i.test(lower) && /globus/i.test(lower))
  ) {
    return {
      kind: GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.CLI_UNAVAILABLE,
      userSummary: 'Globus CLI is not available.',
      userDetail: 'Install Globus CLI (globus-cli) or use a packaged build, then try again.',
      technical,
    };
  }

  if (
    code === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.LOGIN_REQUIRED
    || /sign in to globus/i.test(lower)
    || /login required|missinglogin|not logged in|consentrequired|auth.*required/.test(lower)
  ) {
    return {
      kind: GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.LOGIN_REQUIRED,
      userSummary:
        technical
        || 'Sign in to Globus before Auto-detect can read this computer’s endpoint ID.',
      userDetail: '',
      technical,
    };
  }

  if (code === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.INVALID_RESPONSE) {
    return {
      kind: GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.INVALID_RESPONSE,
      userSummary:
        technical
        || 'Globus CLI did not return a valid endpoint UUID. Ensure Globus Connect Personal is installed and running for this user.',
      userDetail: '',
      technical,
    };
  }

  if (
    code === GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.GCP_UNAVAILABLE
    || /globus connect personal/i.test(lower)
    || /local endpoint/i.test(lower)
  ) {
    return {
      kind: GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.GCP_UNAVAILABLE,
      userSummary:
        technical
        || 'Globus Connect Personal does not appear configured on this machine, or the local endpoint could not be read. Install and run Globus Connect Personal, then try Auto-detect again.',
      userDetail: '',
      technical,
    };
  }

  return {
    kind: GLOBUS_LOCAL_ENDPOINT_FAILURE_KIND.UNKNOWN,
    userSummary: technical || 'Could not read the local Globus Connect Personal endpoint ID.',
    userDetail: '',
    technical,
  };
}

/**
 * Map Globus CLI / search spawn errors to user-facing copy (ENOENT, etc.).
 * Avoids directory-listing summaries — those belong to interpretGlobusLsFailure only.
 * @param {string|Error|null|undefined} rawMessage
 * @returns {{ kind: string, userSummary: string, userDetail: string, technical: string }}
 */
export function interpretGlobusCliFailure(rawMessage) {
  const raw =
    rawMessage && typeof rawMessage === 'object' && rawMessage.message != null
      ? String(rawMessage.message)
      : (rawMessage || '').toString();
  const technical = stripGlobusCliNoise(raw) || raw.trim();
  const lower = raw.toLowerCase();

  if (
    /globus cli not available/i.test(lower)
    || /spawn\s+globus\s+enoent/i.test(lower)
    || (/enoent/i.test(lower) && /globus/i.test(lower))
    || /command not found/i.test(lower)
    || /failed to start login command/i.test(lower)
  ) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE,
      userSummary: 'Globus CLI is not available.',
      userDetail: 'Install Globus CLI (globus-cli) or use a packaged build, then try again.',
      technical,
    };
  }

  // Reuse ls classifier only for CLI-unavailable (incl. empty spawn output).
  const fromLs = interpretGlobusLsFailure(raw);
  if (fromLs.kind === GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE) {
    return fromLs;
  }

  if (fromLs.kind === GLOBUS_LS_FAILURE_KIND.NETWORK) {
    return {
      kind: GLOBUS_LS_FAILURE_KIND.NETWORK,
      userSummary: 'A network error occurred while contacting Globus.',
      userDetail: 'Check your connection and try again.',
      technical,
    };
  }

  const firstLine =
    technical
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean) || '';
  const listFolderNoise = /list folders|list this folder|list directory|matching endpoints/i;
  const detail =
    firstLine
    && firstLine.length < 120
    && !listFolderNoise.test(firstLine)
    && !/^globus could not/i.test(firstLine)
      ? firstLine
      : '';

  return {
    kind: GLOBUS_LS_FAILURE_KIND.UNKNOWN,
    userSummary: 'Globus request failed.',
    userDetail: detail,
    technical,
  };
}

/**
 * Single user-facing string for Globus login failures (never list-folder copy).
 * @param {string|Error|null|undefined} rawMessage
 * @returns {string}
 */
export function formatGlobusLoginError(rawMessage) {
  const interpreted = interpretGlobusCliFailure(rawMessage);
  if (interpreted.kind === GLOBUS_LS_FAILURE_KIND.CLI_UNAVAILABLE) {
    return `${interpreted.userSummary} ${interpreted.userDetail}`.trim();
  }
  if (interpreted.kind === GLOBUS_LS_FAILURE_KIND.NETWORK) {
    return 'Globus sign-in failed due to a network error. Check your connection and try again.';
  }
  const tech = interpreted.technical || '';
  if (/ssl|certificate|tls/i.test(tech)) {
    return 'Globus sign-in failed due to an SSL/certificate problem. Check Disable SSL Verification in Globus settings.';
  }
  if (interpreted.userDetail) {
    return `Globus sign-in failed. ${interpreted.userDetail}`;
  }
  return 'Globus sign-in failed. Try again, or check that Globus CLI is installed and working.';
}
