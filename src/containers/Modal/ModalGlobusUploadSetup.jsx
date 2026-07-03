import React from 'react';

import ModalHeader from './ModalHeader';
import GlobusUploadSetupContent from '../../components/upload/GlobusUploadSetupContent';

import './ModalNetwork.scss';

export default function ModalGlobusUploadSetup() {
  return (
    <div className="__modal">
      <ModalHeader title="Globus upload setup" type="globus_upload_setup" />
      <div className="__content">
        <p className="network-auto-upload__intro">
          Sign in to Globus and choose the upload destination. Staging directory and upload limits are in Configuration → Output delivery.
        </p>
        <GlobusUploadSetupContent />
      </div>
      <div className="__footer" />
    </div>
  );
}
