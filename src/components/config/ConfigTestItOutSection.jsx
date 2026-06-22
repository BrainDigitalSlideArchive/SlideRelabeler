import React from 'react';

export default function ConfigTestItOutSection({
  hint,
  disabled = false,
  hasLoadedFiles = false,
  onLoadFromFirstRow,
  onResetToExample,
  children,
}) {
  return (
    <div className="config-test-it-out">
      <div className="config-test-it-out__header">
        <span className="config-test-it-out__title">Test it out</span>
      </div>
      {(hint || onLoadFromFirstRow || onResetToExample) && (
        <div className="config-test-it-out__hint-row">
          {hint && (
            <p className="config-test-it-out__hint">{hint}</p>
          )}
          <div className="config-test-it-out__actions">
            <button
              type="button"
              className="config-test-it-out__text-action"
              disabled={disabled || !hasLoadedFiles}
              onClick={onLoadFromFirstRow}
            >
              Load from first row
            </button>
            <span className="config-test-it-out__action-sep" aria-hidden="true">·</span>
            <button
              type="button"
              className="config-test-it-out__text-action"
              disabled={disabled}
              onClick={onResetToExample}
            >
              Reset to example
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
