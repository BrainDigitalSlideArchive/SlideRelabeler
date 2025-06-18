import React from 'react';

import './Button.scss';

function Button(props) {
  const {onClick, text, label, result, disabled} = props;

  return(
    <div className={"Button"}>
      {
        label &&
        <button className={disabled? "__button-label _disabled" : "__button-label"}>
          {label}
        </button>
      }
      <button disabled={disabled} className={disabled? "__button _disabled" : "__button"} onClick={() => onClick()}>{text}</button>
      {result &&
        <div className={disabled? "__button-result _disabled" : "__button-result"}>
          {result}
        </div>
      }
    </div>
  )
}

export default Button;