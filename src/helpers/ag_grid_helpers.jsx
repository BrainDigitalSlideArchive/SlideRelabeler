import React from "react";
import { displayBytesCompact } from "./fe_helpers";
import * as files_actions from "../actions/files";
import { resolveOutputFilenameStem } from './output_filename.js';
import { markNamingFieldSource, NAMING_SOURCE } from './row_naming_defaults.js';
import AssociatedImagesIcons from '../components/AgGrid/AssociatedImagesIcons.jsx';
import RenameCellEditor from '../components/AgGrid/RenameCellEditor.jsx';
import OverflowTitle from '../components/AgGrid/OverflowTitle.jsx';
import OutputFilenameDisplay, { splitPathBasename } from '../components/AgGrid/OutputFilenameDisplay.jsx';
import CollapsedPathIconCell from '../components/AgGrid/CollapsedPathIconCell.jsx';
import SourceFileCell from '../components/AgGrid/SourceFileCell.jsx';
import {
  canShowEmbeddedThumbnail,
  sourceFilenameCellValue,
} from './thumbnail_helpers.js';
import { isPathColumnIconMode } from './file_table_columns.js';
import {
  canOpenViewerForRow,
  getRowErrorDisplay,
  rowHasError,
} from './file_table_row_helpers.js';

export function addFieldToColumn(file_cols, match_field_header_class, field, field_value) {
  let outputFileCols = [...file_cols];
  for (let i = 0; i < file_cols.length; i++) {
    if (file_cols[i].field === match_field_header_class || file_cols[i].headerClass === match_field_header_class) {
      outputFileCols[i] = Object.assign({}, file_cols[i], { [field]: field_value });
    }
  }
  return outputFileCols;
}

export function addCellRenderer(file_cols, match_field_header_class, cell_renderer) {
  return addFieldToColumn(file_cols, match_field_header_class, 'cellRenderer', cell_renderer);
}

export function addValueFormatter(file_cols, match_field_header_class, value_formatter) {
  return addFieldToColumn(file_cols, match_field_header_class, 'valueFormatter', value_formatter);
}

export function addComparator(file_cols, match_field_header_class, comparator) {
  return addFieldToColumn(file_cols, match_field_header_class, 'comparator', comparator);
}

export function addCellClass(file_cols, match_field_header_class, cell_class) {
  return addFieldToColumn(file_cols, match_field_header_class, 'cellClass', cell_class);
}

export function addColSpan(file_cols, match_field_header_class, col_span) {
  return addFieldToColumn(file_cols, match_field_header_class, 'colSpan', col_span);
}

export function addOnCellClicked(file_cols, match_field_header_class, onCellClicked) {
  return addFieldToColumn(file_cols, match_field_header_class, 'onCellClicked', onCellClicked);
}

export function addEditable(file_cols, match_field_header_class, editable) {
  return addFieldToColumn(file_cols, match_field_header_class, 'editable', editable);
}

export function addValueSetter(file_cols, match_field_header_class, valueSetter) {
  return addFieldToColumn(file_cols, match_field_header_class, 'valueSetter', valueSetter);
}

export function isUnprocessedRow(data) {
  return data?.__reserved?.processed === 0;
}

export function setupRemoveColumn(file_cols, processing, disable_changes, dispatch) {
  return addCellRenderer(
    file_cols,
    'remove-row',
    params => {
      if (processing || disable_changes) {
        return <div className="__remove-row-placeholder" />
      } else {
        return (
          <button
            className='__clear-row _remove-button'
            onClick={() => dispatch({ type: files_actions.REMOVE_FILE, payload: params.node.rowIndex })}>
            X
          </button>
        )
      }
    }
  )
}

export function setupSourceFileColumn(file_cols) {
  let cols = addFieldToColumn(
    file_cols,
    '__reserved.source.filename',
    'valueGetter',
    (params) => sourceFilenameCellValue(params.data?.__reserved),
  );
  cols = addCellRenderer(
    cols,
    '__reserved.source.filename',
    (params) => {
      const reserved = params.data?.__reserved;
      const filename = reserved?.source?.filename != null
        ? String(reserved.source.filename)
        : '';
      const sourcePath = reserved?.source?.path ?? '';
      return (
        <SourceFileCell
          filename={filename}
          sourcePath={sourcePath}
          showThumbnail={canShowEmbeddedThumbnail(reserved)}
          hasRowError={rowHasError(params.data)}
          errorDisplay={getRowErrorDisplay(params.data)}
        />
      );
    }
  );
  cols = addOnCellClicked(
    cols,
    '__reserved.source.filename',
    (params) => {
      if (!canOpenViewerForRow(params.data)) return;
      const data = params.data?.__reserved;
      if (!data) return;
      const path = (data.processed === 1 && !data.deleted_after)
        ? data.output_path
        : data.source?.path;
      if (path) {
        electronAPI.openViewer(path, params.node.rowIndex);
      }
    }
  );
  cols = addFieldToColumn(
    cols,
    '__reserved.source.filename',
    'cellClassRules',
    {
      'ag-cell--row-error': (params) => rowHasError(params.data),
    },
  );
  return cols;
}

