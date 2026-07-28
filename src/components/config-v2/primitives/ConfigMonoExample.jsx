import React from 'react';

/** Mono path / filename example line. */
export default function ConfigMonoExample({ children, className = '', caption }) {
  return (
    <div className={`cfg-mono-example${className ? ` ${className}` : ''}`}>
      <code className="cfg-mono-example__code">{children}</code>
      {caption ? (
        <div className="cfg-mono-example__caption">{caption}</div>
      ) : null}
    </div>
  );
}
