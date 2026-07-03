import React, { forwardRef, useEffect, useRef } from 'react';

const NAV_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'PageUp', 'PageDown', 'Home', 'End',
]);

const RenameCellEditor = forwardRef((props, ref) => {
  const { value, onValueChange, data } = props;
  const inputRef = useRef(null);
  const ext = data?.__reserved?.source?.parsed?.ext ?? '';

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const onKeyDown = (event) => {
    if (NAV_KEYS.has(event.key)) {
      event.stopPropagation();
    }
  };

  return (
    <div className="__rename-cell-editor">
      <input
        ref={inputRef}
        className="__input-text"
        value={value != null ? String(value) : ''}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="__output-filename__ext">{ext}</span>
    </div>
  );
});

RenameCellEditor.displayName = 'RenameCellEditor';

export default RenameCellEditor;
