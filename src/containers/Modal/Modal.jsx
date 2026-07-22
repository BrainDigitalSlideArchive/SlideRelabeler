import React from 'react';
import {useSelector} from "react-redux";

import './Modal.scss';
import ModalHelp from "./ModalHelp";
import ModalConfig from './ModalConfig';
import ModalConfigV2 from './ModalConfigV2';
import ModalImage from './ModalImage';
import ModalDebug from './ModalDebug';
import ModalError from './ModalError';
import ModalWarning from './ModalWarning';
import ModalMetadata from './ModalMetadata';
import ModalDsaFolderPicker from './ModalDsaFolderPicker';
import ModalGlobusEndpointPicker from './ModalGlobusEndpointPicker';
import ModalGlobusFolderPicker from './ModalGlobusFolderPicker';
import ModalGlobusLogin from './ModalGlobusLogin';
import ModalESlideManager from './ModalESlideManager';
import AuditLogViewerModal from './AuditLogViewerModal';

function render_modal(type, props) {
  switch(type) {
    case 'help':
      return <ModalHelp/>;
    case 'config':
      return <ModalConfig/>;
    case 'configV2':
      return <ModalConfigV2/>;
    case 'image':
      return ModalImage(props);
    case 'debug':
      return <ModalDebug/>;
    case 'error':
      return <ModalError/>;
    case 'warning':
      return <ModalWarning/>;
    case 'dsaFolderPicker':
      return <ModalDsaFolderPicker />;
    case 'globusEndpointPicker':
      return <ModalGlobusEndpointPicker />;
    case 'globusFolderPicker':
      return <ModalGlobusFolderPicker />;
    case 'globusLogin':
      return <ModalGlobusLogin />;
    case 'metadata':
      return <ModalMetadata file={props.file} row_idx={props.row_idx}/>;
    case 'esm':
      return <ModalESlideManager/>;
    case 'auditLog':
      return <AuditLogViewerModal />;
    default:
      return null;
  }
}

function Modal(props) {
  const stack = useSelector((state) => state.modal.stack);
  const active = stack.length > 0;
  const type = stack[stack.length - 1];

  return (
    <div className={active? "Modal _active" : "Modal"}>
      <div className={active? "__modal-background _active" : "__modal-background"}/>
      {
        active ? render_modal(type, props) : null
      }
    </div>
  )
}

export default Modal;
