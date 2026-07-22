import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ModalHeader from './ModalHeader';
import Button from '../../components/controls/button/Button';
import {
  AuditLogBatchAgGrid,
  AuditLogSlideAgGrid,
  AuditLogUploadAgGrid,
  getDisplayedAuditEntryCount,
  getFilteredAuditEntries,
  getSelectedAuditRows,
} from '../../components/AgGrid/AuditLogAgGrid';
import {
  deriveBatchRows,
  filterEntriesByTypes,
  resolveAuditEntryIdsToDelete,
  AUDIT_VIEW_SLIDE_TYPES,
  AUDIT_VIEW_UPLOAD_TYPES,
} from '../../helpers/audit_log_views.js';
import {
  BATCH_EXPORT_COLUMNS,
  SLIDE_EXPORT_COLUMNS,
  UPLOAD_EXPORT_COLUMNS,
} from '../../helpers/audit_log_export.js';
import * as auditLog_actions from '../../actions/auditLog';

const AUDIT_TABS = [
  { id: 'batches', label: 'Batches' },
  { id: 'slides', label: 'Slides' },
  { id: 'uploads', label: 'Uploads' },
];

function getTabEntries(entries, tabId) {
  if (tabId === 'batches') return deriveBatchRows(entries);
  if (tabId === 'slides') return filterEntriesByTypes(entries, AUDIT_VIEW_SLIDE_TYPES);
  if (tabId === 'uploads') return filterEntriesByTypes(entries, AUDIT_VIEW_UPLOAD_TYPES);
  return [];
}

function getTabExportColumns(tabId) {
  if (tabId === 'batches') return BATCH_EXPORT_COLUMNS;
  if (tabId === 'uploads') return UPLOAD_EXPORT_COLUMNS;
  return SLIDE_EXPORT_COLUMNS;
}

function getTabNoun(tabId) {
  if (tabId === 'batches') return 'batches';
  if (tabId === 'uploads') return 'uploads';
  return 'slides';
}

function getTabEntryNoun(tabId) {
  if (tabId === 'batches') return 'batches';
  if (tabId === 'uploads') return 'upload entries';
  return 'slide entries';
}

function buildDeleteCheckedConfirmMessage(activeTab, selectedCount) {
  if (activeTab === 'batches') {
    const batchLabel = selectedCount === 1 ? 'batch' : 'batches';
    return (
      `Delete ${selectedCount} checked ${batchLabel} (all entries for those runs)? `
      + 'This cannot be undone.'
    );
  }
  const noun = getTabEntryNoun(activeTab);
  return `Delete ${selectedCount} checked ${noun}? This cannot be undone.`;
}

