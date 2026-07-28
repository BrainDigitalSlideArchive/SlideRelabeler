import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import Button from '../controls/button/Button';
import { normalizeGlobusCollectionPath } from '../../helpers/globus_helpers';

import './GlobusUploadPathEditPopover.scss';

function findBoundsElement(root) {
  if (!root) return null;
  return (
    root.closest('.__modal') ||
    root.closest('.__content') ||
    root.closest('.__config-controls') ||
    root.parentElement ||
    null
  );
}

/**
 * Edit button + popover to type a full Globus collection path; Validate calls listDirectory before onApply.
 */
function GlobusUploadPathEditPopover(props) {
  const {
    targetEndpointId,
    collectionPath,
    listDirectoryApi,
    onApply,
    disabled,
  } = props;

  const rootRef = useRef(null);
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);

  const api = listDirectoryApi || (typeof window !== 'undefined' && window.electronAPI?.globusListDirectory);

  const computePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;

    const boundsEl = findBoundsElement(rootRef.current);
    const boundsRect = boundsEl
      ? boundsEl.getBoundingClientRect()
      : document.documentElement.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const margin = 8;
    const gap = 8;
    const maxWidth = Math.max(260, Math.min(520, boundsRect.width - margin * 2));
    const width = Math.min(popoverRect.width || maxWidth, maxWidth);
    const height = popoverRect.height;
    const spaceRight = boundsRect.right - anchorRect.right - gap - margin;
    const spaceLeft = anchorRect.left - boundsRect.left - gap - margin;

    let left = anchorRect.right + gap;
    let top = anchorRect.top;
    if (spaceRight < 200 && spaceLeft >= 200) {
      left = anchorRect.left - gap - width;
      top = anchorRect.top;
    } else if (spaceRight < 200 && spaceLeft < 200) {
      left = anchorRect.left;
      top = anchorRect.bottom + gap;
    }

    left = Math.min(Math.max(left, boundsRect.left + margin), boundsRect.right - width - margin);
    top = Math.min(Math.max(top, boundsRect.top + margin), boundsRect.bottom - height - margin);

    setPopoverStyle({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      maxWidth: `${Math.round(maxWidth)}px`,
    });
  }, []);

  const openPopover = useCallback(() => {
    if (disabled || !targetEndpointId) return;
    const initial =
      (collectionPath && String(collectionPath).trim()) ||
      `${String(targetEndpointId).trim()}:/`;
    setDraft(initial);
    setError(null);
    setOpen(true);
  }, [disabled, targetEndpointId, collectionPath]);

  const closePopover = useCallback(() => {
    setOpen(false);
    setError(null);
    setValidating(false);
    setPopoverStyle(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(() => computePosition());
    const onViewportChange = () => computePosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        closePopover();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    function onPointerDown(e) {
      const root = rootRef.current;
      if (!root || root.contains(e.target)) return;
      closePopover();
    }
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, computePosition, closePopover]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => computePosition());
    return () => cancelAnimationFrame(raf);
  }, [open, draft, error, computePosition]);

  async function handleValidate() {
    setError(null);
    const trimmed = (draft || '').trim();
    const expectedId = String(targetEndpointId || '').trim();
    if (!expectedId) {
      setError('No endpoint is selected.');
      return;
    }
    const normalized = normalizeGlobusCollectionPath(trimmed);
    if (!normalized) {
      setError('Enter a full path like endpointUuid:/folder/subfolder/');
      return;
    }
    const ep = normalized.split(':')[0]?.trim() || '';
    if (ep.toLowerCase() !== expectedId.toLowerCase()) {
      setError('The path must start with the current endpoint UUID.');
      return;
    }
    if (!api) {
      setError('Globus directory API is not available.');
      return;
    }
    setValidating(true);
    try {
      const response = await api(normalized);
      if (response && response[0]) {
        onApply(normalized);
        closePopover();
      } else {
        const err = response?.[1] || {};
        setError(err.message || 'Could not access that path on the endpoint.');
      }
    } catch (e) {
      setError(e?.message || 'Validation request failed.');
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="GlobusUploadPathEditPopover" ref={rootRef}>
      <button
        type="button"
        ref={anchorRef}
        className="GlobusUploadPathEditPopover__editBtn"
        aria-expanded={open}
        aria-controls={popoverId}
        disabled={disabled || !targetEndpointId}
        onClick={() => (open ? closePopover() : openPopover())}
      >
        Edit
      </button>
      {open && (
        <div
          id={popoverId}
          ref={popoverRef}
          className="GlobusUploadPathEditPopover__panel"
          style={popoverStyle || undefined}
          role="dialog"
          aria-label="Edit upload path"
        >
          <p className="GlobusUploadPathEditPopover__help">
            Full Globus collection path: <code>endpointUuid:/path/to/folder/</code>
          </p>
          <textarea
            className="GlobusUploadPathEditPopover__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            spellCheck={false}
            disabled={validating}
            aria-invalid={!!error}
          />
          {error && <div className="GlobusUploadPathEditPopover__error">{error}</div>}
          <div className="GlobusUploadPathEditPopover__actions">
            <Button variant="onLight" text="Cancel" disabled={validating} onClick={closePopover} />
            <Button
              variant="onLight"
              text={validating ? 'Validating…' : 'Validate'}
              disabled={validating}
              onClick={handleValidate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobusUploadPathEditPopover;
