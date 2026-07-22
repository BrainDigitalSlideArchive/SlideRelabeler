import React from 'react';

/** H4 setting header + muted description. quiet: less visual weight. */
export default function ConfigSettingHeader({
  id,
  title,
  description,
  quiet = false,
  className = '',
}) {
  const classes = [
    'cfg-setting-header',
    quiet ? 'cfg-setting-header--quiet' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div id={id || undefined} className={classes}>
      {title ? <h4 className="cfg-setting-header__title">{title}</h4> : null}
      {description ? (
        <div className="cfg-setting-header__description">{description}</div>
      ) : null}
    </div>
  );
}
