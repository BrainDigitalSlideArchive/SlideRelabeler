import React from "react";
import {displayBytes, formatLeftEllipsis} from "./fe_helpers";
import * as files_actions from "../actions/files";
import {UPDATE_FILE_ROW_WITHOUT_METADATA} from "../actions/files";

export function addFieldToColumn(fileCols, match_field_header_class, field, field_value) {
  let outputFileCols = [...fileCols];
  for (let i= 0; i < fileCols.length; i++) {
    if (fileCols[i].field === match_field_header_class || fileCols[i].headerClass === match_field_header_class) {
      outputFileCols[i] = Object.assign({}, fileCols[i], {[field]: field_value});
    }
  }
  return outputFileCols;
}

export function addCellRenderer(fileCols, match_field_header_class, cellRenderer) {
  return addFieldToColumn(fileCols, match_field_header_class, 'cellRenderer', cellRenderer);
}

export function addValueFormatter(fileCols, match_field_header_class, valueFormatter) {
  return addFieldToColumn(fileCols, match_field_header_class, 'valueFormatter', valueFormatter);
}

export function addComparator(fileCols, match_field_header_class, comparator) {
  return addFieldToColumn(fileCols, match_field_header_class, 'comparator', comparator);
}

export function addCellClass(fileCols, match_field_header_class, cellClass) {
  return addFieldToColumn(fileCols, match_field_header_class, 'cellClass', cellClass);
}

export function addColSpan(fileCols, match_field_header_class, colSpan) {
  return addFieldToColumn(fileCols, match_field_header_class, 'colSpan', colSpan);
}

export function addOnCellClicked(fileCols, match_field_header_class, onCellClicked) {
  return addFieldToColumn(fileCols, match_field_header_class, 'onCellClicked', onCellClicked);
}

export function addEditable(fileCols, match_field_header_class, editable) {
  return addFieldToColumn(fileCols, match_field_header_class, 'editable', editable);
}

export function addValueSetter(fileCols, match_field_header_class, valueSetter) {
  return addFieldToColumn(fileCols, match_field_header_class, 'valueSetter', valueSetter);
}

export function setupRemoveColumn(fileCols, dispatch) {
  return addCellRenderer(
    fileCols,
    'remove-row',
    params => {
      return (
        <button
          className='__clear-row _remove-button'
          onClick={() => dispatch({type: files_actions.REMOVE_FILE, payload: params.data})}>
          X
        </button>
      )
    }
  )
}

export function setupThumbnailColumnOnCellClicked(fileCols) {
  return addOnCellClicked(
    fileCols,
    'source.path',
    (params) => params.data.processed === 1? electronAPI.openViewer(params.data.rename, params.node.rowIndex) : electronAPI.openViewer(params.data.source.path, params.node.rowIndex)
  )
}

export function setupThumbnailColumnCellRenderer(fileCols) {
  return addCellRenderer(
    fileCols,
    'source.path',
    params => {
      const thumbURL = window.encodeURIComponent(params.value);
      if (params.data.metadata) {
        return (
          <div className='__thumbnail _center-horizontally' title='Open in viewer'>
            <img src={`thumbnail://${thumbURL}`}></img>
          </div>
        )
      } else {
        return <>No thumbnail yet.</>
      }
    }
  )
}

export function setupAssociatedImagesColumn(fileCols) {
  return addCellRenderer(
    fileCols,
    'associatedImages',
    (params) => {
      // console.log('cellRenderer params', params)
      if (params.data.associatedImages) {
        const images = params.data.associatedImages;
        return <>{images.join(', ')}</>
      } else {
        return <>No associated images.</>
      }
    }
  )
}

export function setupDestinationDirectoryColumn(fileCols, targetDirectory) {
  return addCellRenderer(
    fileCols,
    'destinationDirectory',
    params => {
      if(params.data.processed !== 0) {
        return formatLeftEllipsis(params.data.rename);
      }
      const useSelectedDir = !params.value;
      const selectedDir = targetDirectory !== true && targetDirectory;
      const dir = formatLeftEllipsis(useSelectedDir ? ( selectedDir || '[Not selected]') : params.value);
      return <><span title={dir}>{dir}</span></>
    }
  )
}

