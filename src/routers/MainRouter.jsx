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
            main={
              <Route path="/" element={<Provider store={store}><App/></Provider>}/>
            }
            viewer={
              <Route path="/" element={<Provider store={viewer_store}><Viewer/></Provider>}>
                <Route path={":file"} element={<Provider store={viewer_store}><Viewer/></Provider>}/>
                <Route path={""} element={<Provider store={viewer_store}><Viewer/></Provider>}/>
              </Route>
            }
        />,

    ]
};

export default MainRouter;