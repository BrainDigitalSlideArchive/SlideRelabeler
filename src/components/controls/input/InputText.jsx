import React from 'react';

import './InputText.scss';

function InputText(props) {
  const {label, value, onChange, disabled} = props;
  return (
    <div className={"InputText"}>
      <label className={disabled? "_disabled" : null}>{label}</label>
      <input disabled={disabled} className={disabled? "__input-text _disabled" : "__input-text"} type={"text"} value={value} onChange={(e) => onChange(e.target.value)}/>
    </div>
  );
}

export default InputText;