import React from 'react';

import GridHoverTooltip from './GridHoverTooltip.jsx';
import TransformTooltipContent from './TransformTooltipContent.jsx';
import { getTransformMeta } from '../../helpers/esm_transform_cell.js';

export default function TransformedValueCell(params) {
  const field = params.colDef?.field;
  const text = params.value != null ? String(params.value) : '';
  const meta = getTransformMeta(params.data, field);

  if (!meta) {
    return text;
  }

  return (
    <GridHoverTooltip
      content={<TransformTooltipContent meta={meta} fieldName={field} />}
      show="always"
    >
      {text}
    </GridHoverTooltip>
  );
}
