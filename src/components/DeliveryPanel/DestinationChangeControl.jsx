import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  computePopoverPosition,
  findPopoverBoundsElement,
} from '../../helpers/popover_position.js';
import GridHoverTooltip from '../AgGrid/GridHoverTooltip';

import './DestinationChangeControl.scss';

/**
 * Shared pencil control: durable (Config) vs temporary (session) destination change.
 *
 * - If `renderTemporary` is provided, temporary menu item opens an inline panel.
 * - If `onTemporary` is provided without `renderTemporary`, temporary closes the
 *   popover and invokes the callback (e.g. open a picker modal).
 */
export default function DestinationChangeControl({
  disabled = false,
  tooltip = 'Change destination',
  ariaLabel = 'Change destination',
  dialogLabel = 'Change destination',
  showHostInline = false,
  hostLabel = '',
  hostTitle = '',
  durableMenuLabel = 'Update default in Configuration.',
  temporaryMenuLabel = 'Use a different destination this time only.',
  onDurable,
  onTemporary,
  renderTemporary,
}) {
  const popoverId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('menu'); // menu | temporary
  const [popoverStyle, setPopoverStyle] = useState(null);

  const hasInlineTemporary = typeof renderTemporary === 'function';

  function close() {
    setOpen(false);
    setMode('menu');
  }

  function updatePopoverPosition() {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const boundsEl = findPopoverBoundsElement(rootRef.current);
    const style = computePopoverPosition(trigger, popover, boundsEl);
    if (style) setPopoverStyle(style);
  }

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePopoverPosition();
    const onViewportChange = () => updatePopoverPosition();
    window.addEventListener('resize', onViewportChange);
    document.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, mode]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') close();
    }
    function onMouseDown(e) {
      const root = rootRef.current;
      const popover = popoverRef.current;
      if (!root) return;
      if (root.contains(e.target) || popover?.contains(e.target)) return;
      close();
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  function handleDurable() {
    close();
    onDurable?.();
  }

  function handleTemporaryMenu() {
    if (hasInlineTemporary) {
      setMode('temporary');
      return;
    }
    close();
    onTemporary?.();
  }

  const popoverNode = open ? (
    <div
      id={popoverId}
      ref={popoverRef}
      className={`destination-change__popover${popoverStyle ? ' _visible' : ''}`}
      role="dialog"
      aria-label={dialogLabel}
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
      {mode === 'menu' ? (
        <div className="destination-change__menu">
          <button type="button" className="destination-change__menu-item" onClick={handleDurable}>
            {durableMenuLabel}
          </button>
          <button
            type="button"
            className="destination-change__menu-item"
            onClick={handleTemporaryMenu}
          >
            {temporaryMenuLabel}
          </button>
        </div>
      ) : (
        renderTemporary?.({
          close,
          backToMenu: () => setMode('menu'),
          popoverId,
        })
      )}
    </div>
  ) : null;

  return (
    <span ref={rootRef} className="destination-change">
      {showHostInline ? (
        <span className="destination-change__host" title={hostTitle || hostLabel}>
          {hostLabel || hostTitle}
        </span>
      ) : null}
      <GridHoverTooltip content={tooltip} show="always" placement="below">
        <button
          type="button"
          ref={triggerRef}
          className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={popoverId}
          disabled={disabled}
          onClick={() => {
            setMode('menu');
            setOpen((v) => !v);
          }}
        >
          <i className="fi fi-rr-pencil" aria-hidden="true" />
        </button>
      </GridHoverTooltip>
      {popoverNode && createPortal(popoverNode, document.body)}
    </span>
  );
}
