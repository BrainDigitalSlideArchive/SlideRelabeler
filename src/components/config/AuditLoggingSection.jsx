import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as auditLog_actions from '../../actions/auditLog';
import * as modal_actions from '../../actions/modal';
import {
  AUDIT_DEFAULT_FINITE_LIMIT,
  clampAuditMaxEntries,
  countEntriesToTrim,
  resolveAuditMaxEntries,
} from '../../helpers/audit_log.js';
import { DEFAULT_AUDIT_LOG_SETTINGS } from '../../reducers/auditLog/default_state.js';
import Button from '../controls/button/Button';
import InputText from '../controls/input/InputText';
import HelpIconPopover from '../controls/HelpIconPopover';

const AUDIT_LOGGING_HELP = (
  <>
    SlideRelabeler keeps an internal audit history of processing events—similar to browser
    history. Entries are stored in the app until you clear them; clearing the file table does
    not remove audit history. When a retention limit is set, the oldest entries are removed
    automatically as new ones are recorded. Use <strong>View audit log</strong> to browse,
    filter, and export entries to CSV when you need an external record. Export chooses the
    file name and location.
  </>
);

function formatLimit(limit) {
  return Number(limit).toLocaleString();
}

function buildTrimConfirmMessage(limit, entryCount) {
  const toRemove = countEntriesToTrim(entryCount, limit);
  const remaining = entryCount - toRemove;
  return (
    `Setting the limit to ${formatLimit(limit)} will remove the oldest `
    + `${toRemove.toLocaleString()} ${toRemove === 1 ? 'entry' : 'entries'}, leaving `
    + `${remaining.toLocaleString()} in history. Continue?`
  );
}

export default function AuditLoggingSection({
  disabled = false,
}) {
  const dispatch = useDispatch();
  const enabled = useSelector((state) => state.auditLog?.settings?.enabled !== false);
  const entryCount = useSelector((state) => state.auditLog?.entries?.length ?? 0);
  const maxEntries = useSelector((state) => resolveAuditMaxEntries(
    state.auditLog?.settings,
    DEFAULT_AUDIT_LOG_SETTINGS.maxEntries,
  ));
  const unlimited = maxEntries == null;
  const [draftLimit, setDraftLimit] = useState(
    String(maxEntries ?? AUDIT_DEFAULT_FINITE_LIMIT),
  );

  useEffect(() => {
    setDraftLimit(String(maxEntries ?? AUDIT_DEFAULT_FINITE_LIMIT));
  }, [maxEntries]);

  function openViewer() {
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'auditLog' } });
  }

  function applyMaxEntries(nextMaxEntries) {
    dispatch({
      type: auditLog_actions.SET_AUDIT_LOG_SETTINGS,
      payload: { maxEntries: nextMaxEntries },
    });
  }

  function tryApplyFiniteLimit(rawLimit) {
    const limit = clampAuditMaxEntries(rawLimit);
    const toRemove = countEntriesToTrim(entryCount, limit);
    if (toRemove > 0 && !window.confirm(buildTrimConfirmMessage(limit, entryCount))) {
      setDraftLimit(String(maxEntries ?? limit));
      return false;
    }
    applyMaxEntries(limit);
    setDraftLimit(String(limit));
    return true;
  }

  function handleRetentionModeChange(nextUnlimited) {
    if (nextUnlimited) {
      applyMaxEntries(null);
      return;
    }
    tryApplyFiniteLimit(draftLimit || AUDIT_DEFAULT_FINITE_LIMIT);
  }

  function handleLimitBlur() {
    if (unlimited || disabled || !enabled) return;
    tryApplyFiniteLimit(draftLimit);
  }

  function handleLimitKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLimitBlur();
    }
  }

  const retentionDisabled = disabled || !enabled;
  const countSuffix = unlimited
    ? '(unlimited).'
    : `(limit ${formatLimit(maxEntries)}).`;
  const countText = entryCount === 0
    ? `No entries recorded yet ${unlimited ? '(unlimited).' : countSuffix}`
    : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} in history ${countSuffix}`;

  return (
    <section className="__config-control-section" id="config-audit-logging">
      <div className="__config-control-section-title">Audit logging</div>
      <div className="__config-control-section-description">
        Processing events are recorded in an in-app audit history until you clear them.
        {' '}
        <HelpIconPopover helpLabel="Audit logging help" variant="onLight">
          {AUDIT_LOGGING_HELP}
        </HelpIconPopover>
      </div>

      <div className="config-section-panel">
        <div className="audit-logging-section config-filename-style config-filename-style--compact">
          <div className="audit-logging-section__row">
            <span className="audit-logging-section__row-label" id="audit-logging-enabled-label">
              Audit logging:
            </span>
            <div
              className="config-filename-style__modes config-filename-style__modes--compact"
              role="radiogroup"
              aria-labelledby="audit-logging-enabled-label"
            >
              <label className="config-filename-style__option">
                <input
                  type="radio"
                  name="audit-logging-enabled"
                  disabled={disabled}
                  checked={enabled}
                  onChange={() => dispatch({
                    type: auditLog_actions.SET_AUDIT_LOG_SETTINGS,
                    payload: { enabled: true },
                  })}
                />
                <span className="config-filename-style__label">Enabled</span>
              </label>
              <label className="config-filename-style__option">
                <input
                  type="radio"
                  name="audit-logging-enabled"
                  disabled={disabled}
                  checked={!enabled}
                  onChange={() => dispatch({
                    type: auditLog_actions.SET_AUDIT_LOG_SETTINGS,
                    payload: { enabled: false },
                  })}
                />
                <span className="config-filename-style__label">Disabled</span>
              </label>
            </div>
          </div>

          <div
            className={[
              'audit-logging-section__row',
              retentionDisabled ? 'audit-logging-section__row--inactive' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="audit-logging-section__row-label" id="audit-logging-retention-label">
              Max log entries:
            </span>
            <div
              className="config-filename-style__modes config-filename-style__modes--compact audit-logging-section__retention-modes"
              role="radiogroup"
              aria-labelledby="audit-logging-retention-label"
            >
              <label className="config-filename-style__option">
                <input
                  type="radio"
                  name="audit-logging-retention"
                  disabled={retentionDisabled}
                  checked={unlimited}
                  onChange={() => handleRetentionModeChange(true)}
                />
                <span className="config-filename-style__label">Unlimited</span>
              </label>
              <label className="config-filename-style__option audit-logging-section__limit-option">
                <input
                  type="radio"
                  name="audit-logging-retention"
                  disabled={retentionDisabled}
                  checked={!unlimited}
                  onChange={() => handleRetentionModeChange(false)}
                />
                <span className="config-filename-style__label">Max entries</span>
                <InputText
                  omitLabel
                  variant="onLight"
                  type="number"
                  inputId="audit-log-max-entries"
                  ariaLabel="Max audit log entries to keep"
                  disabled={retentionDisabled || unlimited}
                  value={draftLimit}
                  onChange={setDraftLimit}
                  onBlur={handleLimitBlur}
                  onKeyPress={handleLimitKeyPress}
                />
              </label>
            </div>
          </div>

          <p className="audit-logging-section__count">{countText}</p>

          <div className="audit-logging-section__actions">
            <Button
              extra_class_name="audit-logging-section__view-btn"
              text="View audit log…"
              disabled={disabled}
              onClick={openViewer}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
