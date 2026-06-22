import React from 'react';
import OverflowTitle from './OverflowTitle.jsx';

function splitPathBasename(pathOrName) {
  const name = String(pathOrName ?? '').split(/[/\\]/).pop() || '';
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { stem: name, ext: '' };
  return { stem: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * Read-only output filename: truncated stem + non-overlapping extension badge.
 */
export default function OutputFilenameDisplay({ stem, ext = '', fullText }) {
  const stemText = stem != null ? String(stem) : '';
  const extText = ext != null ? String(ext) : '';
  const tooltipText = fullText != null ? String(fullText) : `${stemText}${extText}`;

  return (
    <div className="__output-filename">
      <OverflowTitle
        text={tooltipText}
        className="__output-filename__stem"
      >
        {stemText}
      </OverflowTitle>
      {extText ? (
        <span className="__output-filename__ext" aria-hidden="true">
          {extText}
        </span>
      ) : null}
    </div>
  );
}

export { splitPathBasename };
