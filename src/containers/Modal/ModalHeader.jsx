import React from 'react';
import {useDispatch} from "react-redux";
import * as modal_actions from "../../actions/modal";
import Switch from '../../components/controls/switch/Switch';

function ModalHeader(props) {
  const { title, type, onClose, display_changed_only} = props;
  const dispatch = useDispatch();

  return (
    <div className={type === 'image' || type === 'auditLog' ? '__header _large' : '__header'}>
      <div className={"__title"}>{title}</div>
      <div className={"__spacer"}/>
      {
        type === "metadata" &&
        <Switch label="Changed Only" checked={display_changed_only} onChange={() => dispatch({type: modal_actions.TOGGLE_DISPLAY_CHANGED_ONLY})} />
      }
      <button className={"__button-icon __close"}
              onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: type}}) && onClose && onClose()}>
        <i className={"fi fi-rr-cross"}></i>
      </button>
    </div>
  )
}

export default ModalHeader;