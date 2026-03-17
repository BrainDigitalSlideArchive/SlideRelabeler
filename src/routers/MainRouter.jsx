import React from "react";
import {Router} from "./main-electron-router";
import {Route} from "react-router-dom";
import {Provider} from "react-redux";

import store from '../store/index';
import viewer_store from '../store/viewer/index';

import App from "../containers/App/App";
import Viewer from "../containers/Viewer/Viewer";

const MainRouter = () => {
    return [
        <Router
            key="main-router"
            main={
              <Route key="main" path="/" element={<Provider store={store}><App/></Provider>}/>
            }
            viewer={
              <Route key="viewer" path="/" element={<Provider store={viewer_store}><Viewer/></Provider>}>
                <Route key="viewer-file" path={":file"} element={<Provider store={viewer_store}><Viewer/></Provider>}/>
                <Route key="viewer-root" path={""} element={<Provider store={viewer_store}><Viewer/></Provider>}/>
              </Route>
            }
        />,

    ]
};

export default MainRouter;