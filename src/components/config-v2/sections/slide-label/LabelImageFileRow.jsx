import React from 'react';

import Button from '../../../controls/button/Button';
import HelpIconPopover from '../../../controls/HelpIconPopover';
import ConfigTextButton from '../../primitives/ConfigTextButton';
import { describeIconConfig } from '../../../../helpers/label_composition_summaries';
import {
  LABEL_ICON_MISSING_DETAIL,
  LABEL_ICON_MISSING_SUMMARY,
  LABEL_ICON_UNREADABLE_DETAIL,
} from '../../../../helpers/label_composition_issues.js';

/**
 * Icon Load / Clear row (config-v2 kit).
 */
export default function LabelImageFileRow({
  iconPath = '',
  disabled = false,
  inactive = false,
  issueMessage,
  onSelectFile,
  onClear,
}) {
  const controlsDisabled = disabled || inactive;
  const filename = describeIconConfig(iconPath);
  const hasFile = Boolean(iconPath);
  const issueDetail = issueMessage === LABEL_ICON_MISSING_SUMMARY
    ? LABEL_ICON_MISSING_DETAIL
    : LABEL_ICON_UNREADABLE_DETAIL;
  const issueHelpLabel = issueMessage === LABEL_ICON_MISSING_SUMMARY
    ? 'Missing image file'
    : 'Unreadable image file';

  return (
    <div
      className={[
        'cfg-label-icon-row',
        inactive ? 'cfg-labeled-row--inactive' : '',
      ].filter(Boolean).join(' ')}
      aria-disabled={inactive || undefined}
    >
      {!hasFile ? (
        <>
          <Button
            variant="onLight"
            text="Load…"
            disabled={controlsDisabled}
            onClick={onSelectFile}
          />
          {issueMessage ? (
            <>
              <HelpIconPopover
                helpLabel={issueHelpLabel}
                variant="warning"
                disabled={controlsDisabled}
              >
                {issueDetail}
              </HelpIconPopover>
              <span className="cfg-label-icon-row__issue" role="status">
                {issueMessage}
              </span>
            </>
          ) : null}
        </>
      ) : (
        <>
          <span className="cfg-label-icon-row__name" title={iconPath}>
            {filename}
          </span>
          <ConfigTextButton
            disabled={controlsDisabled}
            onClick={onClear}
            aria-label="Clear image"
          >
            Clear
          </ConfigTextButton>
          {issueMessage ? (
            <>
              <HelpIconPopover
                helpLabel={issueHelpLabel}
                variant="warning"
                disabled={controlsDisabled}
              >
                {issueDetail}
              </HelpIconPopover>
              <span className="cfg-label-icon-row__issue" role="status">
                {issueMessage}
              </span>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
