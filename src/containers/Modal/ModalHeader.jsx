import React from 'react';
import {useDispatch} from "react-redux";
import * as modal_actions from "../../actions/modal";

function ModalHeader(props) {
  const { title, type, onClose } = props;
  const dispatch = useDispatch();
  return (
    <div className={type === "image"? "__header _large" : "__header"}>
      <div className={"__title"}>{title}</div>
      <div className={"__spacer"}/>
      <button className={"__button-icon __close"}
              onClick={() => dispatch({type: modal_actions.TOGGLE_MODAL, payload: {type: type}}) && onClose && onClose()}>
        <i className={"fi fi-rr-cross"}></i>
      </button>
    </div>
  )
}

export default ModalHeader;