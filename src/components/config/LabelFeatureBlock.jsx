import React from 'react';
import Checkbox from '../controls/checkbox/Checkbox';

export default function LabelFeatureBlock({
  featureKey,
  label,
  hint,
  checked,
  disabled,
  inactive,
  incomplete = false,
  issueMessage,
  onToggle,
  children,
}) {
  const isInactive = inactive ?? !checked;
  const titleId = `label-feature-${featureKey}-title`;

  return (
    <section
      className={[
        'label-feature-block',
        checked ? 'label-feature-block--active' : '',
        isInactive ? 'label-feature-block--inactive' : '',
        incomplete ? 'label-feature-block--incomplete' : '',
      ].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
    >
      <div className="label-feature-block__header">
        <div className="label-feature-block__checkbox-cell">
          <Checkbox
            compact
            hideLabel
            disabled={disabled}
            checked={checked}
            onClick={onToggle}
            checkboxId={`label-feature-${featureKey}`}
            ariaLabelledBy={titleId}
          />
        </div>
        <div className="label-feature-block__header-main">
          <div className="label-feature-block__heading">
            <span className="label-feature-block__title" id={titleId}>
              {label}
            </span>
            {hint && (
              <span className="label-feature-block__hint">{hint}</span>
            )}
          </div>
          {issueMessage && checked && (
            <span className="label-feature-block__issue" role="status">
              {issueMessage}
            </span>
          )}
        </div>
      </div>
      <div className="label-feature-block__body">
        {children}
      </div>
    </section>
  );
}