export function setupAssociatedImagesColumn(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.associatedImages',
    (params) => {
      if (params.data && params.data.__reserved && params.data.__reserved.associatedImages) {
        return <AssociatedImagesIcons images={params.data.__reserved.associatedImages} />;
      }
      return <AssociatedImagesIcons images={[]} />;
    }
  )
}

export function setupDestinationDirectoryColumn(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.destinationDirectory',
    params => {
      const iconMode = isPathColumnIconMode(params.column, params.context);
      if (params.data?.__reserved?.processed !== 0) {
        const path = params.data.__reserved.destinationDirectory ?? '';
        if (iconMode) {
          return (
            <CollapsedPathIconCell
              path={path}
              className="__copy-to __copy-to--collapsed"
              glyphClassName="__copy-to__glyph"
            />
          );
        }
        return <OverflowTitle text={path} className="__copy-to" />;
      }
      const fullPath = params.value || '';
      if (iconMode) {
        return (
          <CollapsedPathIconCell
            path={fullPath}
            emptyLabel="[Not selected]"
            className="__copy-to __copy-to--collapsed"
            glyphClassName="__copy-to__glyph"
          />
        );
      }
      const display = fullPath || '[Not selected]';
      return <OverflowTitle text={display} className="__copy-to" />;
    }
  )
}

function formatGlobusCompleteDuration(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return 'Complete';
  const s = Math.round(Number(sec));
  if (s < 60) return `Complete (${s}s)`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `Complete (${m}m ${r}s)` : `Complete (${m}m)`;
}

function render_progress_text(data) {
  try {
    if (data && data.__reserved && data.__reserved.globus_upload_duration_sec != null) {
      return formatGlobusCompleteDuration(data.__reserved.globus_upload_duration_sec);
    }
    if (data && data.__reserved && data.__reserved.upload_progress_indeterminate) {
      return 'Uploading…';
    }
    if (data && data.__reserved && typeof data.__reserved.upload_progress === 'number') {
      return `Uploading: ${Math.trunc(data.__reserved.upload_progress)}%`;
    }
    else if (data && data.__reserved && data.__reserved.progress && data.__reserved.progress !== 0) {
      return `Processing: ${Math.trunc(data.__reserved.progress)}%`;
    } else {
      return 'Not started';
    }
  }
  catch (err) {
    console.log('Error rendering progress text', err);
    return 'Not started';
  }
}

export function setupProgressColumn(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.progress',
    ({ data }) => {
      const globusDone = data && data.__reserved && data.__reserved.globus_upload_duration_sec != null;
      return (
        <div className={'__progress-indicator'}>
          {
            (data && data.__reserved && data.__reserved.upload_progress_indeterminate && !globusDone) && (
              <div className={'__progress-indicator-upload-fill __progress-indicator-upload-fill--indeterminate'} />
            )
          }
          {
            (data && data.__reserved && typeof data.__reserved.upload_progress === 'number' && !data.__reserved.upload_progress_indeterminate && !globusDone) && (
              <div className={'__progress-indicator-upload-fill'} style={data.__reserved.upload_progress && data.__reserved.upload_progress !== 0 ? { width: `${Math.trunc(data.__reserved.upload_progress)}%` } : { width: '0%' }}>
              </div>
            )
          }
          {
            data && data.__reserved && data.__reserved.progress && data.__reserved.progress !== 0 && typeof data.__reserved.upload_progress !== 'number' && (
              <div className={'__progress-indicator-process-fill'} style={data.__reserved.progress && data.__reserved.progress !== 0 ? { width: `${Math.trunc(data.__reserved.progress)}%` } : { width: '0%' }}>
              </div>
            )
          }
          <div className={'__progress-indicator-text'}>
            {render_progress_text(data)}
          </div>
        </div>
      )
    }
  )
}

