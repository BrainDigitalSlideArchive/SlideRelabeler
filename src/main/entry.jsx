import React from 'react';
// import { createStore } from 'redux';
import ReactDOM from 'react-dom/client';

import { Provider } from 'react-redux';

import MainRouter from '../routers/MainRouter.jsx';

import store from '../store';
import './main.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MainRouter/>
    </React.StrictMode>,
  )