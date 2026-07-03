import React from 'react';
import GridHoverTooltip from './GridHoverTooltip.jsx';

/**
 * Renders text (or children) with a custom tooltip only when content overflows its cell.
 */
export default function OverflowTitle({ text = '', className = '', style, children }) {
  const displayText = text != null ? String(text) : '';

  return (
    <GridHoverTooltip
      content={displayText}
      show="whenTruncated"
      className={className}
      style={style}
    >
      {children ?? displayText}
    </GridHoverTooltip>
  );
}
