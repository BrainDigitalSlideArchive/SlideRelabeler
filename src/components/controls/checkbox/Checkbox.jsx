import React from "react";

import './Checkbox.scss';

function Checkbox(props) {
  const {label, option, checked, onClick} = props;
  return (
    <div className={"Checkbox"}>
      <label>{label}</label>
      <div className={"__checkbox"} onClick={() => onClick && onClick()}>
        <div className={"__checked"}>
          {
            checked && <i className={"fi fi-rr-check"}/>
          }
        </div>
      </div>
    </div>
  )
}

export default Checkbox;