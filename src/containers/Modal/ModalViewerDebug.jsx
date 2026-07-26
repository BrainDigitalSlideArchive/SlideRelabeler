import React from 'react';

import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

import ModalHeader from './ModalHeader';

function ModalViewerDebug(props) {
  const { debug_status: debugStatus } = props;

  return (
    <div className="__modal">
      <ModalHeader title="Viewer debug" type="viewerDebug" />
      <div className="__content">
        {debugStatus ? (
          <div className="__message">
            <JSONPretty id="viewer-debug-pretty" data={debugStatus} />
          </div>
        ) : (
          <p>No debug status yet.</p>
        )}
      </div>
    </div>
  );
}

export default ModalViewerDebug;
