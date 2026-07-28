import React from 'react';

/** Bordered light surface wrapping a section body. */
export default function ConfigSectionPanel({ children, className = '' }) {
  return (
    <div className={`cfg-section-panel${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
