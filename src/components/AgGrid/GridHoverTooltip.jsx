import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function elementOverflows(el) {
  if (!el) return false;
  return el.scrollWidth > el.clientWidth + 1;
}

function hasTooltipContent(content) {
  if (content == null) return false;
  if (React.isValidElement(content)) return true;
  return String(content).trim().length > 0;
}

/**
 * Custom immediate hover tooltip for file-table cells (portal to body).
 * show: 'always' | 'whenTruncated'
 * variant: 'default' | 'error'
 * placement: 'above' | 'below'
 * interactive: allow hovering/clicking inside tooltip (e.g. expand details)
 */
export default function GridHoverTooltip({
  content = '',
  show = 'always',
  delay = 0,
  variant = 'default',
  placement = 'above',
  interactive = false,
  className = '',
  style,
  children,
  'aria-disabled': ariaDisabled,
}) {
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ariaLabel = typeof content === 'string' ? content : undefined;

  useLayoutEffect(() => () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = () => {
    if (!interactive) {
      setVisible(false);
      return;
    }
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 120);
  };

  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (placement === 'below') {
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
      return;
    }
    setPosition({
      top: rect.top - 4,
      left: rect.left,
    });
  };

  const showTooltip = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, delay);
  };

  const onAnchorMouseEnter = () => {
    const overflows = elementOverflows(anchorRef.current);
    const enabled = hasTooltipContent(content) && (show === 'always' || overflows);
    if (!enabled) return;
    clearHideTimer();
    showTooltip();
  };

  const onAnchorMouseLeave = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    scheduleHide();
  };

  const onTooltipMouseEnter = () => {
    if (!interactive) return;
    clearHideTimer();
    setVisible(true);
  };

  const onTooltipMouseLeave = () => {
    if (!interactive) return;
    scheduleHide();
  };

  const tooltipClassName = [
    'grid-hover-tooltip',
    placement === 'below' ? 'grid-hover-tooltip--below' : '',
    variant === 'error' ? 'grid-hover-tooltip--error' : '',
    interactive ? 'grid-hover-tooltip--interactive' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <span
        ref={anchorRef}
        className={className}
        style={style}
        onMouseEnter={onAnchorMouseEnter}
        onMouseLeave={onAnchorMouseLeave}
        aria-label={ariaLabel || undefined}
        aria-disabled={ariaDisabled || undefined}
      >
        {children}
      </span>
      {visible && hasTooltipContent(content) && createPortal(
        <div
          ref={tooltipRef}
          className={tooltipClassName}
          style={{ top: position.top, left: position.left }}
          role="tooltip"
          onMouseEnter={onTooltipMouseEnter}
          onMouseLeave={onTooltipMouseLeave}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
