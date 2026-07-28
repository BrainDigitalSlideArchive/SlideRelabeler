import React from 'react';

/** Link-style tertiary action. */
export default function ConfigTextButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`cfg-text-btn${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
