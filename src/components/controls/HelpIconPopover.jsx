import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

import './HelpIconPopover.scss';

/**
 * “i” icon that opens a fixed-position popover (same behavior as InputText tooltips).
 */
function HelpIconPopover(props) {
  const { children, helpLabel, disabled, variant = 'default' } = props;

  const popoverId = useId();
  const rootRef = useRef(null);
  const iconRef = useRef(null);
  const popoverRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);

  const ariaLabel = useMemo(() => helpLabel || 'Help', [helpLabel]);

  function findBoundsElement() {
    const root = rootRef.current;
    if (!root) return null;
    return (
      root.closest('.__modal') ||
      root.closest('.__content') ||
      root.closest('.__config-controls') ||
      root.parentElement ||
      null
    );
  }

  function computeAndSetPopoverPosition() {
    const icon = iconRef.current;
    const popover = popoverRef.current;
    if (!icon || !popover) return;

    const boundsEl = findBoundsElement();
    const boundsRect = boundsEl ? boundsEl.getBoundingClientRect() : document.documentElement.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();

    const popoverRect = popover.getBoundingClientRect();
    const margin = 8;
    const gap = 8;

    const maxWidth = Math.max(240, Math.min(640, boundsRect.width - margin * 2));
    const width = Math.min(popoverRect.width || maxWidth, maxWidth);
    const height = popoverRect.height;

    const spaceRight = boundsRect.right - iconRect.right - gap - margin;
    const spaceLeft = iconRect.left - boundsRect.left - gap - margin;

    let left = iconRect.right + gap;
    let top = iconRect.top;

    if (spaceRight < 200 && spaceLeft >= 200) {
      left = iconRect.left - gap - width;
      top = iconRect.top;
    } else if (spaceRight < 200 && spaceLeft < 200) {
      left = iconRect.left;
      top = iconRect.bottom + gap;
    }

    left = Math.min(Math.max(left, boundsRect.left + margin), boundsRect.right - width - margin);
    top = Math.min(Math.max(top, boundsRect.top + margin), boundsRect.bottom - height - margin);

    setPopoverStyle({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      maxWidth: `${Math.round(maxWidth)}px`,
    });
  }

  useEffect(() => {
    if (!helpOpen) return;

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setHelpOpen(false);
      }
    }

    function onMouseDown(e) {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) {
        setHelpOpen(false);
      }
    }

    const raf = requestAnimationFrame(() => computeAndSetPopoverPosition());
    const onViewportChange = () => computeAndSetPopoverPosition();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', onViewportChange);
    document.addEventListener('scroll', onViewportChange, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('scroll', onViewportChange, true);
    };
  }, [helpOpen]);

  useEffect(() => {
    if (!helpOpen) {
      setPopoverStyle(null);
    }
  }, [helpOpen]);

  const rootClass =
    variant === 'onLight'
      ? 'HelpIconPopover HelpIconPopover--onLight'
      : 'HelpIconPopover';

  return (
    <span ref={rootRef} className={rootClass}>
      <button
        type="button"
        ref={iconRef}
        className="HelpIconPopover__icon"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={helpOpen}
        aria-controls={popoverId}
        onClick={() => setHelpOpen((v) => !v)}
        disabled={disabled}
      >
        i
      </button>
      <div
        id={popoverId}
        ref={popoverRef}
        className={helpOpen ? 'HelpIconPopover__popover HelpIconPopover__popover--visible' : 'HelpIconPopover__popover'}
        role="dialog"
        aria-label={ariaLabel}
        style={popoverStyle || undefined}
      >
        {children}
      </div>
    </span>
  );
}

export default HelpIconPopover;
