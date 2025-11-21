import React from 'react';
import './Switch.scss';

function Switch(props) {
  const { label, checked, onChange, disabled } = props;
  return (
    <div className={disabled? "Switch _disabled" : "Switch"}>
      <label>{label}</label>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </div>
  )
}

export default Switch;