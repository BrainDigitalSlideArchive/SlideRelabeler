import React from 'react';

/** Mono path display; empty state when path is missing. */
export default function ConfigPathChip({
  path,
  emptyLabel = 'No path selected',
  className = '',
}) {
  const hasPath = typeof path === 'string' && path.trim().length > 0;
  const classes = [
    'cfg-path-chip',
    hasPath ? '' : 'cfg-path-chip--empty',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} title={hasPath ? path : undefined}>
      {hasPath ? path : emptyLabel}
    </div>
  );
}
