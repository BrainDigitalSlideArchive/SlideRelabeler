import React from 'react';

/**
 * label | controls grid. Labels optically align with chip tops (align-self: start).
 */
export default function ConfigLabeledRow({
  label,
  labelId,
  htmlFor,
  children,
  className = '',
}) {
  return (
    <div className={`cfg-labeled-row${className ? ` ${className}` : ''}`}>
      {typeof label === 'string' ? (
        <label
          className="cfg-labeled-row__label"
          id={labelId || undefined}
          htmlFor={htmlFor || undefined}
        >
          {label}
        </label>
      ) : (
        <div className="cfg-labeled-row__label" id={labelId || undefined}>
          {label}
        </div>
      )}
      <div className="cfg-labeled-row__controls">{children}</div>
    </div>
  );
}
