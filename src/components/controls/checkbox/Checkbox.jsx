import React from "react";

import './Checkbox.scss';

function Checkbox(props) {
  const {label, option, checked, onClick, disabled} = props;
  return (
    <div className={disabled? "Checkbox _disabled" : "Checkbox"}>
      <label>{label}</label>
      <div className={"__checkbox"} onClick={disabled? null : () => onClick && onClick()}>
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