export function setupProgressColumn(fileCols) {
  return addCellRenderer(
    fileCols,
    'processed',
    ({data}) => {
      return (
        <div className='progress-indicator center-horizontally'
             style={{'_done': `${Math.trunc(data.processed)}%`}}>
          {data.processed == 0 ? 'Not started' : `${data.processed * 100}%`}
        </div>
      )
    }
  )
}

export function setupRenameEditorColumn(fileCols, filename_config) {
  return addCellRenderer(
    fileCols,
    'rename',
    (params) => {
      if (params.data.processed === 0) {
        return (
          <>
            <div style={{display: 'flex', overflow: 'hidden'}} className='center-horizontally'>
              <span>
                {filename_config.use_prefix && filename_config.prefix}
              </span>
              {
                filename_config.use_uuid? <span>{params.data.uuid}</span> :
                  <span>
                    <input className={"__input-text"} value={params.value} onChange={() => null}/>
                  </span>
              }
              <span>
                {filename_config.use_suffix && filename_config.suffix}
              </span>
              <span>
                {params.data.source && params.data.source.parsed && params.data.source.parsed.ext}
              </span>
            </div>
          </>
        );
      } else {
        return '';
      }
    }
  )

}

export function setupSourceDirValueFormater(fileCols) {
  return addValueFormatter(
    fileCols,
    'source.directory',
    ({value}) => formatLeftEllipsis(value)
  )
}

export function setupSizeValueFormatter(fileCols) {
  return addValueFormatter(
    fileCols,
    'bytes',
    ({value}) => displayBytes(value)
  )
}

export function setupAssociatedImagesValueFormatter(fileCols) {
  return addValueFormatter(
    fileCols,
    'associatedImages',
    v => 'fake'
  )
}

export function setupAssociatedImagesComparator(fileCols) {
  return addComparator(
    fileCols,
    'associatedImages',
    (valA, valB) => valA.length - valB.length
  )
}

export function setupDestinationDirectoryCellClass(fileCols) {
  return addCellClass(
    fileCols,
    'destinationDirectory',
    params => params.data.processed === 0 ? 'directory left-ellipsis' : 'left-ellipsis'
  )
}

export function setupDestinationDirectoryColSpan(fileCols) {
  return addColSpan(
    fileCols,
    'destinationDirectory',
    params => params.data.processed === 0 ? 1 : 2
  )
}

export function setupDestinationDirectoryOnCellClicked(fileCols) {
  return addOnCellClicked(
    fileCols,
    'destinationDirectory',
    ({data}) => data.processed === 1 && electronAPI.openViewer(data.rename)
  )
}

export function setupRenameCellEditable(fileCols, filename_config) {
  return addEditable(
    fileCols,
    'rename',
    params => params.data.processed === 0 && !filename_config.use_uuid
  )
}

// dispatch({type: files_actions.UPDATE_FILE_ROW, payload: {idx: params.node.rowIndex, row: params.data}})

export function setupRenameCellValueSetter(fileCols, dispatch) {
  return addValueSetter(
    fileCols,
    'rename',
    params => {
      let field = params.column.colId;
      let replace_row = {...params.data};
      replace_row[field] = params.newValue;
      dispatch({type: files_actions.UPDATE_FILE_ROW_WITHOUT_METADATA, payload: {idx: params.node.rowIndex, row: replace_row}})
    }
  )
}

export function setupRenameCellClass(fileCols) {
  return addCellClass(
    fileCols,
    'rename',
    ({data}) => data.processed === 0 ? 'editable copy-as' : 'left-ellipsis copy-as copied-path'
  )
}

export function setupRenameCellOnCellClicked(fileCols) {
  return addOnCellClicked(
    fileCols,
    'rename',
    ({value, data}) => data.processed === 1 && electronAPI.openViewer(data.rename)
  )
}