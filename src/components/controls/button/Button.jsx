import React from 'react';

import './Button.scss';

function Button(props) {
  const { onClick, text, label, result, disabled, extra_class_name } = props;

  function get_button_class_name() {
    let class_name = "__button";
    if (disabled) {
      class_name += " _disabled";
    }
    return class_name;
  }

  return (
    <div className={extra_class_name ? `Button ${extra_class_name}` : "Button"}>
      {
        label &&
        <button className={get_button_class_name()}>
          {label}
        </button>
      }
      <button disabled={disabled} className={get_button_class_name()} onClick={() => onClick()}>{text}</button>
      {result &&
        <div className={disabled ? "__button-result _disabled" : "__button-result"}>
          {result}
        </div>
      }
    </div>
  )
}

export default Button;