import React from 'react';

import ConfigTextButton from './ConfigTextButton';

/**
 * “Test it out” host: title, optional hint, load/reset actions, preview body.
 */
export default function ConfigTestPreview({
  title = 'Test it out',
  hint,
  disabled = false,
  hasLoadedFiles = false,
  onLoadFromFirstRow,
  onResetToExample,
  children,
  className = '',
}) {
  const showActions = onLoadFromFirstRow || onResetToExample;

  return (
    <div className={`cfg-test-preview${className ? ` ${className}` : ''}`}>
      <div className="cfg-test-preview__header">
        <span className="cfg-test-preview__title">{title}</span>
      </div>
      {(hint || showActions) ? (
        <div className="cfg-test-preview__hint-row">
          {hint ? <div className="cfg-test-preview__hint">{hint}</div> : null}
          {showActions ? (
            <div className="cfg-test-preview__actions">
              {onLoadFromFirstRow ? (
                <ConfigTextButton
                  disabled={disabled || !hasLoadedFiles}
                  onClick={onLoadFromFirstRow}
                >
                  Load from first row
                </ConfigTextButton>
              ) : null}
              {onLoadFromFirstRow && onResetToExample ? (
                <span className="cfg-test-preview__action-sep" aria-hidden="true">·</span>
              ) : null}
              {onResetToExample ? (
                <ConfigTextButton
                  disabled={disabled}
                  onClick={onResetToExample}
                >
                  Reset to example
                </ConfigTextButton>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="cfg-test-preview__body">{children}</div>
    </div>
  );
}
