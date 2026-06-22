import React from 'react';
import Checkbox from '../controls/checkbox/Checkbox';

export default function LabelCompositionItem({
  disabled,
  label,
  helper,
  mockupId,
  checked,
  onToggleCheck,
  summary,
  expanded,
  onToggleExpand,
  showCheckbox = true,
  children,
}) {
  return (
    <div className="label-composition-controls__row label-composition-item">
      {showCheckbox ? (
        <Checkbox
          disabled={disabled}
          label={label}
          checked={checked}
          onClick={onToggleCheck}
        />
      ) : (
        <div className="label-composition-item__standalone-label">{label}</div>
      )}
      {helper && (
        <div className="label-composition-controls__helper" id={mockupId}>
          {helper}
        </div>
      )}
      {checked && (
        <div className="label-composition-item__config">
          <button
            type="button"
            className="label-composition-item__summary-row"
            aria-expanded={expanded}
            disabled={disabled}
            onClick={onToggleExpand}
          >
            <code className="label-composition-item__summary">{summary}</code>
            <span className="label-composition-item__configure">
              Configure
              <span className="label-composition-item__chevron">{expanded ? '▾' : '▸'}</span>
            </span>
          </button>
          {expanded && children && (
            <div className="label-composition-item__body">{children}</div>
          )}
        </div>
      )}
    </div>
  );
}
