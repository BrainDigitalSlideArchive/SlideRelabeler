import React from 'react';
import ReactDOM from 'react-dom/client';

import '../containers/ViewerWindow/ViewerWindow.css';
import MainRouter from '../routers/MainRouter'



ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MainRouter/>
    </React.StrictMode>
  )