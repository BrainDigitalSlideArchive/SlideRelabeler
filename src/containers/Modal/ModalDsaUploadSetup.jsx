import React from 'react';

import ModalHeader from './ModalHeader';
import DsaUploadSetupContent from '../../components/upload/DsaUploadSetupContent';

import './ModalNetwork.scss';

export default function ModalDsaUploadSetup() {
  return (
    <div className="__modal">
      <ModalHeader title="DSA upload setup" type="dsa_upload_setup" />
      <div className="__content">
        <p className="network-auto-upload__intro">
          Sign in to DSA and set the upload folder. Staging directory and upload limits are in Configuration → Output delivery.
        </p>
        <DsaUploadSetupContent />
      </div>
      <div className="__footer" />
    </div>
  );
}
