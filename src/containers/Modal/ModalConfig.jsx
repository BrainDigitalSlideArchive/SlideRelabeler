import React from 'react';

import ConfigV2App from '../../components/config-v2/ConfigV2App';
import ModalHeader from './ModalHeader';

/** Configuration dialog (kit UI). */
function ModalConfig() {
  return (
    <div className="__modal">
      <ModalHeader title="Configuration" type="config" />
      <div className="__content __content--config">
        <ConfigV2App />
      </div>
      <div className="__footer" />
    </div>
  );
}

export default ModalConfig;
