import React from 'react';

export default function ConfigWarnText({ children, className = '', ...rest }) {
  return (
    <p className={`cfg-warn-text${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </p>
  );
}
