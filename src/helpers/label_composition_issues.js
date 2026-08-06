// helpers/label_composition_issues.js — incomplete label composition warnings for config UI.

import { isMultilineLabelText } from './label_text_display.js';
import { LABEL_ICON_UNREADABLE_SUMMARY } from './label_icon_batch.js';

export const LABEL_ICON_MISSING_SUMMARY = 'No image selected.';

export const LABEL_ICON_MISSING_DETAIL = (
  'Although Image is selected, an actual image file still needs to be provided. '
  + 'Otherwise, no image will be rendered onto the label.'
);

export { LABEL_ICON_UNREADABLE_SUMMARY, LABEL_ICON_UNREADABLE_DETAIL } from './label_icon_batch.js';

export const LABEL_QR_MULTILINE_SUMMARY = (
  'Multiline labels are not encoded as QR. Slides with line breaks in Label will omit the QR code.'
);

/**
 * @param {object} labelConfig
 * @param {{ labelText?: string, qrPayload?: string }} resolved
 * @param {string|null|undefined} iconPath
 * @param {{ iconReadable?: boolean|null }} [options]
 *   When `iconReadable === false`, path is set but Electron cannot read the file.
 *   Omit / null while the async check is pending so we do not flash a false warning.
 * @returns {Array<{ feature: 'icon'|'qr'|'text', message: string }>}
 */
export function getLabelCompositionIssues(
  labelConfig,
  { labelText, qrPayload } = {},
  iconPath,
  options = {},
) {
  const issues = [];

  if (labelConfig?.add_icon) {
    const path = String(iconPath ?? '').trim();
    if (!path) {
      issues.push({
        feature: 'icon',
        message: LABEL_ICON_MISSING_SUMMARY,
      });
    } else if (options.iconReadable === false) {
      issues.push({
        feature: 'icon',
        message: LABEL_ICON_UNREADABLE_SUMMARY,
      });
    }
  }

  if (labelConfig?.add_qr) {
    const qrMode = labelConfig.qrContent?.mode ?? labelConfig.qrDefault;
    const qrPattern = labelConfig.qrContent?.pattern ?? labelConfig.qrPattern ?? '';
    if (qrMode === 'label_text' && isMultilineLabelText(labelText)) {
      issues.push({
        feature: 'qr',
        message: LABEL_QR_MULTILINE_SUMMARY,
      });
    } else if (qrMode === 'pattern' && !String(qrPattern).trim()) {
      issues.push({
        feature: 'qr',
        message: 'QR is enabled but the custom pattern is empty. Labels will omit the QR code until you enter a pattern.',
      });
    } else if (!String(qrPayload ?? '').trim()) {
      issues.push({
        feature: 'qr',
        message: 'QR is enabled but the preview row has no QR content. Labels will omit the QR code for rows without content.',
      });
    }
  }

  if (
    labelConfig?.add_text
    && !String(labelText ?? '').trim()
    && (labelConfig.labelText?.mode ?? labelConfig.textDefault ?? 'output_name') !== 'none'
  ) {
    issues.push({
      feature: 'text',
      message: 'Text is enabled but the preview row has no label text. Labels will omit text for rows without content.',
    });
  }

  return issues;
}
