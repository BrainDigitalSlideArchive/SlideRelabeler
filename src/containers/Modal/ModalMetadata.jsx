import React, { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import ModalHeader from './ModalHeader';
import MetadataAgGrid from '../../components/AgGrid/MetadataAgGrid';

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
  const files = useSelector((state) => state.files);
  const [table, set_table] = useState(null);

  useEffect(() => {
    if (ifds[file]) {
      set_table(ifds[file]);
    }
  }, [ifds, file]);

  const file_row = resolveFileRow(files.file_rows, row_idx, file);

  let content;
  if (!file_row?.__reserved) {
    content = (
      <div className="__metadata-table-not-available">
        <p>Loading metadata preview…</p>
      </div>
    );
  } else if (file_row.__reserved.processed === 1) {
    content = (
      <div className="__metadata-table-not-available">
        <p>Metadata not available for processed files.</p>
      </div>
    );
  } else if (table && Object.keys(table).length > 0) {
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
  } else {
    content = (
      <div className="__metadata-table-not-available">
        <p>Loading metadata preview…</p>
      </div>
    );
  }

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