export default function AuditLogViewerModal() {
  const dispatch = useDispatch();
  const entries = useSelector((state) => state.auditLog?.entries ?? []);
  const gridRef = useRef(null);
  const [activeTab, setActiveTab] = useState('batches');
  const tabEntries = useMemo(
    () => getTabEntries(entries, activeTab),
    [entries, activeTab],
  );
  const [displayedCount, setDisplayedCount] = useState(tabEntries.length);
  const [selectedCount, setSelectedCount] = useState(0);

  const refreshDisplayedCount = useCallback(() => {
    const api = gridRef.current?.api;
    setDisplayedCount(api ? getDisplayedAuditEntryCount(api) : tabEntries.length);
  }, [tabEntries.length]);

  const refreshSelectedCount = useCallback(() => {
    const api = gridRef.current?.api;
    setSelectedCount(api ? getSelectedAuditRows(api).length : 0);
  }, []);

  useEffect(() => {
    refreshDisplayedCount();
    setSelectedCount(0);
  }, [tabEntries, activeTab, refreshDisplayedCount]);

  function handleTabChange(tabId) {
    gridRef.current?.api?.setFilterModel(null);
    gridRef.current?.api?.deselectAll();
    setSelectedCount(0);
    setActiveTab(tabId);
  }

  function getFilteredEntries() {
    return getFilteredAuditEntries(gridRef.current?.api);
  }

  function handleResetFilters() {
    gridRef.current?.api?.setFilterModel(null);
    refreshDisplayedCount();
  }

  function clearGridSelection() {
    gridRef.current?.api?.deselectAll();
    setSelectedCount(0);
  }

  function handleExport() {
    const filteredEntries = getFilteredEntries();
    if (filteredEntries.length === 0) return;
    dispatch({
      type: auditLog_actions.EXPORT_AUDIT_LOG,
      payload: {
        entries: filteredEntries,
        columns: getTabExportColumns(activeTab),
      },
    });
  }

  function handleDeleteAll() {
    if (entries.length === 0) return;
    if (!window.confirm('Delete all audit log entries? This cannot be undone.')) return;
    dispatch({ type: auditLog_actions.CLEAR_AUDIT_LOG });
    clearGridSelection();
  }

  function handleDeleteChecked() {
    const selectedRows = getSelectedAuditRows(gridRef.current?.api);
    if (selectedRows.length === 0) return;

    if (!window.confirm(buildDeleteCheckedConfirmMessage(activeTab, selectedRows.length))) {
      return;
    }

    const idsToDelete = resolveAuditEntryIdsToDelete({
      activeTab,
      selectedRows,
      allEntries: entries,
    });
    if (idsToDelete.length === 0) return;

    dispatch({
      type: auditLog_actions.CLEAR_AUDIT_ENTRIES,
      payload: { ids: idsToDelete },
    });
    clearGridSelection();
  }

  const hasColumnFilters = displayedCount < tabEntries.length;
  const tabNoun = getTabNoun(activeTab);
  const summaryText = selectedCount > 0
    ? `${selectedCount} selected · ${displayedCount} of ${tabEntries.length} ${tabNoun}`
    : `${displayedCount} of ${tabEntries.length} ${tabNoun}`;

  const grid = activeTab === 'batches' ? (
    <AuditLogBatchAgGrid
      entries={entries}
      gridRef={gridRef}
      onDisplayChanged={refreshDisplayedCount}
      onSelectionChanged={refreshSelectedCount}
    />
  ) : activeTab === 'uploads' ? (
    <AuditLogUploadAgGrid
      entries={entries}
      gridRef={gridRef}
      onDisplayChanged={refreshDisplayedCount}
      onSelectionChanged={refreshSelectedCount}
    />
  ) : (
    <AuditLogSlideAgGrid
      entries={entries}
      gridRef={gridRef}
      onDisplayChanged={refreshDisplayedCount}
      onSelectionChanged={refreshSelectedCount}
    />
  );

  return (
    <div className="__modal _large">
      <ModalHeader title="Audit log" type="auditLog" />
      <div className="__content __content--config audit-log-viewer">
        <div className="config-panel audit-log-panel">
          <p className="audit-log-panel__intro">
            Browse de-id batch history, per-slide processing, and uploads in separate tables.
            Check rows to delete, filter and sort columns, and export the active tab to CSV.
          </p>

          <div className="audit-log-panel__tabs" role="tablist" aria-label="Audit log views">
            {AUDIT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`audit-log-panel__tab${activeTab === tab.id ? ' audit-log-panel__tab--active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="audit-log-panel__bar">
            <div className="audit-log-panel__summary-wrap">
              <p className="audit-log-panel__summary">
                {summaryText}
              </p>
            </div>
            <div className="audit-log-panel__actions">
              <Button
                variant="onLight"
                extra_class_name="audit-log-panel__btn audit-log-panel__btn--primary"
                text="Export filtered…"
                disabled={displayedCount === 0}
                onClick={handleExport}
              />
              <Button
                variant="onLight"
                extra_class_name="audit-log-panel__btn audit-log-panel__btn--secondary"
                text="Reset filters"
                disabled={!hasColumnFilters}
                onClick={handleResetFilters}
              />
              <Button
                variant="onLight"
                extra_class_name="audit-log-panel__btn audit-log-panel__btn--destructive"
                text="Delete checked entries"
                disabled={selectedCount === 0}
                onClick={handleDeleteChecked}
              />
              <Button
                variant="onLight"
                extra_class_name="audit-log-panel__btn audit-log-panel__btn--destructive"
                text="Delete all"
                disabled={entries.length === 0}
                onClick={handleDeleteAll}
              />
            </div>
          </div>

          <div className="audit-log-panel__grid config-section-panel">
            {grid}
          </div>
        </div>
      </div>
      <div className="__footer" />
    </div>
  );
}
