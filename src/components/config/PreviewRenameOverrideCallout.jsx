import React, { useCallback, useLayoutEffect, useState } from 'react';

import { isManualRenameOverride } from '../../helpers/config_preview_row.js';

const RENAME_COL_ID = '__reserved.rename';
const PREVIEW_ROW_ID = 'preview-row';

export default function PreviewRenameOverrideCallout({
  containerRef,
  previewRow,
  onClear,
  repositionToken,
}) {
  const [style, setStyle] = useState(null);
  const visible = isManualRenameOverride(previewRow);

  const updatePosition = useCallback(() => {
    const container = containerRef?.current;
    if (!container || !visible) {
      setStyle(null);
      return;
    }

    const rowEl = container.querySelector(`.ag-row[row-id="${PREVIEW_ROW_ID}"]`);
    const cellEl = rowEl?.querySelector(`.ag-cell[col-id="${RENAME_COL_ID}"]`)
      ?? container.querySelector(`.ag-cell[col-id="${RENAME_COL_ID}"]`);

    if (!cellEl) {
      setStyle(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();

    setStyle({
      left: cellRect.left - containerRect.left + cellRect.width / 2,
      top: cellRect.bottom - containerRect.top + 8,
    });
  }, [containerRef, visible]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition, previewRow, repositionToken]);

  if (!visible || !style) return null;

  return (
    <div
      className="preview-rename-override-callout"
      style={{ left: style.left, top: style.top }}
      role="note"
    >
      <p className="preview-rename-override-callout__text">
        Manually edited values override the option selected above.
      </p>
      <button
        type="button"
        className="preview-rename-override-callout__clear"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}
