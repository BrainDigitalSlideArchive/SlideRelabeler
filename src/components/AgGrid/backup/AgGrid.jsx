
import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react'; // React Grid Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import "../AgGrid.scss";
import { displayBytes } from '../../main/displaybytes.js'


const KEY_LEFT = 'ArrowLeft';
const KEY_UP = 'ArrowUp';
const KEY_RIGHT = 'ArrowRight';
const KEY_DOWN = 'ArrowDown';
const KEY_PAGE_UP = 'PageUp';
const KEY_PAGE_DOWN = 'PageDown';
const KEY_PAGE_HOME = 'Home';
const KEY_PAGE_END = 'End';

const RenameEditor = ({ value, onValueChange, data }) => {
    const onKeyDown = (event) => {
        const key = { event };

        const isNavigationKey = key === KEY_LEFT ||
            key === KEY_RIGHT ||
            key === KEY_UP ||
            key === KEY_DOWN ||
            key === KEY_PAGE_DOWN ||
            key === KEY_PAGE_UP ||
            key === KEY_PAGE_HOME ||
            key === KEY_PAGE_END;

        if (isNavigationKey) {
            // this stops the grid from receiving the event and executing keyboard navigation
            event.stopPropagation();
        }
    }

    if(data.processed === 0){
      return (
        <>
          <div style={{display:'flex', overflow:'hidden'}} className='center-horizontally'>
            <span>
              <input style={{'flexGrow':1}} 
                     value = {value} 
                     onChange={({target:{value: newValue}}) => { if(data.processed===0) {onValueChange(newValue);} data.rename=newValue; } } 
                     onKeyDownCapture={onKeyDown}>
               </input>
            </span>
            <span>{data.source.parsed.ext}</span>
          </div>
        </>
      );
    } else {
      return '';
    }
    
};

// const colDefs = useRef([]);

export function AgGrid({files,
                 targetDirectory,
                 filesRef,
                 gridApiRef,
                 setFiles,
                 updateCount,
                 findMetadataIfNecessary
}){
  // console.log('fileList triggered', files, files===window.files)
  const rowData = files;

  const colDefs = [
    // pinned left column to clear individual rows
    { headerClass:'remove-row', width:5, resizable:false, sortable:false, pinned:'left', cellClass:'remove-row', cellRenderer:(params)=>{
      return <><button className = 'clear-row x-button' alt='Remove row' onClick={()=>{
        const files = filesRef.current;
        files.splice(files.indexOf(params.data), 1);
        setFiles(files);
        updateCount(files);
      }}>X</button></>
    }},

    // directory
    {headerName: 'Directory', width:120, field: 'source.directory', cellClass:'directory left-ellipsis' , valueFormatter:({value})=>formatLeftEllipsis(value)},

    // filename
    {headerName:'File name', field:'source.filename', cellClass:'filename', cellRenderer:(params)=>{
      return <><span title={params.value}>{params.value}</span></>
    }},
  
    // Thumbnail for original image
    { headerName:'Thumb', field: 'source.path', cellRenderer:(params) => {
        const thumbURL = window.encodeURIComponent(params.value);
        if(params.data.metadata){
          return <><div className='thumbnail center-horizontally' title='Open in viewer'><img src={`thumbnail://${thumbURL}`}></img></div></>
        } else {
          return <>Fetching...</>
        }
      },
      onCellClicked:({value})=>electronAPI.openViewer(value)
    },

    // size in bytes
    { headerName:'Size', field:'size', valueFormatter:({value})=>displayBytes(value)

    },

    // Associated images
    { headerName: 'Associated Images', 
      field: 'associatedImages', 
      valueFormatter:v=>'fake',
      cellClass:'associated-images',
      cellRenderer:(params)=>{
        // console.log('cellRenderer params', params)
        if(params.data.associatedImages){
          const images=params.data.associatedImages;
          return <>{images.join(', ')}</>
        } else {
          // params.data.refreshCell = params.refreshCell;
          params.data.rowNode = params.node;
          return <>Loading...</>
        }  
      },
      comparator:(valA, valB) => {
        return valA.length - valB.length
      }
    },

    // Destination directory
    { field: 'destinationDirectory', 
      headerName: 'Copy to', 
      width:120, 
      cellClass:params=>params.data.processed===0 ? 'directory left-ellipsis' : 'left-ellipsis', 
      cellRenderer:params=>{
        if(params.data.processed !== 0) {
          return formatLeftEllipsis(params.data.rename);
        }
        const useSelectedDir = !params.value;
        const selectedDir = targetDirectory !== true && targetDirectory;
        const dir = formatLeftEllipsis(useSelectedDir ? ( selectedDir || '[Not selected]') : params.value);
        return <><span title={dir}>{dir}</span></>
      },
      colSpan:params=>{
        return params.data.processed === 0 ? 1 : 2;
      },
      onCellClicked:({data})=>data.progress === 100 && electronAPI.openViewer(data.rename)
    },
    
    // Rename
    { headerName: 'Renamed as', 
      field: 'rename',
      cellEditor: RenameEditor, 
      editable:params=>params.data.processed===0, 
      cellRenderer: RenameEditor, 
      cellClass:({data})=>data.processed === 0 ? 'editable copy-as' : 'left-ellipsis copy-as copied-path',
      singleClickEdit:true,
      
      onCellClicked:({value, data})=>data.processed && electronAPI.openViewer(value)
    },
    
    // Progress indicator
    { headerName: 'Progress', field: 'processed', pinned:'right', width:150, resizable:false, cellRenderer:(params)=>{
      return <>
        <div className='progress-indicator center-horizontally' style={{'--done': `${Math.trunc(params.data.progress)}%`}} >
          {params.data.processed === 0 ? 'Not started' : params.data.progress.toFixed(2) + '%'}
        </div>
      </>
    }}
  ];

  return (
    // Container
    <div className="ag-theme-quartz"
          style={{
            height: '100%',
            width: '100%'
          }}
    >
      {/* The AG Grid component */}
      <AgGridReact ref={gridApiRef}
                   rowData={rowData} 
                   columnDefs={colDefs}
                   getRowId = {params => params.data.id} 
                   autoSizeStrategy={{type: 'fitCellContents'}} 
                   onRowDataUpdated={ findMetadataIfNecessary }
                   suppressMovableColumns={true}
                   ensureDomOrder={true}
                   suppressDragLeaveHidesColumns={true}
                   enableCellTextSelection = {true}
                   undoRedoCellEditing = {true}
                   undoRedoCellEditingLimit = {20}
                   reactiveCustomComponents
                  //  debug
                   />
    </div>
  )
}