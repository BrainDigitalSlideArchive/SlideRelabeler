import OpenSeadragonViewer from './osd.jsx';
import './ViewerWindow.css';
import { useRef, useState, useEffect } from 'react';

function ViewerWindow(){
    const metadataRef = useRef({});

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

    useEffect(()=>{
        if(file){
            window.electronAPI.openFile(file).then(md => {
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