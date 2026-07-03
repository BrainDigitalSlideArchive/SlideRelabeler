import React from 'react';

import HelpIconPopover from '../controls/HelpIconPopover';
import { describeIconConfig } from '../../helpers/label_composition_summaries';
import { LABEL_ICON_MISSING_DETAIL } from '../../helpers/label_composition_issues.js';

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

  return (
    <div
      className={[
        'label-image-file-row',
        inactive ? 'label-image-file-row--inactive' : '',
      ].filter(Boolean).join(' ')}
      aria-disabled={inactive || undefined}
    >
      {!hasFile ? (
        <>
          <button
            type="button"
            className="label-image-file-row__load-btn"
            disabled={controlsDisabled}
            onClick={onSelectFile}
          >
            Load
          </button>
          {issueMessage && (
            <>
              <HelpIconPopover
                helpLabel="Missing image file"
                variant="warning"
                disabled={controlsDisabled}
              >
                {LABEL_ICON_MISSING_DETAIL}
              </HelpIconPopover>
              <span className="label-image-file-row__issue" role="status">
                {issueMessage}
              </span>
            </>
          )}
        </>
      ) : (
        <>
          <span className="label-image-file-row__name" title={iconPath}>
            {filename}
          </span>
          <button
            type="button"
            className="label-image-file-row__icon-action"
            disabled={controlsDisabled}
            onClick={onClear}
            aria-label="Clear image"
          >
            <i className="fi fi-rr-trash-xmark" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
