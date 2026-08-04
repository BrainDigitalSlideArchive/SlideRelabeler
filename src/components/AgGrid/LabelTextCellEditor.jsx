import React, { forwardRef, useEffect, useRef } from 'react';

const NAV_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'PageUp', 'PageDown', 'Home', 'End',
]);

/**
 * Popup multiline editor for Label text.
 * Enter / Shift+Enter → newline (colDef.suppressKeyboardEvent keeps the grid from committing).
 * Tab → commit and move (grid default).
 * Escape → revert (grid default; do not call stopEditing(false)).
 * Cmd/Ctrl+Enter → commit, then move to the next cell.
 * Click outside → commit (requires stopEditingWhenCellsLoseFocus on the grid).
 */
const LabelTextCellEditor = forwardRef((props, ref) => {
  const { value, onValueChange, stopEditing, api } = props;
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  const onKeyDown = (event) => {
    if (NAV_KEYS.has(event.key)) {
      event.stopPropagation();
      return;
    }

    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();
      stopEditing?.(false);
      // Move like Tab after commit.
      queueMicrotask(() => {
        api?.tabToNextCell?.();
      });
      return;
    }

    // Plain Enter / Shift+Enter: suppressKeyboardEvent already blocks the grid;
    // stopPropagation is belt-and-suspenders for other listeners.
    if (event.key === 'Enter') {
      event.stopPropagation();
    }
  };

  return (
    <div className="__label-text-cell-editor">
      <textarea
        ref={textareaRef}
        className="__input-text __label-text-cell-editor__textarea"
        rows={4}
        value={value != null ? String(value) : ''}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Label text"
      />
    </div>
  );
});

LabelTextCellEditor.displayName = 'LabelTextCellEditor';

export default LabelTextCellEditor;
