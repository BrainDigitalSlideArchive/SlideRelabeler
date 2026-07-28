import React, { useId } from 'react';

import Checkbox from '../../controls/checkbox/Checkbox';
import HelpIconPopover from '../../controls/HelpIconPopover';

/**
 * Feature toggle card (Slide label composer).
 * Two-column layout: checkbox rail | title+hint and detail body.
 * Body stays visible when unchecked (dimmed) so defaults remain scannable.
 */
export default function ConfigFeatureBlock({
  title,
  titleId: titleIdProp,
  hint,
  checked = false,
  onChange,
  disabled = false,
  inactive,
  incomplete = false,
  issueMessage,
  children,
  className = '',
  tooltip,
}) {
  const autoId = useId();
  const titleId = titleIdProp || autoId;
  const isInactive = inactive ?? !checked;
  const classes = [
    'cfg-feature-block',
    checked ? 'cfg-feature-block--active' : '',
    isInactive ? 'cfg-feature-block--inactive' : '',
    incomplete ? 'cfg-feature-block--incomplete' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-labelledby={titleId}>
      <div className="cfg-feature-block__header">
        <div className="cfg-feature-block__checkbox-cell">
          <Checkbox
            compact
            hideLabel
            checked={!!checked}
            onClick={() => onChange?.(!checked)}
            disabled={disabled}
            ariaLabelledBy={titleId}
          />
        </div>
        <div className="cfg-feature-block__header-main">
          <div className="cfg-feature-block__heading">
            <span className="cfg-feature-block__title" id={titleId}>
              {title}
            </span>
            {hint ? (
              <span className="cfg-feature-block__hint">{hint}</span>
            ) : null}
            {tooltip ? (
              <HelpIconPopover
                helpLabel={typeof title === 'string' ? `${title} help` : 'Help'}
                variant="onLight"
                disabled={disabled}
              >
                {tooltip}
              </HelpIconPopover>
            ) : null}
          </div>
          {issueMessage && checked ? (
            <span className="cfg-feature-block__issue" role="status">
              {issueMessage}
            </span>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="cfg-feature-block__body">{children}</div>
      ) : null}
    </section>
  );
}
