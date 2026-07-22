import React from 'react';

import HelpIconPopover from '../../controls/HelpIconPopover';

/** Top-level sticky-nav section. `id` is required for deep links / nav scroll. */
export default function ConfigSection({
  id,
  title,
  description,
  help,
  helpLabel,
  children,
  className = '',
}) {
  return (
    <section
      id={id}
      className={`cfg-section${className ? ` ${className}` : ''}`}
    >
      {title ? (
        <h2 className="cfg-section__title">{title}</h2>
      ) : null}
      {(description || help) ? (
        <div className="cfg-section__description">
          {description}
          {help ? (
            <>
              {' '}
              <HelpIconPopover
                helpLabel={helpLabel || (typeof title === 'string' ? `${title} help` : 'Help')}
                variant="onLight"
              >
                {help}
              </HelpIconPopover>
            </>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
