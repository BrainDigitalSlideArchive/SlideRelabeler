import React from 'react';

/**
 * Segmented radio chips.
 * options: [{ value, label }]
 */
export default function ConfigChoiceChips({
  name,
  value,
  onChange,
  options = [],
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  className = '',
}) {
  return (
    <div
      className={`cfg-choice-chips${className ? ` ${className}` : ''}`}
      role="radiogroup"
      aria-label={ariaLabelledBy ? undefined : (ariaLabel || name)}
      aria-labelledby={ariaLabelledBy || undefined}
    >
      {options.map((opt) => {
        const id = `${name}-${opt.value}`;
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`cfg-choice-chips__option${checked ? ' cfg-choice-chips__option--checked' : ''}${disabled ? ' cfg-choice-chips__option--disabled' : ''}`}
            title={opt.title || opt.helper || undefined}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange?.(opt.value)}
            />
            <span className="cfg-choice-chips__label">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
