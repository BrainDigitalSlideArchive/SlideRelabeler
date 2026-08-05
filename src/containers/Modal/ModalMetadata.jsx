import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import ModalHeader from './ModalHeader';
import MetadataAgGrid from '../../components/AgGrid/MetadataAgGrid';
import { logMetadataPreview } from '../../helpers/metadata_preview_debug';
import {
  resolveMetadataTable,
  getMetadataModalBranch,
} from '../../helpers/metadata_preview_ui';

function pathsMatch(storedPath, filePath) {
  if (!storedPath || !filePath) return false;
  if (storedPath === filePath) return true;
  try {
    return decodeURIComponent(storedPath) === decodeURIComponent(filePath);
  } catch {
    return false;
  }
}

function resolveFileRow(fileRows, rowIdx, filePath) {
  if (!Array.isArray(fileRows)) return null;

  const parsed = Number(rowIdx ?? 0);
  if (Number.isFinite(parsed) && fileRows[parsed]?.__reserved) {
    return fileRows[parsed];
  }

  return fileRows.find(
    (row) => pathsMatch(row?.__reserved?.source?.path, filePath)
      || pathsMatch(row?.__reserved?.output_path, filePath),
  ) ?? null;
}

function ModalMetadata(props) {
  const { file, row_idx } = props;
  const ifds = useSelector((state) => state.files.ifds);
  const metadata_xml = useSelector((state) => state.files.metadata_xml);
  const display_changed_only = useSelector((state) => state.modal.display_changed_only);
  const files = useSelector(state => state.files);
  const [table, set_table] = useState(null);
  const [view, setView] = useState('fields');
  const [copiedPane, setCopiedPane] = useState(null);

  const file_row = resolveFileRow(files.file_rows, row_idx, file);
  const { table: resolvedTable, pathKey, matchedBy, pathInIfds } = resolveMetadataTable(ifds, file, file_row);
  const xml = metadata_xml?.[pathKey];
  const hasXml = typeof xml?.prior_xml === 'string' && typeof xml?.new_xml === 'string';

  useEffect(() => {
    set_table(resolvedTable ?? null);
  }, [resolvedTable]);

  useEffect(() => {
    if (!hasXml) setView('fields');
  }, [hasXml]);

  const copyXml = async (pane, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedPane(pane);
      window.setTimeout(() => setCopiedPane(current => current === pane ? null : current), 1500);
    } catch {
      setCopiedPane(null);
    }
  };

  const { branch, message } = getMetadataModalBranch(table, file_row, pathInIfds);

  let content;
  if (view === 'xml' && hasXml) {
    content = (
      <div className="metadata-xml-comparison">
        {[
          ['prior', 'Before', xml.prior_xml],
          ['new', 'After', xml.new_xml],
        ].map(([key, label, value]) => (
          <section className="metadata-xml-pane" key={key}>
            <div className="metadata-xml-pane__header">
              <h3>{label}</h3>
              <button type="button" onClick={() => copyXml(key, value)}>
                {copiedPane === key ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre>{value}</pre>
          </section>
        ))}
      </div>
    );
  } else if (branch === 'grid') {
    content = (
      <MetadataAgGrid
        display_changed_only={display_changed_only}
        suppressMovableColumns
        ensureDomOrder
        suppressDragLeaveHidesColumns
        enableCellTextSelection
        undoRedoCellEditing
        undoRedoCellEditingLimit={20}
        table={table}
      />
    );
  } else if (branch === 'processed' || branch === 'error' || branch === 'unavailable') {
    content = (
      <div className="__metadata-table-not-available">
        <p>{message}</p>
      </div>
    );
  } else {
    content = (
      <div className="__metadata-table-not-available">
        <p>Loading metadata preview…</p>
      </div>
    );
  }

  useEffect(() => {
    logMetadataPreview('modal', {
      file,
      pathKey,
      matchedBy,
      pathInIfds,
      ifdsKeys: Object.keys(ifds || {}),
      tableRowCount: Array.isArray(table)
        ? table.length
        : (table && typeof table === 'object' ? Object.keys(table).length : 0),
      processed: file_row?.__reserved?.processed,
      branch,
    });
  }, [file, pathKey, matchedBy, pathInIfds, ifds, table, file_row, branch]);

  return (
    <div className="__modal">
      <ModalHeader
        title="Metadata"
        type="metadata"
        display_changed_only={display_changed_only}
        show_changed_only={view === 'fields'}
      />
      <div className="__content">
        <div className="__metadata_viewer">
          {hasXml && (
            <div className="metadata-view-toggle" role="tablist" aria-label="Metadata view">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'fields'}
                className={view === 'fields' ? '_active' : ''}
                onClick={() => setView('fields')}
              >
                Fields
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'xml'}
                className={view === 'xml' ? '_active' : ''}
                onClick={() => setView('xml')}
              >
                Raw XML
              </button>
            </div>
          )}
          {content}
        </div>
      </div>
    </div>
  );
}

export default ModalMetadata;
