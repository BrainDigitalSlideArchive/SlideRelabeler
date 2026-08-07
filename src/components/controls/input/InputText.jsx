import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  computePopoverPosition,
  findPopoverBoundsElement,
} from '../../../helpers/popover_position.js';

import './InputText.scss';

function get_input_text_class(disabled, error, readOnly) {
  let class_name = "__input-text";
  if (disabled) {
    class_name += " _disabled";
  } else if (readOnly) {
    class_name += " _readonly";
  }
  if (error) {
    class_name += " _error";
  }
  return class_name;
}

function InputText(props) {
  const { label, value, onChange, disabled, readOnly, type, error, input_style, tooltip, placeholder, variant, compact, omitLabel, ariaLabel, inputId, onKeyPress, onBlur } = props;
  // Light is the default. `onLight` is a no-op alias; `onDark` opts into dark-modal chrome.
  let rootClass = variant === 'onDark' ? 'InputText InputText--onDark' : 'InputText';
  if (compact) rootClass += ' InputText--compact';
  if (omitLabel) rootClass += ' InputText--controlOnly';

  const popoverId = useId();
  const rootRef = useRef(null);
  const iconRef = useRef(null);
  const popoverRef = useRef(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);

  const helpLabel = useMemo(() => {
    const base =
      typeof label === 'string' && label
        ? label
        : typeof ariaLabel === 'string' && ariaLabel
          ? ariaLabel
          : 'this field';
    return `Help for ${base}`;
  }, [label, ariaLabel]);

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
  }, [helpOpen, tooltip]);

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

  const helpPopover = helpOpen && tooltip ? (
    <div
      id={popoverId}
      ref={popoverRef}
      className={helpOpen && popoverStyle ? '__help-popover _visible' : '__help-popover'}
      role="dialog"
      aria-label={helpLabel}
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
      {tooltip}
    </div>
  ) : null;

  const helpButton = tooltip && (
    <span className="__help-wrap">
      <button
        type="button"
        ref={iconRef}
        className="__help-icon"
        aria-label={helpLabel}
        aria-haspopup="dialog"
        aria-expanded={helpOpen}
        aria-controls={popoverId}
        onClick={() => setHelpOpen((v) => !v)}
        disabled={disabled}
      >
        i
      </button>
      {helpPopover && createPortal(helpPopover, document.body)}
    </span>
  );

  return (
    <div ref={rootRef} className={rootClass}>
      {!omitLabel && (
        <div className="__label-wrap">
          <label className="__label-text">{label}</label>
          {helpButton}
        </div>
      )}
      {omitLabel && (
        <div className="InputText__control-row">
          {helpButton}
          <input
            id={inputId || undefined}
            style={input_style ? input_style : {}}
            type={type ? type : 'text'}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={get_input_text_class(disabled, error, readOnly)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={onKeyPress}
            onBlur={onBlur}
            aria-label={ariaLabel || undefined}
          />
        </div>
      )}
      {!omitLabel && (
        <input
          id={inputId || undefined}
          style={input_style ? input_style : {}}
          type={type ? type : 'text'}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={get_input_text_class(disabled, error, readOnly)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}

export default InputText;