import { useState, useEffect, useRef } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '../../public/vite.svg'
import bdsaLogo from '../assets/BDSA_folder_clear.png'
import './App.css';
import { AgGridReact } from 'ag-grid-react'; // React Grid Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme


function App() {
  const [count, setCount] = useState(0);
  const [targetDirectory, setTargetDirectory] = useState(null);

  const [files, setFiles] = useState([]);

  const loaded = useRef(null);
  const gridApiRef = useRef(null);
  
  useEffect(()=>{
    if(loaded.current){
      return;
    }
    loaded.current = true;

    console.log('Adding event listeners');

    electronAPI.onLog( data => console.log('Data from electronAPI.onLog:',data) );
    
  }, []);

  function folderPicked(d){
    console.log('folderPicked', d);
    setTargetDirectory(d);
  }
  function noFolder(d){
    console.log('noFolder', d);
    setTargetDirectory(null);
  }

  function filesPicked(list){

    const allFiles = [...files, ...list];
    
    for(const file of list){
      file.rename = file.filename;

      electronAPI.openFile(file.path).then(d => {

        console.log('openFile (print path)', d)
        return;
        
        // console.log('Success opening file', file.filename, file, d)
        file.associatedImages = d.associatedImages;
        
        const ct = allFiles.reduce((count, f)=>{
          console.log(count, f)
          if(f.associatedImages) count += 1;
          return count;
        }, 0)
        console.log('setting count', ct)
        setCount(ct);
        if(file.rowNode){
          // console.log('Refreshing cell');
          file.rowNode.setData(file);
        }
      }).catch(e => {
        console.log('Error opening file', file.filename, e)
      });
    }

    setFiles([...files, ...list]);

    if(gridApiRef.current){
      gridApiRef.current.sizeColumnsToFit();
    }
  }
  function noFiles(){
    fetch('test://whodat').then(d=>d.text()).then(d=>console.log(d)).catch(e=>console.log('error',e))
  }

  function headerInfo(){
    if(files.length === 0){
      return <>Select files to inspect and process</>
    } else {
      return <>Found info for {count} of {files.length} files; {files.length - count} remaining.</>
    }
  }

  function targetInfo(){
    if(targetDirectory){
      return <>Copy to: {targetDirectory}</>
    } else {
      return <>Please select a directory to copy files into</>
    }
  }

  const fileList = (files)=>{
    console.log('Files', files)
    const rowData = files;
    const colDefs = [
      {field: 'path', headerName: 'Thumbnail', cellRenderer:(params) => {
        return <><div className='thumbnail' title='Open in viewer'><img src={`thumbnail://${params.value}`}></img></div></>
      }},
      {field: 'filename', headerName: 'File name'},
      {field: 'directory', headerName: 'Directory'},
      {
        field: 'associatedImages', 
        headerName: 'Associated Images', 
        valueFormatter:v=>'fake',
        cellRenderer:(params)=>{
          // console.log('cellRenderer params', params)
          if(params.data.associatedImages){
            const images=params.data.associatedImages;
            return <>{params.data.associatedImages.join(', ')}</>
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
      {field: 'rename', headerName: 'Rename to', editable: true}
      
    ];
    function clickHandler(ev){
      if(ev.colDef.field === 'path'){
        electronAPI.openViewer(ev.value);
      }
    }
    const autoSizeStrategy = {
      type: 'fitCellContents'
    };
  
    return (
      // Container
      <div className="ag-theme-quartz"
            style={{
              height: '100%',
              width: '100%'
            }}
      >
        {/* The AG Grid component */}
        <AgGridReact rowData={rowData} 
                     columnDefs={colDefs} 
                     autoSizeStrategy={autoSizeStrategy} 
                     onGridReady={ ev=>gridApiRef.current=ev.api }
                     onCellClicked={ clickHandler }/>
      </div>
    )
  }

  return (
    <>
      <div className='main-layout'>
        <div className='main-controls'>
          <img src={bdsaLogo} className = 'logo' alt = 'Brain Digital Slide Archive Logo'/>
          <div>
            <div>
              <button onClick={()=>electronAPI.openFileDialog().then(filesPicked).catch(noFiles)}>Add files</button>
              <span>{headerInfo()}</span>
            </div>
            <div>
              <button onClick={()=>setFiles([])}>Clear list</button>
            </div>
          </div>
          
          
        </div>
        <div id='table-topbar'>
          <label>Copy to:</label><span className="copy-target">{targetInfo()}</span>
          <button onClick={()=>electronAPI.openFolderDialog().then(folderPicked).catch(noFolder)}>Choose</button>
        </div>
        
        
        <div id='table'>
          {fileList(files)}
        </div>
      </div>
    </>
  )
}

export default App
