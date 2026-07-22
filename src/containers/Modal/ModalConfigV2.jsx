import React from 'react';

import ConfigV2App from '../../components/config-v2/ConfigV2App';
import ModalHeader from './ModalHeader';

/** Live Configuration dialog v2 preview (dual-gear comparison). */
function ModalConfigV2() {
  return (
    <div className="__modal">
      <ModalHeader title="Configuration" type="configV2" />
      <div className="__content __content--config">
        <ConfigV2App />
      </div>
      <div className="__footer" />
    </div>
  );
}

export default ModalConfigV2;
