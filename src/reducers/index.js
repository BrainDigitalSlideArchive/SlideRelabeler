import {combineReducers} from "@reduxjs/toolkit";
import files from './files';
import app from './app';
import modal from './modal';
import config from './config';
import viewer from './viewer';
import dsa from './dsa';

export const root_reducer = combineReducers({
    files: files,
    app: app,
    modal: modal,
    config: config,
    viewer: viewer,
    dsa: dsa
});

export default root_reducer;