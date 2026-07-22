import React from 'react';

export default function ConfigHelperText({ children, className = '' }) {
  return (
    <p className={`cfg-helper-text${className ? ` ${className}` : ''}`}>
      {children}
    </p>
  );
}