export function setupRenameCellRenderer(file_cols, config) {
  return addCellRenderer(
    file_cols,
    '__reserved.rename',
    params => {
      if (params.data && params.data.__reserved && params.data.__reserved.processed === 1) {
        const outputPath = params.data.__reserved.output_path ?? '';
        const { stem, ext } = splitPathBasename(outputPath);
        return (
          <OutputFilenameDisplay
            stem={stem}
            ext={ext}
            fullText={outputPath}
          />
        );
      }
      if (params.data && params.data.__reserved) {
        const stem = resolveOutputFilenameStem(params.data, config);
        const ext = params.data.__reserved?.source?.parsed?.ext ?? '';
        return (
          <OutputFilenameDisplay
            stem={stem}
            ext={ext}
          />
        );
      }
      return '';
    }
  )
}

const OVERFLOW_TEXT_FIELDS = [
  '__reserved.labelText',
  '__reserved.qrPayload',
];

export function setupOverflowTextRenderer(file_cols, fields = OVERFLOW_TEXT_FIELDS) {
  const fieldSet = new Set(fields);
  return file_cols.map((col) => {
    if (!col?.field || !fieldSet.has(col.field)) return col;
    return {
      ...col,
      cellRenderer: (params) => {
        const text = params.value != null ? String(params.value) : '';
        return <OverflowTitle text={text} />;
      },
    };
  });
}

export function setup_source_directory_cell_renderer(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.source.directory',
    ({ value, column, context }) => {
      const dirText = value != null ? String(value) : '';
      if (isPathColumnIconMode(column, context)) {
        return (
          <CollapsedPathIconCell
            path={dirText}
            className="__source-directory __source-directory--collapsed"
            glyphClassName="__source-directory__glyph"
          />
        );
      }
      return <OverflowTitle text={dirText} className="__source-directory" />;
    }
  )
}

export function setup_source_directory_cell_class(file_cols) {
  return addCellClass(
    file_cols,
    '__reserved.source.directory',
    (params) => {
      const parts = ['cell-container', 'directory', 'left-ellipsis'];
      if (isPathColumnIconMode(params.column, params.context)) {
        parts.push('__cell-icon');
      } else {
        parts.push('__cell');
      }
      return parts.join(' ');
    }
  )
}

export function setupSizeValueFormatter(file_cols) {
  return addValueFormatter(
    file_cols,
    '__reserved.bytes',
    ({ value }) => displayBytesCompact(value)
  )
}

export function setupAssociatedImagesValueFormatter(file_cols) {
  return addValueFormatter(
    file_cols,
    '__reserved.associatedImages',
    () => ''
  )
}

export function setupAssociatedImagesComparator(file_cols) {
  return addComparator(
    file_cols,
    '__reserved.associatedImages',
    (valA, valB) => (valA?.length ?? 0) - (valB?.length ?? 0)
  )
}

export function setupDestinationDirectoryCellClass(file_cols) {
  return addCellClass(
    file_cols,
    '__reserved.destinationDirectory',
    (params) => {
      const parts = ['cell-container', 'directory', 'left-ellipsis'];
      if (isPathColumnIconMode(params.column, params.context)) {
        parts.push('__cell-icon');
      } else {
        parts.push('__cell');
      }
      if (isUnprocessedRow(params.data)) {
        parts.push('editable');
      }
      return parts.join(' ');
    }
  )
}

export function setupDestinationDirectoryColSpan(file_cols) {
  return addColSpan(
    file_cols,
    '__reserved.destinationDirectory',
    params => params.data.__reserved.processed === 0 ? 1 : 2
  )
}

export function setupDestinationDirectoryOnCellClicked(file_cols, dispatch) {
  return addOnCellClicked(
    file_cols,
    '__reserved.destinationDirectory',
    async ({ data, node }) => {
      if (!canOpenViewerForRow(data)) return;
      if (data.__reserved.processed === 1 && !data.__reserved.deleted_after) {
        electronAPI.openViewer(data.__reserved.output_path, node.rowIndex);
        return;
      }
      if (!isUnprocessedRow(data)) {
        electronAPI.openViewer(data.__reserved.source.path, node.rowIndex);
        return;
      }
      const folder = await electronAPI.openFolderDialog();
      if (!folder || (typeof folder === 'object' && folder.error)) {
        return;
      }
      const replace_row = { ...data };
      const reserved = {
        ...replace_row.__reserved,
        destinationDirectory: folder,
      };
      replace_row.__reserved = reserved;
      dispatch({
        type: files_actions.UPDATE_FILE_ROW_WITHOUT_METADATA,
        payload: { idx: node.rowIndex, row: replace_row },
      });
    }
  )
}

export function setupRenameCellEditable(file_cols) {
  return addEditable(
    file_cols,
    '__reserved.rename',
    (params) => isUnprocessedRow(params?.data)
  )
}

export function setupRenameCellEditor(file_cols) {
  return addFieldToColumn(file_cols, '__reserved.rename', 'cellEditor', RenameCellEditor);
}

