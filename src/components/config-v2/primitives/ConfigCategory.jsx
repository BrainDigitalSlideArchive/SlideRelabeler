import React from 'react';

/** Mid-level category (e.g. Save locally / Upload). */
export default function ConfigCategory({
  id,
  title,
  description,
  children,
  className = '',
}) {
  return (
    <div id={id || undefined} className={`cfg-category${className ? ` ${className}` : ''}`}>
      {title ? <h3 className="cfg-category__title">{title}</h3> : null}
      {description ? (
        <div className="cfg-category__description">{description}</div>
      ) : null}
      {children}
    </div>
  );
}
