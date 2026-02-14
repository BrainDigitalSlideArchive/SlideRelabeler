import React, { useState } from 'react';

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
<<<<<<< HEAD
  const {label, value, onChange, disabled, type, error, input_style, tooltip} = props;
  const [hover, set_hover] = useState(false);
=======
  const {label, value, onChange, disabled, type, error, onKeyPress} = props;
>>>>>>> c93d999 (adds eSlideManager integration)
  return (
    <div onMouseOver={() => set_hover(true)} onMouseLeave={() => set_hover(false)} className={"InputText"}>
      <label>{label}</label>
<<<<<<< HEAD
      {
        tooltip &&
        <div className={hover? "__tooltip _visible" : "__tooltip"}>
          {tooltip}
        </div>
      }
      <input style={input_style? input_style : {}} type={type? type : "text"} disabled={disabled} className={get_input_text_class(disabled, error)} value={value} onChange={(e) => onChange(e.target.value)}/>
=======
      <input type={type? type : "text"} disabled={disabled} className={get_input_text_class(disabled, error)} value={value} onChange={(e) => onChange(e.target.value)} onKeyPress={onKeyPress}/>
>>>>>>> c93d999 (adds eSlideManager integration)
    </div>
  );
}

export default InputText;