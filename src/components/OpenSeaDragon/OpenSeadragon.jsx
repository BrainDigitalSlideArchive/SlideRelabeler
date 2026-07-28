import OpenSeadragon from 'openseadragon';
import React, { useEffect, useRef } from 'react';

import {
  readSlideTileMetadata,
  makeWsiTileSource,
} from '../../helpers/osd_tile_source';

import './OpenSeadragon.scss';

export default function OSD(props){
    const viewerRef = useRef(null);
    useEffect(()=>{
        if(viewerRef.current || !props){
            return;
        }
        
        let tileSources = makeTileSources(props);
        if (!tileSources.length) {
            return;
        }

        viewerRef.current = new OpenSeadragon({
            id: 'osd',
            prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
            tileSources: tileSources[0],
            // sequenceMode: tileSources.length > 1,
            drawer:'webgl',
            maxImageCacheCount:1000,
        });

        viewerRef.current.addHandler('open', onImageOpened);

        window.viewer = viewerRef.current;
        // Uncomment when ready to work on annotation features
        // window.tk = new AnnotationToolkit(viewerRef.current);
        // window.tk.addAnnotationUI();

        return ()=>{
            // window.tk.destroy();
            // window.tk = null;
        }
    }, [props]);



    return (
        <div id={'osd'} className='osdviewer'></div>
    )
}

function onImageOpened(event){
    if(event.source && event.source.name){
        document.title = event.source.name;
    } else {
        document.title = 'OpenSeadragon Viewer';
    }
}

function makeTileSources(props){
    const {metadata, associatedImages, file} = props;
    const meta = readSlideTileMetadata(metadata);
    if (!meta || !file) {
        return [];
    }

    let tileSources = [makeWsiTileSource(file, meta)];
    tileSources = tileSources.concat(makeAssociatedImageSources(file, associatedImages || []));
    return tileSources;
}

function makeAssociatedImageSources(file, a){
    return a.map(image => {
        return {
            name: `${image} associated with ${file}`,
            type: 'image',
            url: `image://` + window.encodeURIComponent(`${file}|${image}`)
        }
    });
}
