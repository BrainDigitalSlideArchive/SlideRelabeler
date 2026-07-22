import React from 'react';

/**
 * Educational info card (Overview naming cards, similar callout-style blocks).
 * Place in a `.cfg-info-card-grid` for responsive columns.
 */
export default function ConfigInfoCard({
  title,
  description,
  children,
  className = '',
}) {
  return (
    <article className={`cfg-info-card${className ? ` ${className}` : ''}`}>
      {title ? <h3 className="cfg-info-card__title">{title}</h3> : null}
      {description ? (
        <div className="cfg-info-card__description">{description}</div>
      ) : null}
      {children}
    </article>
  );
}
