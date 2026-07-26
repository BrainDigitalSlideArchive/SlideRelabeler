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
  const display_changed_only = useSelector((state) => state.modal.display_changed_only);
  const files = useSelector(state => state.files);
  const [table, set_table] = useState(null);

  const file_row = resolveFileRow(files.file_rows, row_idx, file);
  const { table: resolvedTable, pathKey, matchedBy, pathInIfds } = resolveMetadataTable(ifds, file, file_row);

  useEffect(() => {
    set_table(resolvedTable ?? null);
  }, [resolvedTable]);

  const { branch, message } = getMetadataModalBranch(table, file_row, pathInIfds);

  let content;
  if (branch === 'grid') {
    content = (
      <MetadataAgGrid
        display_changed_only={display_changed_only}
        autoSizeStrategy={{ type: 'fitCellContents' }}
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
      <ModalHeader title="Metadata" type="metadata" display_changed_only={display_changed_only} />
      <div className="__content">
        <div className="__metadata_viewer">
          {content}
        </div>
      </div>
    </div>
  );
}

export default ModalMetadata;
