import React from 'react';
import {useSelector, useDispatch} from "react-redux";
import * as modal_actions from "../../actions/modal";

import './Modal.scss';
import ModalHelp from "./ModalHelp";
import ModalConfig from './ModalConfig';
import ModalImage from './ModalImage';

function render_modal(type, props) {

  switch(type) {
    case 'help':
      return <ModalHelp/>;
    case 'config':
      return <ModalConfig/>;
    case 'image':
      return ModalImage(props);
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