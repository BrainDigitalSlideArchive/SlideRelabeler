/**
 * Startup disclaimer gate — versioned text + prompt helpers.
 */

export const DISCLAIMER_TEXT_VERSION = 1;

export const DISCLAIMER_PROMPT_EVERY_LAUNCH = 'everyLaunch';
export const DISCLAIMER_PROMPT_ALLOW_REMEMBER = 'allowRemember';

/** Plain-language gate copy (Help Application section has fuller liability language). */
export const DISCLAIMER_TEXT =
  'SlideRelabeler is an open-source application intended to help remove identifying information from '
  + 'whole slide images, but it provides no guarantee that all patient identifiers are automatically '
  + 'removed. You alone are responsible for ensuring adequate de-identification prior to sharing the '
  + 'resulting files.';

export function normalizeDisclaimer(disclaimer) {
  const d = disclaimer && typeof disclaimer === 'object' ? disclaimer : {};
  const promptMode =
    d.promptMode === DISCLAIMER_PROMPT_ALLOW_REMEMBER
      ? DISCLAIMER_PROMPT_ALLOW_REMEMBER
      : DISCLAIMER_PROMPT_EVERY_LAUNCH;
  const acceptedVersion =
    typeof d.acceptedVersion === 'number' && Number.isFinite(d.acceptedVersion)
      ? d.acceptedVersion
      : null;
  return { promptMode, acceptedVersion };
}

/**
 * @param {{ promptMode?: string, acceptedVersion?: number|null }|null|undefined} disclaimer
 * @returns {boolean}
 */
export function needsDisclaimerPrompt(disclaimer) {
  const { promptMode, acceptedVersion } = normalizeDisclaimer(disclaimer);
  if (promptMode === DISCLAIMER_PROMPT_EVERY_LAUNCH) return true;
  return acceptedVersion !== DISCLAIMER_TEXT_VERSION;
}
