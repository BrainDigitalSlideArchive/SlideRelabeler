// helpers/esm_staging_column_defs.js — AG Grid columns for the eSM staging results table.

import { applyAgGridColumnProfile, ESM_STAGING_PROFILE } from './file_table_columns.js';
import { applyTransformValueColumnDefs } from './esm_transform_column_defs.js';
import {
  getEnabledMappings,
  profileMappingHeaderName,
  previewStagingMappingValues,
} from './esm_profile_helpers.js';

const ESM_STAGING_BASE_COLUMNS = [
  {
    headerName: '',
    field: '__select',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    sortable: false,
    filter: false,
  },
  { headerName: 'Accession', field: 'Accession', sortable: true, filter: true },
  { headerName: 'BlockId', field: 'BlockId', sortable: true, filter: true },
  { headerName: 'StainId', field: 'StainId', sortable: true, filter: true },
  { headerName: 'SlideNum', field: 'SlideNum', sortable: true, filter: true },
  { headerName: 'ImageId', field: 'ImageId', sortable: true, filter: true },
  { headerName: 'SlideId', field: 'SlideId', sortable: true, filter: true },
  { headerName: 'ScanDate', field: 'ScanDate', sortable: true, filter: true },
  {
    headerName: 'CompressedFileLocation',
    field: 'CompressedFileLocation',
    sortable: true,
    filter: true,
  },
];

function getCachedPreviewMappingValues(profile, row) {
  if (!row) return new Map();
  if (!row.__esmPreviewMappings) {
    row.__esmPreviewMappings = previewStagingMappingValues(
      profile,
      row.__raw,
      row.__esm?.criteriaRow,
    );
  }
  return row.__esmPreviewMappings;
}

export function buildEsmStagingColumnDefs(profile) {
  const mappingCols = getEnabledMappings(profile).map((mapping) => ({
    headerName: profileMappingHeaderName(mapping),
    field: mapping.targetColumn,
    colId: mapping.targetColumn,
    valueGetter: (params) => {
      const values = getCachedPreviewMappingValues(profile, params.data);
      return values.get(mapping.targetColumn) ?? '';
    },
    sortable: true,
    filter: true,
  }));

  const columnDefs = applyAgGridColumnProfile(
    [...ESM_STAGING_BASE_COLUMNS, ...mappingCols],
    ESM_STAGING_PROFILE,
  );

  return applyTransformValueColumnDefs(columnDefs);
}
