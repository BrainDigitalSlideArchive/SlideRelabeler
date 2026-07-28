import React, { useState } from 'react';

import './Button.scss';

function Button(props) {
  const { onClick, text, label, result, disabled, extra_class_name, tooltip, variant } = props;

  const [hover, set_hover] = useState(false);

  function get_button_class_name() {
    let class_name = "__button";
    if (disabled) {
      class_name += " _disabled";
    }
    return class_name;
  }

  // Light is the default. `onLight` is a no-op alias; `onDark` opts into host/global chrome.
  const rootClass = [
    'Button',
    variant === 'onDark' ? 'Button--onDark' : '',
    variant === 'onLight' ? 'Button--onLight' : '',
    extra_class_name || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClass} onMouseOver={() => set_hover(true)} onMouseLeave={() => set_hover(false)}>
      {
        label &&
        <button className={get_button_class_name()}>
          {label}
        </button>
      }
      {
        tooltip && 
        <div className={hover? "__button-tooltip _visible" : "__button-tooltip"}>
          {tooltip}
        </div>
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
