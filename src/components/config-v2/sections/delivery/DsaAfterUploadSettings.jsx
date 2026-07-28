import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import { getPatternPlaceholderCatalog } from '../../../../helpers/pattern_engine.js';
import DsaAliasEditor from './DsaAliasEditor';
import DsaItemMetadataEditor from './DsaItemMetadataEditor';

/**
 * Durable after-upload DSA options (config-v2 kit).
 */
export default function DsaAfterUploadSettings({ disabled = false }) {
  const dispatch = useDispatch();
  const dsa_upload = useSelector((state) => state.config.dsa_upload);
  const config = useSelector((state) => state.config);
  const file_rows = useSelector((state) => state.files.file_rows);
  const file_cols = useSelector((state) => state.files.file_columns);

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const placeholderCatalog = useMemo(
    () => getPatternPlaceholderCatalog({
      field: 'dsaAlias',
      fileRows: file_rows,
      fileCols: file_cols,
      hasLoadedFiles,
      csvConfig: config?.csv,
    }),
    [file_rows, file_cols, hasLoadedFiles, config?.csv],
  );

  return (
    <>
      <DsaAliasEditor
        dsaUploadConfig={dsa_upload || {}}
        disabled={disabled}
        placeholderCatalog={placeholderCatalog}
        onRecompute={() => dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING })}
      />
      <DsaItemMetadataEditor
        dsaUploadConfig={dsa_upload || {}}
        disabled={disabled}
        fileRows={file_rows}
        fileCols={file_cols}
        csvConfig={config?.csv}
        hasLoadedFiles={hasLoadedFiles}
      />
    </>
  );
}
