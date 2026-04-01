import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

import './InputText.scss';

function get_input_text_class(disabled, error) {
  let class_name = "__input-text";
  if (disabled) {
    class_name += " _disabled";
  }
  if (error) {
    class_name += " _error";
  }
  return class_name;
}

function InputText(props) {
  const { label, value, onChange, disabled, type, error, input_style, tooltip, placeholder, variant } = props;
  const rootClass = variant === 'onLight' ? 'InputText InputText--onLight' : 'InputText';

  const popoverId = useId();
  const rootRef = useRef(null);
  const iconRef = useRef(null);
  const popoverRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);

  const helpLabel = useMemo(() => {
    const base = typeof label === 'string' ? label : 'this field';
    return `Help for ${base}`;
  }, [label]);

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

    // Temporarily ensure we can measure it.
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

    // Prefer right; else left; else below.
    if (spaceRight < 200 && spaceLeft >= 200) {
      left = iconRect.left - gap - width;
      top = iconRect.top;
    } else if (spaceRight < 200 && spaceLeft < 200) {
      left = iconRect.left;
      top = iconRect.bottom + gap;
    }

    // Clamp within bounds.
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

    // Position on open; also update on any scroll/resize events.
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

  return (
    <div ref={rootRef} className={rootClass}>
      <div className="__label-wrap">
        <label className="__label-text">{label}</label>
        {tooltip && (
          <span className="__help-wrap">
            <button
              type="button"
              ref={iconRef}
              className="__help-icon"
              aria-label={helpLabel}
              aria-haspopup="dialog"
              aria-expanded={helpOpen}
              aria-controls={popoverId}
              onClick={() => setHelpOpen(v => !v)}
              disabled={disabled}
            >
              i
            </button>
            <div
              id={popoverId}
              ref={popoverRef}
              className={helpOpen ? "__help-popover _visible" : "__help-popover"}
              role="dialog"
              aria-label={helpLabel}
              style={popoverStyle || undefined}
            >
              {tooltip}
            </div>
          </span>
        )}
      </div>
      <input
        style={input_style ? input_style : {}}
        type={type ? type : "text"}
        placeholder={placeholder}
        disabled={disabled}
        className={get_input_text_class(disabled, error)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default InputText;