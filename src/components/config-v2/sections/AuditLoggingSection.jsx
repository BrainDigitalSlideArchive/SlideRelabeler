import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as auditLog_actions from '../../../actions/auditLog';
import * as modal_actions from '../../../actions/modal';
import {
  AUDIT_DEFAULT_FINITE_LIMIT,
  clampAuditMaxEntries,
  countEntriesToTrim,
  resolveAuditMaxEntries,
} from '../../../helpers/audit_log.js';
import { DEFAULT_AUDIT_LOG_SETTINGS } from '../../../reducers/auditLog/default_state.js';
import Button from '../../controls/button/Button';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigLabeledRow from '../primitives/ConfigLabeledRow';
import ConfigChoiceChips from '../primitives/ConfigChoiceChips';
import ConfigField from '../primitives/ConfigField';
import ConfigHelperText from '../primitives/ConfigHelperText';

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

const ENABLE_OPTIONS = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

const RETENTION_OPTIONS = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: 'max', label: 'Max entries' },
];

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

/**
 * Audit logging — Phase 2b.
 * Recipe: Section → Panel → LabeledRow×2 (chips [+ field xs]) → View button.
 */
export default function AuditLoggingSection() {
  const dispatch = useDispatch();
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);
  const disabled = processing || disableChanges;

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

  function handleRetentionModeChange(nextValue) {
    const nextUnlimited = nextValue === 'unlimited';
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
  const countText = `Current record count: ${entryCount}`;

  return (
    <ConfigSection
      id="config-audit-logging"
      title="Audit logging"
      description="Processing events are recorded in an in-app audit history until you clear them."
      help={AUDIT_LOGGING_HELP}
      helpLabel="Audit logging help"
    >
      <ConfigSectionPanel>
        <ConfigLabeledRow
          label="Audit logging:"
          labelId="audit-logging-enabled-label"
        >
          <ConfigChoiceChips
            name="audit-logging-enabled"
            value={enabled ? 'enabled' : 'disabled'}
            options={ENABLE_OPTIONS}
            disabled={disabled}
            ariaLabelledBy="audit-logging-enabled-label"
            onChange={(next) => dispatch({
              type: auditLog_actions.SET_AUDIT_LOG_SETTINGS,
              payload: { enabled: next === 'enabled' },
            })}
          />
        </ConfigLabeledRow>

        <ConfigLabeledRow
          label="Max log entries:"
          labelId="audit-logging-retention-label"
          className={retentionDisabled ? 'cfg-labeled-row--inactive' : ''}
        >
          <div className="cfg-labeled-row__cluster">
            <ConfigChoiceChips
              name="audit-logging-retention"
              value={unlimited ? 'unlimited' : 'max'}
              options={RETENTION_OPTIONS}
              disabled={retentionDisabled}
              ariaLabelledBy="audit-logging-retention-label"
              onChange={handleRetentionModeChange}
            />
            <ConfigField
              size="xs"
              omitLabel
              type="number"
              inputId="audit-log-max-entries"
              ariaLabel="Max audit log entries to keep"
              disabled={retentionDisabled || unlimited}
              value={draftLimit}
              onChange={setDraftLimit}
              onBlur={handleLimitBlur}
              onKeyPress={handleLimitKeyPress}
            />
          </div>
          <ConfigHelperText>{countText}</ConfigHelperText>
        </ConfigLabeledRow>

        <div className="cfg-panel-actions">
          <Button
            variant="onLight"
            text="View audit log…"
            disabled={disabled}
            onClick={openViewer}
          />
        </div>
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
