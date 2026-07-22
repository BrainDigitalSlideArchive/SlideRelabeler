import React from 'react';

/**
 * Label + status + input/body + action (DSA URL, Globus source, etc.).
 * statusTone: 'ok' | 'warn' | 'muted' | 'neutral'
 * compact: control sizes to content so the action sits next to short empty copy
 *   (use fill PathChip/Field without compact when the value should span like an input).
 */
export default function ConfigStatusField({
  label,
  status,
  statusTone = 'neutral',
  children,
  action,
  compact = false,
  className = '',
}) {
  const classes = [
    'cfg-status-field',
    compact ? 'cfg-status-field--compact' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {(label || status) ? (
        <div className="cfg-status-field__header">
          {label ? <div className="cfg-status-field__label">{label}</div> : null}
          {status ? (
            <div className={`cfg-status-field__status cfg-status-field__status--${statusTone}`}>
              {status}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="cfg-status-field__body">
        <div className="cfg-status-field__control">{children}</div>
        {action ? <div className="cfg-status-field__action">{action}</div> : null}
      </div>
    </div>
  );
}
