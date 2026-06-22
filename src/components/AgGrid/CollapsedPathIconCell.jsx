import React from 'react';
import GridHoverTooltip from './GridHoverTooltip.jsx';

function FolderGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M2 4.5h4l1.5 1.5H14v7H2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Narrow path column: folder icon with full-path custom tooltip on hover.
 */
export default function CollapsedPathIconCell({
  path = '',
  emptyLabel = '',
  className = '',
  glyphClassName = '__source-directory__glyph',
}) {
  const pathText = path != null ? String(path).trim() : '';
  const tooltip = pathText || emptyLabel;

  return (
    <GridHoverTooltip
      content={tooltip}
      show={tooltip ? 'always' : 'whenTruncated'}
      className={`__collapsed-path-icon-cell ${className}`.trim()}
    >
      <FolderGlyph className={glyphClassName} />
    </GridHoverTooltip>
  );
}
