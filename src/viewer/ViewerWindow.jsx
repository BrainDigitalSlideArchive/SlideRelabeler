import OpenSeadragonViewer from './OpenSeadragonViewer.jsx';
import './ViewerWindow.css';
import { useState, useEffect } from 'react';

function ViewerWindow(){
    const [metadata, setMetadata] = useState(null);

    const urlParams = new URLSearchParams(window.location.search);
    const file = urlParams.get('file');
    // console.log(file);
    // if(file){
    //     window.electronAPI.openFile(file).then(md => {
    //         console.log('openFile returned', md);
    //         metadataRef.current = md;
    //     })
    // } else {
    //     console.error('No file found in query params')
    //     console.log(urlParams)
    // }

    window.electronAPI.onLog( data => console.log('Data from electronAPI.onLog:',data) );

    useEffect(()=>{
        if(file){
            window.electronAPI.getMetadata(file).then(md => {
                console.log('openFile returned', md);
                md.file = file;
                setMetadata(md);
            })
        } else {
            console.error('No file found in query params')
            console.log(urlParams)
        }
    }, []);
    

    return (<>
        <div className='viewer-container'>
            {OpenSeadragonViewer(metadata)}
        </div>
    </>)
}

export default ViewerWindow;