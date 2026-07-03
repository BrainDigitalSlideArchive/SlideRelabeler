import React from 'react';
import GridHoverTooltip from './GridHoverTooltip.jsx';
import GridErrorTooltipContent from './GridErrorTooltipContent.jsx';
import { buildThumbnailProtocolUrl } from '../../helpers/thumbnail_helpers.js';

const VIEWER_HINT = 'Click to open in viewer';

function buildTooltipContent(filename) {
  const name = filename != null ? String(filename) : '';
  if (!name.trim()) {
    return <div className="grid-hover-tooltip__hint">{VIEWER_HINT}</div>;
  }
  return (
    <>
      <div className="grid-hover-tooltip__line">{name}</div>
      <div className="grid-hover-tooltip__hint">{VIEWER_HINT}</div>
    </>
  );
}

export default function SourceFileCell({
  filename = '',
  sourcePath = '',
  showThumbnail = false,
  hasRowError = false,
  errorDisplay = null,
}) {
  const displayName = filename != null ? String(filename) : '';
  const hasError = hasRowError;
  const tooltip = hasError
    ? (
      <GridErrorTooltipContent
        summary={errorDisplay?.summary ?? 'This file could not be processed.'}
        details={errorDisplay?.details}
      />
    )
    : buildTooltipContent(displayName);

  let thumbContent;
  if (hasError) {
    thumbContent = (
      <span
        className="__source-file-cell__error-badge"
        aria-label="Slide error — hover for details"
      >
        !
      </span>
    );
  } else if (showThumbnail && sourcePath) {
    thumbContent = (
      <img src={buildThumbnailProtocolUrl(sourcePath)} alt="" />
    );
  } else {
    thumbContent = <span className="__source-file-cell__placeholder">—</span>;
  }

  return (
    <GridHoverTooltip
      content={tooltip}
      show="always"
      variant={hasError ? 'error' : 'default'}
      placement={hasError ? 'below' : 'above'}
      interactive={hasError}
      className={hasError ? '__source-file-cell __source-file-cell--error' : '__source-file-cell'}
      aria-disabled={hasError || undefined}
    >
      <span className="__source-file-cell__thumb" aria-hidden={hasError ? undefined : true}>
        {thumbContent}
      </span>
      <span className="__source-file-cell__name">{displayName}</span>
    </GridHoverTooltip>
  );
}
