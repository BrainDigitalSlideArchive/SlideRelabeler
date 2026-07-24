import React from 'react';

/** Official Globus CLI install / usage docs. */
export const GLOBUS_CLI_DOCS_URL = 'https://docs.globus.org/cli/';

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
