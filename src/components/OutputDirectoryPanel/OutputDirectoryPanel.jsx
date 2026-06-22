import React from 'react';

import { getOutputDirectoryPanelCopy } from '../../selectors/outputReadiness.js';

import './OutputDirectoryPanel.scss';

export default function OutputDirectoryPanel({
  variant = 'slide',
  destSummary,
  outputDir,
  required = false,
  highlighted = false,
  disabled = false,
  onChoose,
}) {
  const copy = getOutputDirectoryPanelCopy(variant, destSummary, outputDir, required);
  const { total, filled } = destSummary ?? { total: 0, filled: 0 };
  const progressPct = total > 0 ? Math.round((filled / total) * 100) : 0;

  const panelClass = [
    'output-directory-panel',
    highlighted ? '_highlighted' : '',
    copy.optionalAction ? '_optional' : '',
  ].filter(Boolean).join(' ');

  const badgeClass = [
    'output-directory-panel__badge',
    copy.badge === 'Required' ? '_required' : '',
    copy.badge === 'All ready' ? '_ready' : '',
    copy.badge === 'Folder set' ? '_set' : '',
  ].filter(Boolean).join(' ');

  return (
    <section
      className={panelClass}
      role="region"
      aria-label={copy.title}
    >
      <div className="output-directory-panel__header">
        <h3 className="output-directory-panel__title">{copy.title}</h3>
        {copy.badge && (
          <span className={badgeClass}>{copy.badge}</span>
        )}
      </div>

      {copy.showProgress && total > 0 && (
        <div className="output-directory-panel__progress-wrap">
          <div
            className="output-directory-panel__progress"
            role="progressbar"
            aria-valuenow={filled}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${filled} of ${total} files with Copy To path`}
          >
            <div
              className="output-directory-panel__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="output-directory-panel__progress-label">
            {filled} of {total} files
          </span>
        </div>
      )}

      {copy.body && (
        <p className="output-directory-panel__body">{copy.body}</p>
      )}

      {copy.path && (
        <div className="output-directory-panel__path" title={copy.path}>
          <i className="fi fi-rr-folder output-directory-panel__path-icon" aria-hidden="true" />
          <span className="output-directory-panel__path-text">{copy.path}</span>
        </div>
      )}

      <div className="output-directory-panel__actions">
        <button
          type="button"
          className={`output-directory-panel__button${disabled ? ' _disabled' : ''}${copy.optionalAction ? ' _secondary' : ''}`}
          disabled={disabled}
          aria-disabled={disabled}
          onClick={onChoose}
        >
          {copy.buttonLabel}
        </button>
      </div>
    </section>
  );
}
