import React from 'react';

/** Dependent UI under the controls column; left detail rail. */
export default function ConfigDetailPanel({ children, className = '', ...rest }) {
  return (
    <div className={`cfg-detail-panel${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  );
}
