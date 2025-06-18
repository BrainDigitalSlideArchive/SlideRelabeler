import React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import OpenSeadragon from '../../components/OpenSeaDragon/OpenSeadragon';
import './ViewerWindow.css';

function ViewerWindow(props){
    let file;
    const [metadata, setMetadata] = useState(null);
    // const { file } = useParams();
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('file')) {
      file = useParams().file;
    } else {
      file = urlParams.get('file');
      console.log("File:", file);
    }

    useEffect(()=>{
        if(file){
            window.electronAPI.getMetadata(file).then(md => {
                md.file = file;
                setMetadata(md);
            })
        } else {
            console.log('No file found in query params')
            console.log(urlParams)
        }
    }, []);
    

    return (<>
        <div className='viewer-container'>
            {OpenSeadragon(metadata)}
        </div>
    </>)
}

export default ViewerWindow;