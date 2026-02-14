import {combineReducers} from "@reduxjs/toolkit";
import files from './files';
import app from './app';
import modal from './modal';
import config from './config';
import viewer from './viewer';
import debug from './debug';
import dsa from './dsa';
import esm from './esm';

export const root_reducer = combineReducers({
    files: files,
    app: app,
    modal: modal,
    config: config,
    viewer: viewer,
    debug: debug,
    dsa: dsa,
    esm: esm
});

export default root_reducer;