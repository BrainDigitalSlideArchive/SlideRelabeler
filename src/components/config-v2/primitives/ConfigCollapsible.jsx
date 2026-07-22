import React, { useId, useState } from 'react';

/**
 * Expand header + body (glossary, Advanced toggles).
 * subtitle: secondary line under title (collapsed + expanded).
 * panelId: optional id for aria-controls / deep links.
 */
export default function ConfigCollapsible({
  title,
  subtitle,
  open: openProp,
  onToggle,
  defaultOpen = false,
  children,
  className = '',
  panelId,
}) {
  const controlled = openProp != null;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlled ? openProp : internalOpen;
  const autoId = useId();
  const bodyId = panelId || autoId;

  function handleToggle() {
    if (controlled) {
      onToggle?.(!openProp);
    } else {
      setInternalOpen((v) => !v);
      onToggle?.(!open);
    }
  }

  const classes = [
    'cfg-collapsible',
    open ? 'cfg-collapsible--open' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button
        type="button"
        className="cfg-collapsible__header"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={handleToggle}
      >
        <span className="cfg-collapsible__chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        <span className="cfg-collapsible__heading">
          <span className="cfg-collapsible__title">{title}</span>
          {subtitle ? (
            <span className="cfg-collapsible__subtitle">{subtitle}</span>
          ) : null}
        </span>
      </button>
      {open ? (
        <div id={bodyId} className="cfg-collapsible__body">
          {children}
        </div>
      ) : null}
    </div>
  );
}
