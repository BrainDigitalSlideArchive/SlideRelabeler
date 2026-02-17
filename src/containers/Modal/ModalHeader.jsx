import React from 'react';
import {useDispatch} from "react-redux";
import * as modal_actions from "../../actions/modal";
import Dropdown from '../../components/controls/dropdown/Dropdown';
import Switch from '../../components/controls/switch/Switch';

const network_types = [
  {label: "DSA", value: "dsa"},
];

const get_network_type_item = (network_type) => {
  let item = network_types.find(type_item => type_item.value === network_type);
  return item;
}

function ModalHeader(props) {
  const { title, type, onClose, network_type, display_changed_only} = props;
  const dispatch = useDispatch();

  return (
    <div className={type === "image"? "__header _large" : "__header"}>
      <div className={"__title"}>{title}</div>
      <div className={"__spacer"}/>
      {type === "network_config" &&
       <Dropdown width={"10em"} label_width={"2em"} items={network_types} label={""} placeholder={""} selectedItems={[get_network_type_item(network_type)]} onSelect={(item) => dispatch({type: modal_actions.CHANGE_NETWORK, payload: item.value})} />
      }
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