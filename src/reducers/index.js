import {combineReducers} from "@reduxjs/toolkit";
import files from './files';
import app from './app';
import modal from './modal';
import config from './config';
import viewer from './viewer';

export const root_reducer = combineReducers({
    files: files,
    app: app,
    modal: modal,
    config: config,
    viewer: viewer,
});

export default root_reducer;