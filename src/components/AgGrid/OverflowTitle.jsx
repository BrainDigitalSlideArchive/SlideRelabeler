import React from 'react';
import GridHoverTooltip from './GridHoverTooltip.jsx';

/**
 * Renders text (or children) with a custom tooltip only when content overflows its cell.
 * @param {string} [tooltipContent] - optional raw tooltip body (defaults to `text`); use for
 *   multiline source while displaying a collapsed single-line `text`.
 * @param {'always'|'whenTruncated'} [show]
 */
export default function OverflowTitle({
  text = '',
  className = '',
  style,
  children,
  tooltipContent,
  show = 'whenTruncated',
}) {
  const displayText = text != null ? String(text) : '';
  const tip = tooltipContent != null ? tooltipContent : displayText;

  return (
    <GridHoverTooltip
      content={tip}
      show={show}
      className={className}
      style={style}
    >
      {children ?? displayText}
    </GridHoverTooltip>
  );
}
