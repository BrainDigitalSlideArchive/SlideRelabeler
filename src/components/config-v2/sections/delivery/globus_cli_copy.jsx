import React from 'react';

/** Official Globus CLI install / usage docs. */
export const GLOBUS_CLI_DOCS_URL = 'https://docs.globus.org/cli/';

/** Official Globus Connect Personal install docs (platform-agnostic landing page). */
export const GCP_DOCS_URL = 'https://docs.globus.org/globus-connect-personal/';

export function GlobusConnectPersonalDocsLink({
  children = 'Globus Connect Personal',
}) {
  return (
    <a href={GCP_DOCS_URL} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * User-facing notice when Globus CLI / tools are missing.
 * Includes a link to Globus’s installation guide.
 */
export function GlobusCliUnavailableMessage({
  trailing = ', or use a packaged SlideRelabeler build that includes them.',
}) {
  return (
    <>
      Globus tools are not available. Install them using the{' '}
      <a href={GLOBUS_CLI_DOCS_URL} target="_blank" rel="noopener noreferrer">
        Globus CLI installation guide
      </a>
      {trailing}
    </>
  );
}

/** Standing Settings copy when local endpoint ID is empty (user is signed in). */
export function GlobusLocalEndpointUnsetMessage() {
  return (
    <>
      This computer’s Globus Connect Personal endpoint ID is not set. Install and run{' '}
      <GlobusConnectPersonalDocsLink />
      , then use Auto-detect or paste the UUID.
    </>
  );
}

/**
 * Auto-detect / local-id failure when Globus Connect Personal is missing or unreadable.
 */
export function GlobusGcpUnavailableMessage() {
  return (
    <>
      Globus Connect Personal does not appear configured on this machine, or the local endpoint
      could not be read. Install and run <GlobusConnectPersonalDocsLink />, then try Auto-detect
      again.
    </>
  );
}
