import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  computePopoverPosition,
  findPopoverBoundsElement,
} from '../../helpers/popover_position.js';

import './HelpIconPopover.scss';

/**
 * “i” icon that opens a fixed-position popover anchored to the trigger.
 */
function HelpIconPopover(props) {
  const { children, helpLabel, disabled, variant = 'default', glyph } = props;

  const popoverId = useId();
  const rootRef = useRef(null);
  const iconRef = useRef(null);
  const popoverRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);

  const ariaLabel = useMemo(() => helpLabel || 'Help', [helpLabel]);

  function updatePopoverPosition() {
    const icon = iconRef.current;
    const popover = popoverRef.current;
    if (!icon || !popover) return;

    const boundsEl = findPopoverBoundsElement(rootRef.current);
    const style = computePopoverPosition(icon, popover, boundsEl);
    if (style) {
      setPopoverStyle(style);
    }
  }

  useLayoutEffect(() => {
    if (!helpOpen) return undefined;

    updatePopoverPosition();

    const onViewportChange = () => updatePopoverPosition();
    window.addEventListener('resize', onViewportChange);
    document.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('scroll', onViewportChange, true);
    };
  }, [helpOpen, children]);

  useEffect(() => {
    if (!helpOpen) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setHelpOpen(false);
      }
    }

    function onMouseDown(e) {
      const root = rootRef.current;
      const popover = popoverRef.current;
      if (!root) return;
      if (root.contains(e.target) || popover?.contains(e.target)) return;
      setHelpOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [helpOpen]);

  useEffect(() => {
    if (!helpOpen) {
      setPopoverStyle(null);
    }
  }, [helpOpen]);

  const rootClass = [
    'HelpIconPopover',
    variant === 'onLight' ? 'HelpIconPopover--onLight' : '',
    variant === 'warning' ? 'HelpIconPopover--warning' : '',
  ].filter(Boolean).join(' ');

  const iconGlyph = glyph ?? (variant === 'warning' ? '!' : 'i');

  const popoverClassName = helpOpen && popoverStyle
    ? 'HelpIconPopover__popover HelpIconPopover__popover--visible'
    : 'HelpIconPopover__popover';

  const popoverNode = helpOpen ? (
    <div
      id={popoverId}
      ref={popoverRef}
      className={popoverClassName}
      role="dialog"
      aria-label={ariaLabel}
      style={
        popoverStyle || {
          position: 'fixed',
          left: '-9999px',
          top: '0',
          visibility: 'hidden',
          pointerEvents: 'none',
        }
      }
    >
      {children}
    </div>
  ) : null;

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
        {iconGlyph}
      </button>
      {popoverNode && createPortal(popoverNode, document.body)}
    </span>
  );
}

export default HelpIconPopover;
