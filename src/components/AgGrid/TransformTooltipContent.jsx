import React from 'react';

export default function TransformTooltipContent({ meta, fieldName = '' }) {
  if (!meta) return null;

  return (
    <>
      {fieldName ? (
        <div className="grid-hover-tooltip__title">{fieldName}</div>
      ) : null}
      <div className="grid-hover-tooltip__line">
        {`Original: ${meta.original}`}
      </div>
      {(meta.appliedRules || []).map((rule, index) => (
        <div
          key={rule.id || `${rule.name}-${index}`}
          className="grid-hover-tooltip__line"
        >
          {`Rule: ${rule.name}`}
        </div>
      ))}
    </>
  );
}
