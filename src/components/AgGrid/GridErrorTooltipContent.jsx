import React, { useState } from 'react';

export default function GridErrorTooltipContent({
  title = 'Cannot process this file',
  summary,
  details = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const technical = details != null && String(details).trim() ? String(details).trim() : null;
  const showExpand = technical && technical !== summary;

  return (
    <>
      <div className="grid-hover-tooltip__title">{title}</div>
      <div className="grid-hover-tooltip__line">{summary}</div>
      {showExpand && (
        <>
          <button
            type="button"
            className="grid-hover-tooltip__expand"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          >
            {expanded ? 'Hide technical details' : 'Show technical details'}
          </button>
          {expanded && (
            <pre className="grid-hover-tooltip__details">{technical}</pre>
          )}
        </>
      )}
      <div className="grid-hover-tooltip__hint">This slide cannot be opened in the viewer.</div>
    </>
  );
}
