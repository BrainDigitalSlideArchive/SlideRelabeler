// helpers/esm_transform_column_defs.js — AG Grid column defs for transformed eSM fields.

import TransformedValueCell from '../components/AgGrid/TransformedValueCell.jsx';
import {
  isTransformedCell,
  TRANSFORMABLE_ESM_FIELDS,
} from './esm_transform_cell.js';

export function applyTransformValueColumnDefs(columnDefs, fields = TRANSFORMABLE_ESM_FIELDS) {
  const fieldSet = new Set(fields);

  return (columnDefs || []).map((col) => {
    const field = col?.field;
    if (!field || !fieldSet.has(field)) return col;

    return {
      ...col,
      cellRenderer: TransformedValueCell,
      cellClassRules: {
        ...(col.cellClassRules || {}),
        '__transformed-value-cell': (params) => isTransformedCell(params.data, field),
      },
    };
  });
}
