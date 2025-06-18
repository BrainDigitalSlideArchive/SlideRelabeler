import OpenSeadragon from 'openseadragon';
import React, { useState, useEffect, useRef } from 'react';
import { AnnotationToolkit } from 'osd-paperjs-annotation';

import './OpenSeadragon.scss';

export default function OSD(props){
    const viewerRef = useRef(null);
    useEffect(()=>{
        if(viewerRef.current || !props){
            return;
        }
        
        let tileSources = makeTileSources(props);


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
    const {metadata, associatedImages} = props;

    // todo: move to helpers with singleTileSource replacement

    let tileSources = [];
    if(metadata.tileWidth == metadata.sizeX && metadata.tileHeight == metadata.sizeY){
        tileSources.push( makeSimpleImageTileSource(props.file) );
    } else {
        tileSources.push( makeTiledImageTileSource(props.file, metadata) );
    }

    tileSources = tileSources.concat(makeAssociatedImageSources(props.file, associatedImages));
    return tileSources;
}

function makeSimpleImageTileSource(file){
    return {
        name: file,
        type: 'image',
        url: `tile://` + window.encodeURIComponent(`${file}|0|0|0`)
    }
}

function makeTiledImageTileSource(file, props){
    return {
        name: file,
        height: props.sizeY,
        width:  props.sizeX,
        tileSize: props.tileWidth,
        minLevel: 0,
        maxLevel: props.levels - 1,
        getTileUrl: function( level, x, y ){
            return `tile://` + window.encodeURIComponent(`${file}|${level}|${x}|${y}`);
        }
    }
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