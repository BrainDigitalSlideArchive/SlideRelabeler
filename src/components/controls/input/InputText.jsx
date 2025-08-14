import React from 'react';

import './InputText.scss';

function get_input_text_class(disabled, error) {
  let class_name = "__input-text";
  if (disabled) {
    class_name += " _disabled";
  }
  if (error) {
    class_name += " _error";
  }
  return class_name;
}

function InputText(props) {
  const {label, value, onChange, disabled, type, error} = props;
  return (
    <div className={"InputText"}>
      <label>{label}</label>
      <input type={type? type : "text"} disabled={disabled} className={get_input_text_class(disabled, error)} value={value} onChange={(e) => onChange(e.target.value)}/>
    </div>
  );
}

export default InputText;