import { useState, useEffect, useRef, useMemo } from 'react'
// import reactLogo from '../assets/react.svg'
// import viteLogo from '../../public/vite.svg'
import bdsaLogo from '../assets/BDSA_folder_clear.png'
import './App.css';
// import { AgGridReact } from 'ag-grid-react'; // React Grid Logic
// import "ag-grid-community/styles/ag-grid.css"; // Core CSS
// import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { AgGrid } from './AgGrid.jsx';
import { displayBytes } from './displaybytes.js';

/**
 * 
 * @returns the component to render that defines the application
 */
function App() {
  const [count, setCount] = useState(0);
  const [targetDirectory, setTargetDirectory] = useState(null);
  const [relabelingState, setRelabelingState] = useState(null);
  const [totalBytes, setTotalBytes] = useState(0);
  const [remainingBytes, setRemainingBytes] = useState(0);

  const loaded = useRef(null);
  const gridApiRef = useRef(null);

  const isRelabeling = useRef(false);
  const findingMetadata = useRef(false);
  const fileId = useRef(0);

  const [files, setFileState] = useState([]);
  const filesRef = useRef(null);
  const setFiles = (arr)=>{
    const newArr = [...arr];
    setFileState(newArr);
    filesRef.current = newArr;

    const allTargetDirectoriesSpecified = newArr.length > 0 && newArr.filter(f=>!f.destinationDirectory).length === 0;
    if(targetDirectory === true && !allTargetDirectoriesSpecified){
      setTargetDirectory();
    } else if (!targetDirectory && allTargetDirectoriesSpecified){
      setTargetDirectory(true);
    }
    
  }
  
  // Guard against creating the component twice
  useEffect(()=>{
    if(loaded.current){
      return;
    }
    loaded.current = true;

    console.log('Adding event listeners');

    electronAPI.onLog( data => console.log('Data from electronAPI.onLog:',data) );
    
  }, []);


  /**
   * Process the list of files chosen by the user to prepare for displaying it
   * @param {Array} list 
   */
  function filesPicked(list){

    // add extra fields to each of the objects
    for(const file of list){

      if(file.destination?.parsed.root){
        // fully specified path was given for the destination file
        file.destinationDirectory = file.destination.parsed.dir;
        file.rename = file.destination.parsed.name;
      } else {
        // destination not fully specified
        if(file.destination?.parsed.name){
          // a name was given - use it, prepending any directories
          file.rename = file.destination.parsed.name;
          if(file.destination.parsed.dir){
            file.rename = file.destination.parsed.dir + file.destination.sep + file.rename;
          }
        } else {
          file.rename = file.source.parsed.name;
        }
      }
      file.processed = 0;
      file.progress = 0;
      file.copiedBytes = 0;
      file.id = fileId.current;
      fileId.current += 1;
    }

    setFiles([...files, ...list]);

  }


  function displayErrorMsg(msg){
    alert(msg);
  }


  /**
   * Updates the state variables about the number of files that have been processed and their total sizes
   * @param {Array} files 
   */
  function updateCount(files){
    // console.log('updateCount; num files = ', files.length)
    const ct = files.reduce((count, f)=>{
      // console.log(count, f)
      if(f.metadata) count += 1;
      return count;
    }, 0)
    // console.log('setting count', ct)
    setCount(ct);

    setTotalBytes(files.reduce((total, f)=>total + f.size, 0))
    setRemainingBytes(files.reduce((total, f)=>total + f.size-f.copiedBytes, 0))

  }


  /**
   * Query and update the metadata for the file
   */
  function findMetadataIfNecessary(){
    if(!findingMetadata.current){
      // find the next file that needs to have metadata updated
      let file;
      gridApiRef.current?.api.forEachNodeAfterFilterAndSort(node=>{
        if(!file && !node.data.metadata){
          file = node.data;
        }
      });
      if(file){

        findingMetadata.current = true;
        electronAPI.getMetadata(file.source.path).then(d => {

          file.associatedImages = d.associatedImages;
          file.metadata = d.metadata;
          file.size = d.bytes;
          file.displayBytes = displayBytes(d.bytes);
          file.rowNode?.setData(file);
          console.log('set metadata', file.id)
  
        }).catch(e => {
          console.log('Error opening file', file.filename, e);
          file.metadata = {error:e}
          file.associatedImages = ['Error']
        }).then(()=>{
          // console.log
          updateCount(files);
          findingMetadata.current = false;
          findMetadataIfNecessary();
        });// keep finding anything that is missing metadata
      } else {
        findingMetadata.current = false;
      }
    }
  }


  /**
   * 
   * @returns the next file to process, or the currently processing one
   */
  function getNextUnprocessedFile(){
    const array = [];
    gridApiRef.current?.api.forEachNodeAfterFilterAndSort(node=>{
      if(node.data.processed === 0 || node.data.processed === 'In progress'){
        array.push(node.data);
      }
    });
    const inProgress = array.filter(a => a.processed === 'In progress')[0];
    
    return inProgress || array[0];
  }

  /**
   * Start copy and relabel operation
   */
  function startCopyAndRelabel(){
    
    isRelabeling.current = true;

    const nextFileToProcess = getNextUnprocessedFile();
    if(nextFileToProcess?.processed === 0){
      processNextFile(nextFileToProcess);
    }
  }



  /**
   * Cancel the copy and relabel process
   */
  function cancelCopyAndRelabel(){
    isRelabeling.current = false;
    setRelabelingState(false);
  }


  /**
   * Process the next unprocessed file, if one isn't already in progress
   * @param {string} file The fully resolved file path of the file to process 
   */
  function processNextFile(file){
    if(!file){
      file = getNextUnprocessedFile();
    } 

    if(file){
      file.processed = 'In progress';

      setFiles(files); // trigger a re-render with the new file status
      const interval = setInterval(()=>{
        electronAPI.getCopyProgress(file.id).then(d=>{
          file.rename = d.path;
          file.progress = 100 * d.size / file.size;
          file.copiedBytes = d.size;
          
          setFiles(files);
          updateCount(files);
        });
      }, 100);
      const fileInfo = {
        id:file.id,
        path: file.source.path,
        rename: file.rename + file.source.parsed.ext,
        targetDirectory: file.destinationDirectory || targetDirectory
      }

      electronAPI.processFile(fileInfo).then(d => {
        clearInterval(interval);
        file.processed = d.errno ? 'Error' : 'OK';
        file.progress = 100;
        file.copiedBytes = file.size;
        file.rename = d;
        
        updateCount(files);
        setFiles(files);

        // if we are supposed to still be processing the list, do the next one
        if(isRelabeling.current){
          processNextFile()
        } 

      })
    }

  }

  /**
   * 
   * @returns The component for displaying the status of the app
   */
  function headerInfo(){
    if(files.length === 0){
      return <>Select files to inspect and process</>
    } else if(count < files.length) {
      return <>Found info for {count} of {files.length} files; {files.length - count} remaining.</>
    } else {
      return <>Total size: {displayBytes(totalBytes)} for {files.length} files. {displayBytes(remainingBytes)} left to copy.</>
    }
  }

  /**
   * The component that controls selecting and displaying the directory to copy into
   * @returns the component to render
   */
  function targetOfCopyRelabel(){
    function button(){
      if(relabelingState){
        return <><button onClick={()=>cancelCopyAndRelabel()}>Abort processing</button></>
      } else {
        return <><button onClick={()=>startCopyAndRelabel()} disabled={files.filter(f=>f.processed===0).length===0}>Make relabeled copies</button></>
      }
    }
    
    if(targetDirectory){
      if(relabelingState){
        return button()
      } else if(targetDirectory === true){
        return button()
      } else {
        return <>
          <div className='topbar-do-copy align-center'>
              {button()}
              <label>Copy to:</label>{targetDirectory} 
              <button className = 'cancel-selection x-button' alt='Clear selection' onClick={()=>setTargetDirectory()}>X</button>
          </div>
        </>
      } 
    } else {
      return <>
        <button onClick={()=>electronAPI.openFolderDialog().then(d=>setTargetDirectory(d)).catch(d=>setTargetDirectory())}>Choose</button>
        <span>Select a directory to copy files into</span>
      </>
    }
  }


  // Make the Ag Grid component; re-render when files or targetDirectory change
  const agGrid = useMemo(()=>AgGrid({files,
                                     targetDirectory,
                                     filesRef,
                                     gridApiRef,
                                     setFiles,
                                     updateCount,
                                     findMetadataIfNecessary
                                    }),[files, targetDirectory])

  // Return the component for App
  return (
    <>
      <div id='main-layout'>
        <div id='main-controls'>
          <img src={bdsaLogo} className = 'logo' alt = 'Brain Digital Slide Archive Logo'/>
          <div id='list-controls'>
            {/* First row */}
            <button onClick={()=>electronAPI.openFileDialog().then(files=>{
              if(files.error){
                console.log('Throwing new error', files.message);
                throw new Error(files.message);
              }
              filesPicked(files)
            }).catch(displayErrorMsg)}>Add files</button>
            <span>{headerInfo()}</span>

            {/* Second row */}
            <button onClick={()=>{
              setFiles([]);
            }}>Clear list</button>
            
          </div>
        </div>

        <div id='table-topbar'>
          <span className="copy-target">{targetOfCopyRelabel()}</span>
        </div>
        
        <div id='table'>
          {agGrid}
        </div>
      </div>
    </>
  )
}

export default App
