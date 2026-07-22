import React from 'react';

/** Accent-left or tinted educational callout. variant: 'accent' | 'tinted' */
export default function ConfigCallout({
  children,
  variant = 'accent',
  className = '',
  role,
}) {
  const classes = [
    'cfg-callout',
    `cfg-callout--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role={role || undefined}>
      {children}
    </div>
  );
}
