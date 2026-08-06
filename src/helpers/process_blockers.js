// helpers/process_blockers.js — main-window Process button gate messages.

import {
  LABEL_ICON_MISSING_DETAIL,
  LABEL_ICON_MISSING_SUMMARY,
  LABEL_ICON_UNREADABLE_DETAIL,
  LABEL_ICON_UNREADABLE_SUMMARY,
} from './label_icon_batch.js';

/** Single-line homepage guidance (no separate title/detail pair). */
export const DELIVERY_NONE_ENABLED_SUMMARY =
  'Turn on Save locally and/or Upload in Output delivery above.';

export const DELIVERY_LOCAL_FOLDER_SUMMARY =
  'Choose a folder for all files, or set Copy To per row.';

/**
 * @param {number} count — loaded file rows
 * @param {object} outputReadiness — from selectOutputReadiness
 * @param {{ iconReadable?: boolean|null, iconMissing?: boolean }} [options]
 * @returns {string} Empty when Process can proceed (aside from processing/disable_changes).
 */
export function getProcessBlockerMessage(count, outputReadiness, options = {}) {
  if (count === 0) {
    return 'Select files to inspect and process';
  }

  if (options.iconMissing) {
    return LABEL_ICON_MISSING_SUMMARY;
  }

  if (options.iconReadable === false) {
    return LABEL_ICON_UNREADABLE_SUMMARY;
  }

  if (outputReadiness?.patternValidation?.blocking) {
    return outputReadiness.patternValidation.messages?.[0]
      || 'Fix pattern column references before processing.';
  }

  if (!outputReadiness?.anyDeliveryEnabled) {
    return DELIVERY_NONE_ENABLED_SUMMARY;
  }

  if (outputReadiness.localEnabled && !outputReadiness.localConfigured) {
    return DELIVERY_LOCAL_FOLDER_SUMMARY;
  }

  if (outputReadiness.uploadEnabled && !outputReadiness.uploadConfigured) {
    const blocker = outputReadiness.uploadReadiness?.blockers?.[0];
    return blocker || 'Finish upload connection setup before processing';
  }

  return '';
}

/**
 * Longer popover copy when it adds information beyond the short message.
 * Returns the same string as the message when a single line is enough
 * (App renders one paragraph in that case).
 */
export function getProcessBlockerDetail(count, outputReadiness, options = {}) {
  if (count > 0 && options.iconMissing) {
    return LABEL_ICON_MISSING_DETAIL;
  }
  if (count > 0 && options.iconReadable === false) {
    return LABEL_ICON_UNREADABLE_DETAIL;
  }
  return getProcessBlockerMessage(count, outputReadiness, options);
}

/**
 * Config section to open from the Process blocker popover, if any.
 * Homepage delivery toggles/folder pickers do not deep-link to Settings.
 * @returns {string|null}
 */
export function getProcessBlockerSettingsSection(count, outputReadiness, options = {}) {
  if (count === 0) return null;
  if (options.iconMissing || options.iconReadable === false) return 'config-slide-label';
  if (outputReadiness?.patternValidation?.blocking) return 'config-output-filename';
  // Enable toggles + local folder/Copy To are on the main Output delivery panel.
  if (!outputReadiness?.anyDeliveryEnabled) return null;
  if (outputReadiness.localEnabled && !outputReadiness.localConfigured) return null;
  // Upload connection / method setup often needs Configuration.
  if (outputReadiness.uploadEnabled && !outputReadiness.uploadConfigured) {
    return 'config-output-delivery';
  }
  return null;
}

/**
 * True when Process should stay disabled for readiness / icon (not counting processing).
 */
export function isProcessReadinessBlocked(count, outputReadiness, options = {}) {
  if (count === 0) return true;
  if (options.iconMissing) return true;
  if (options.iconReadable === false) return true;
  if (!outputReadiness?.processReady) return true;
  return false;
}

/**
 * Warning affordance (not the empty-table hint).
 */
export function isProcessBlockerWarning(count, message) {
  return count > 0 && Boolean(message);
}