export function setupRenameValueGetter(file_cols, config) {
  return addFieldToColumn(
    file_cols,
    '__reserved.rename',
    'valueGetter',
    (params) => resolveOutputFilenameStem(params.data, config)
  );
}

export function setupRenameSingleClickEdit(file_cols) {
  return addFieldToColumn(file_cols, '__reserved.rename', 'singleClickEdit', true);
}

export const EDITABLE_NAMING_FIELDS = new Set([
  '__reserved.rename',
  '__reserved.labelText',
  '__reserved.qrPayload',
]);

/**
 * Build updated row for Redux after a naming-field edit (readOnlyEdit / onCellEditRequest).
 */
export function buildRowAfterNamingEdit(row, field, newValue) {
  const replace_row = { ...row };
  let reserved = replace_row.__reserved;
  if (!reserved) return replace_row;

  if (field === '__reserved.rename') {
    reserved = markNamingFieldSource(reserved, 'rename', NAMING_SOURCE.USER);
    reserved = { ...reserved, rename: newValue };
  } else {
    const namingField = field.replace('__reserved.', '');
    reserved = markNamingFieldSource(reserved, namingField, NAMING_SOURCE.USER);
    const nextValue = newValue != null ? String(newValue) : '';
    if (nextValue.trim() === '') {
      const updated = { ...reserved };
      delete updated[namingField];
      reserved = updated;
    } else {
      reserved = { ...reserved, [namingField]: nextValue };
    }
  }

  return { ...replace_row, __reserved: reserved };
}

export function setupRenameCellClass(file_cols) {
  return addCellClass(
    file_cols,
    '__reserved.rename',
    ({ data }) => isUnprocessedRow(data) ? 'editable copy-as naming-field' : ''
  )
}

export function setupRenameCellOnCellClicked(file_cols) {
  return addOnCellClicked(
    file_cols,
    '__reserved.rename',
    ({ data, node }) => {
      if (!canOpenViewerForRow(data)) return;
      if (data.__reserved.processed === 1 && !data.__reserved.deleted_after) {
        electronAPI.openViewer(data.__reserved.output_path, node.rowIndex);
      }
    }
  )
}

export function setupNamingFieldEditable(file_cols, field) {
  return addEditable(
    file_cols,
    field,
    (params) => isUnprocessedRow(params?.data)
  )
}

export function setupNamingFieldCellClass(file_cols, field) {
  return addCellClass(
    file_cols,
    field,
    ({ data }) => isUnprocessedRow(data) ? 'editable naming-field' : 'naming-field'
  )
}

export function setupNamingFieldSingleClickEdit(file_cols, field) {
  return addFieldToColumn(file_cols, field, 'singleClickEdit', true);
}

export const PREVIEW_DEFERRED_NAMING_FIELDS = new Set([
  '__reserved.labelText',
  '__reserved.qrPayload',
]);

export const PREVIEW_SEE_BELOW_PLACEHOLDER = '<see below>';

function seeBelowCellRenderer() {
  return (
    <span className="preview-see-below-placeholder">{PREVIEW_SEE_BELOW_PLACEHOLDER}</span>
  );
}

function stripEditableCellClass(cellClass) {
  if (typeof cellClass === 'function') {
    return (params) => String(cellClass(params) || '')
      .replace(/\beditable\b/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'naming-field';
  }
  return String(cellClass || '')
    .replace(/\beditable\b/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'naming-field';
}

/**
 * Output-name preview: Label/QR show placeholders; metadata columns stay editable for pattern testing.
 */
export function applyOutputPreviewColumnTweaks(columnDefs, fileCols = []) {
  const metadataFields = new Set(
    (fileCols || [])
      .map((col) => col?.field)
      .filter((field) => field && !String(field).startsWith('__')),
  );

  return columnDefs.map((col) => {
    const field = col.field;
    if (PREVIEW_DEFERRED_NAMING_FIELDS.has(field)) {
      const { singleClickEdit, editable, cellRenderer, ...rest } = col;
      return {
        ...rest,
        editable: false,
        cellRenderer: seeBelowCellRenderer,
        cellClass: stripEditableCellClass(col.cellClass),
      };
    }
    if (metadataFields.has(field)) {
      return {
        ...col,
        editable: (params) => isUnprocessedRow(params?.data),
        singleClickEdit: true,
        cellClass: (params) => {
          const base = typeof col.cellClass === 'function'
            ? col.cellClass(params)
            : col.cellClass;
          return isUnprocessedRow(params?.data)
            ? [base, 'editable'].filter(Boolean).join(' ')
            : base;
        },
      };
    }
    return col;
  });
}
