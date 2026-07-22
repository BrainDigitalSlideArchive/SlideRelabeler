import React from 'react';

/**
 * H3 block for location cards / nested groups.
 * rail: left accent border
 * location: bordered card surface (DSA / Globus)
 */
export default function ConfigSubsection({
  id,
  title,
  description,
  rail = false,
  location = false,
  children,
  className = '',
}) {
  const classes = [
    'cfg-subsection',
    rail ? 'cfg-subsection--rail' : '',
    location ? 'cfg-subsection--location' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div id={id || undefined} className={classes}>
      {title ? <h3 className="cfg-subsection__title">{title}</h3> : null}
      {description ? (
        <div className="cfg-subsection__description">{description}</div>
      ) : null}
      {children}
    </div>
  );
}
