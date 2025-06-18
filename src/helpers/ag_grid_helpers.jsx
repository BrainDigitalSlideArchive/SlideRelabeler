import React from "react";
import {displayBytes, formatLeftEllipsis} from "./fe_helpers";
import * as files_actions from "../actions/files";
import {UPDATE_FILE_ROW_WITHOUT_METADATA} from "../actions/files";

export function addFieldToColumn(file_cols, match_field_header_class, field, field_value) {
  let outputFileCols = [...file_cols];
  for (let i= 0; i < file_cols.length; i++) {
    if (file_cols[i].field === match_field_header_class || file_cols[i].headerClass === match_field_header_class) {
      outputFileCols[i] = Object.assign({}, file_cols[i], {[field]: field_value});
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

export function setupRemoveColumn(file_cols, processing, disable_changes, dispatch) {
  return addCellRenderer(
    file_cols,
    'remove-row',
    params => {
      if (processing || disable_changes) {
        return <div className="__remove-row-placeholder"/>
      } else {
        return (
          <button
            className='__clear-row _remove-button'
            onClick={() => dispatch({type: files_actions.REMOVE_FILE, payload: params.node.rowIndex})}>
            X
          </button>
        )
      }
    }
  )
}

export function setupThumbnailColumnOnCellClicked(file_cols) {
  return addOnCellClicked(
    file_cols,
    '__reserved.source.path',
    (params) => params.data.__reserved.processed === 1? electronAPI.openViewer(params.data.__reserved.output_path) : electronAPI.openViewer(params.data.__reserved.source.path, params.node.rowIndex)
  )
}

export function setupRenameCellRenderer(file_cols, filename_config) {
  return addCellRenderer(
    file_cols,
    '__reserved.rename',
    params => {
      if (params.data.__reserved.processed === 1) {
        return <span>{params.data.__reserved.output_path}</span>
      } else if (params.data.__reserved.processed !== 1 && filename_config.use_uuid) {
        return <span>{filename_config.use_prefix && filename_config.prefix}{params.data.__reserved.uuid}{filename_config.use_suffix && filename_config.suffix}</span>
      } else if (params.data.__reserved.processed !== 1 && !filename_config.use_uuid) {
        return <span>{filename_config.use_prefix && filename_config.prefix}{params.data.__reserved.rename}{filename_config.use_suffix && filename_config.suffix}</span>
      }
    }
  )
}

export function setupThumbnailColumnCellRenderer(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.source.path',
    params => {
      const thumbURL = window.encodeURIComponent(params.value);
      if (params.data.__reserved && params.data.__reserved.metadata) {
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

export function setupAssociatedImagesColumn(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.associatedImages',
    (params) => {
      // console.log('cellRenderer params', params)
      if (params.data.__reserved && params.data.__reserved.associatedImages) {
        const images = params.data.__reserved.associatedImages;
        return <>{images.join(', ')}</>
      } else {
        return <>No associated images.</>
      }
    }
  )
}

export function setupDestinationDirectoryColumn(file_cols, targetDirectory) {
  return addCellRenderer(
    file_cols,
    'reserved.destinationDirectory',
    params => {
      if(params.data.reserved.processed !== 0) {
        return params.data.reserved.destinationDirectory;
      }
      return params.value? params.value : '[Not selected]'
    }
  )
}

export function setupProgressColumn(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.progress',
    ({data}) => {
      return (
        <div className={'__progress-indicator'}>
          <div className={'__progress-indicator-fill'} style={data.__reserved.progress && data.__reserved.progress !== 0 ? {width: `${Math.trunc(data.__reserved.progress)}%`} : {width: '0%'}}>
            
          </div>
          <div className={'__progress-indicator-text'}>
          {data.__reserved.progress && data.__reserved.progress !== 0 ? `${Math.trunc(data.__reserved.progress)}%` : 'Not started'}
          </div>
        </div>
      )
    }
  )
}

export function setupRenameEditorColumn(file_cols, filename_config) {
  return addCellRenderer(
    file_cols,
    '__reserved.rename',
    (params) => {
      if (params.data.__reserved.processed === 0) {
        return (
          <>
            <div style={{display: 'flex', overflow: 'hidden'}} className='center-horizontally'>
              <span>
                {filename_config.use_prefix && filename_config.prefix}
              </span>
              {
                filename_config.use_uuid? <span>{params.data.__reserved.uuid}</span> :
                  <span>
                    <input className={"__input-text"} value={params.value} onChange={() => null}/>
                  </span>
              }
              <span>
                {filename_config.use_suffix && filename_config.suffix}
              </span>
              <span>
                {params.data.__reserved && params.data.__reserved.source && params.data.__reserved.source.parsed && params.data.__reserved.source.parsed.ext}
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

export function setupTooltipValueGetter(file_cols) {
  let output_file_cols = [];

  function tooltipValueGetter(params) {
    if (params.data.__reserved.error) {
      return params.data.__reserved.error;
    }
    else if (!params.data.__reserved.bytes) {
      return "Loading metadata...";
    }
    else {
      return null;
    }
  }

  for (let i = 0; i < file_cols.length; i++) {
    let output_file_col = Object.assign({}, file_cols[i]);
    output_file_col.tooltipValueGetter = tooltipValueGetter;
    output_file_cols.push(output_file_col);
  }

  return output_file_cols;
}

export function setupSourceDirValueFormater(file_cols) {
  return addValueFormatter(
    file_cols,
    '__reserved.source.directory',
    ({value}) => value
  )
}

export function setup_source_directory_cell_renderer(file_cols) {
  return addCellRenderer(
    file_cols,
    '__reserved.source.directory',
    ({value}) => {
      return <div className="__source-directory">{value}</div>
    }
  )
}

export function setupSizeValueFormatter(file_cols) {
  return addValueFormatter(
    file_cols,
    '__reserved.bytes',
    ({value}) => displayBytes(value)
  )
}

export function setupAssociatedImagesValueFormatter(file_cols) {
  return addValueFormatter(
    file_cols,
    '__reserved.associatedImages',
    v => 'fake'
  )
}

export function setupAssociatedImagesComparator(file_cols) {
  return addComparator(
    file_cols,
    '__reserved.associatedImages',
    (valA, valB) => valA.length - valB.length
  )
}

export function setupDestinationDirectoryCellClass(file_cols) {
  return addCellClass(
    file_cols,
    '__reserved.destinationDirectory',
    params => params.data.__reserved.processed === 0 ? 'directory left-ellipsis' : 'left-ellipsis'
  )
}

export function setupDestinationDirectoryColSpan(file_cols) {
  return addColSpan(
    file_cols,
    '__reserved.destinationDirectory',
    params => params.data.__reserved.processed === 0 ? 1 : 2
  )
}

export function setupDestinationDirectoryOnCellClicked(file_cols) {
  return addOnCellClicked(
    file_cols,
    '__reserved.destinationDirectory',
    ({data}) => data.__reserved.processed === 1 && electronAPI.openViewer(data.__reserved.output_path)
  )
}

export function setupRenameCellEditable(file_cols, filename_config) {
  return addEditable(
    file_cols,
    '__reserved.rename',
    params => params.data.__reserved.processed === 0 && !filename_config.use_uuid
  )
}

// dispatch({type: files_actions.UPDATE_FILE_ROW, payload: {idx: params.node.rowIndex, row: params.data}})

export function setupRenameCellValueSetter(file_cols, dispatch) {
  return addValueSetter(
    file_cols,
    '__reserved.rename',
    params => {
      let replace_row = {...params.data};      
      let reserved = replace_row.__reserved;
      reserved = Object.assign({}, reserved, {rename: params.newValue});
      replace_row = Object.assign({}, replace_row, {__reserved: reserved});
      dispatch({type: files_actions.UPDATE_FILE_ROW_WITHOUT_METADATA, payload: {idx: params.node.rowIndex, row: replace_row}})
    }
  )
}

export function setupRenameCellClass(file_cols) {
  return addCellClass(
    file_cols,
    '__reserved.rename',
    ({data}) => data.__reserved.processed === 0 ? 'editable copy-as' : ''
  )
}

export function setupRenameCellOnCellClicked(file_cols) {
  return addOnCellClicked(
    file_cols,
    '__reserved.rename',
    ({value, data}) => data.__reserved.processed === 1 && electronAPI.openViewer(data.__reserved.output_path)
  )
}