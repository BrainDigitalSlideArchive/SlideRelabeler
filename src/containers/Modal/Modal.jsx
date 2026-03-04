import React from 'react';
import {useSelector, useDispatch} from "react-redux";
import * as modal_actions from "../../actions/modal";

import './Modal.scss';
import ModalHelp from "./ModalHelp";
import ModalConfig from './ModalConfig';
import ModalImage from './ModalImage';
import ModalDebug from './ModalDebug';
import ModalError from './ModalError';
import ModalWarning from './ModalWarning';
import ModalMetadata from './ModalMetadata';
import ModalNetwork from './ModalNetwork';
import ModalESlideManager from './ModalESlideManager';

function render_modal(type, props) {
  switch(type) {
    case 'help':
      return <ModalHelp/>;
    case 'config':
      return <ModalConfig/>;
    case 'image':
      return ModalImage(props);
    case 'debug':
      return <ModalDebug/>;
    case 'error':
      return <ModalError/>;
    case 'warning':
      return <ModalWarning/>;
    case 'network':
      return <ModalNetwork network_type={props.network_type}/>;
    case 'metadata':
      return <ModalMetadata file={props.file} row_idx={props.row_idx}/>;
    case 'esm':
      return <ModalESlideManager/>;
    default:
      return <ModalHelp/>;
  }
}

function Modal(props) {
  const { active, type } = useSelector(state => state.modal);

  return (
    <div className={active? "Modal _active" : "Modal"}>
      <div className={active? "__modal-background _active" : "__modal-background"}/>
      {
        render_modal(type, props)
      }
    </div>
  )
}

export default Modal;