import React from 'react';

import GridHoverTooltip from './AgGrid/GridHoverTooltip';

export default function ToolbarSelectAction({
  selectId,
  ariaLabel,
  options = [],
  value,
  onChange,
  onAction,
  actionIcon,
  actionAriaLabel,
  selectTooltip,
  actionTooltip,
  disabled = false,
  actionDisabled = false,
}) {
  const isActionDisabled = disabled || actionDisabled;

  return (
    <div className={disabled ? 'toolbar-select-action _disabled' : 'toolbar-select-action'}>
      <GridHoverTooltip
        content={selectTooltip}
        show="always"
        placement="below"
        className="toolbar-select-action__select-wrap"
      >
        <select
          id={selectId}
          className="toolbar-select-action__select"
          aria-label={ariaLabel}
          disabled={disabled}
          value={value}
          onChange={onChange}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </GridHoverTooltip>
      <GridHoverTooltip
        content={actionTooltip}
        show="always"
        placement="below"
        className="toolbar-select-action__action-wrap"
      >
        <button
          type="button"
          className="toolbar-select-action__action"
          disabled={isActionDisabled}
          aria-label={actionAriaLabel}
          onClick={onAction}
        >
          <i className={actionIcon} aria-hidden="true" />
        </button>
      </GridHoverTooltip>
    </div>
  );
}
