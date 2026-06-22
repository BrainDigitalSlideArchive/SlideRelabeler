import React from 'react';
import GridHoverTooltip from './GridHoverTooltip.jsx';

/**
 * AG Grid inner header: shows displayName with GridHoverTooltip for full headerTooltipText.
 */
export default function GridTooltipInnerHeader(props) {
  const label = props.displayName ?? '';
  const tooltip = props.column?.getColDef?.()?.headerTooltipText ?? '';

  if (!tooltip.trim()) {
    return <span className="__grid-header-label">{label}</span>;
  }

  return (
    <GridHoverTooltip content={tooltip} show="always" className="__grid-header-label">
      {label}
    </GridHoverTooltip>
  );
}
