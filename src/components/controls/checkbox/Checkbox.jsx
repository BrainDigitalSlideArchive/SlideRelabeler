import React from "react";

import HelpIconPopover from '../HelpIconPopover';
import './Checkbox.scss';

function Checkbox(props) {
  const {
    label,
    option,
    checked,
    onClick,
    disabled,
    hideLabel,
    ariaLabelledBy,
    checkboxId,
    tooltip,
    helpVariant = 'onLight',
    compact = false,
    variant,
  } = props;

  function toggle() {
    if (!disabled && onClick) onClick();
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  }

  const hasHelp = !hideLabel && tooltip;
  const helpIconVariant =
    helpVariant === 'onDark' ? 'onDark' : helpVariant === 'warning' ? 'warning' : 'default';
  const rootClass = [
    'Checkbox',
    disabled ? '_disabled' : '',
    hasHelp ? 'Checkbox--hasHelp' : '',
    compact ? 'Checkbox--compact' : '',
    variant === 'onDark' ? 'Checkbox--onDark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {!hideLabel && !tooltip && <label>{label}</label>}
      {!hideLabel && tooltip && (
        <div className="Checkbox__labelCluster">
          <label>{label}</label>
          <HelpIconPopover
            helpLabel={typeof label === 'string' && label ? `Help for ${label}` : 'Help'}
            disabled={disabled}
            variant={helpIconVariant}
          >
            {tooltip}
          </HelpIconPopover>
        </div>
      )}
      <div
        id={hideLabel && checkboxId ? checkboxId : undefined}
        className={"__checkbox"}
        role={hideLabel ? 'checkbox' : undefined}
        tabIndex={hideLabel && !disabled ? 0 : undefined}
        aria-checked={hideLabel ? !!checked : undefined}
        aria-labelledby={hideLabel && ariaLabelledBy ? ariaLabelledBy : undefined}
        aria-disabled={hideLabel && disabled ? true : undefined}
        onClick={disabled ? null : toggle}
        onKeyDown={hideLabel ? onKeyDown : undefined}
      >
        <div className={"__checked"}>
          {checked && <i className={"fi fi-rr-check"} />}
        </div>
      </div>
    </div>
  );
}

export default Checkbox;