import React from 'react';

/** Horizontal rule inside a panel / section. */
export default function ConfigDivider({ className = '' }) {
  return <hr className={`cfg-divider${className ? ` ${className}` : ''}`} />;
}
