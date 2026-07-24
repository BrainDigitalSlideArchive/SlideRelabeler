import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../actions/config';
import {
  buildExamplePreviewRow,
  clonePreviewRowFromFileRow,
} from '../../../helpers/config_preview_row';
import { previewLabelStrings } from '../../../helpers/label_config_preview';
import { applyRowNamingDefaults, countProtectedNamingRows } from '../../../helpers/row_naming_defaults';

const EXAMPLE_FILENAME = '1234.tiff';
const EXAMPLE_UUID = 'acde070d-8c4c-4f0d-9d8a-162843c10333';

const ConfigPreviewSandboxContext = createContext(null);

/**
 * Dialog-scoped “Test it out” preview row (shared by Output name and Slide label).
 * Not Redux — ephemeral UI state for naming/label preview.
 */
export function useConfigPreviewSandbox() {
  const ctx = useContext(ConfigPreviewSandboxContext);
  if (!ctx) {
    throw new Error('useConfigPreviewSandbox must be used within ConfigPreviewSandboxProvider');
  }
  return ctx;
}

function useConfigPreviewSandboxState() {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.config);
  const filenameConfig = useSelector((state) => state.config.filename);
  const labelConfig = useSelector((state) => state.config.label);
  const fileRows = useSelector((state) => state.files.file_rows);
  const fileCols = useSelector((state) => state.files.file_columns);
  const reservedColumns = useSelector((state) => state.files.reserved_columns);
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);

  const hasLoadedFiles = Array.isArray(fileRows) && fileRows.length > 0;
  const firstFileRow = hasLoadedFiles ? fileRows[0] : null;
  const controlsDisabled = processing || disableChanges;

  const [previewRowMode, setPreviewRowMode] = useState('example');
  const [previewRow, setPreviewRow] = useState(null);

  const enrichedConfig = useMemo(
    () => ({ ...config, fileCols }),
    [config, fileCols],
  );

  const examplePreviewRow = useMemo(
    () => buildExamplePreviewRow({
      uuid: EXAMPLE_UUID,
      filename: EXAMPLE_FILENAME,
      fileCols,
      config: enrichedConfig,
    }),
    [fileCols, enrichedConfig],
  );

  useEffect(() => {
    setPreviewRow((prev) => prev ?? examplePreviewRow);
  }, [examplePreviewRow]);

  useEffect(() => {
    setPreviewRow((prev) => {
      if (!prev) return prev;
      return applyRowNamingDefaults({ ...prev }, enrichedConfig);
    });
  }, [labelConfig, filenameConfig, enrichedConfig]);

  const activePreviewRow = previewRow ?? {
    __reserved: { uuid: EXAMPLE_UUID, source: { filename: EXAMPLE_FILENAME } },
  };
  const previewFilePath = activePreviewRow?.__reserved?.source?.path ?? null;

  const resolvedPreview = useMemo(
    () => previewLabelStrings(enrichedConfig, activePreviewRow, {
      usingSample: previewRowMode === 'example',
    }),
    [enrichedConfig, activePreviewRow, previewRowMode],
  );

  const schematicPreview = useMemo(
    () => previewLabelStrings(enrichedConfig, examplePreviewRow, { usingSample: true }),
    [enrichedConfig, examplePreviewRow, labelConfig, filenameConfig],
  );

  const protectedRowCount = useMemo(
    () => countProtectedNamingRows(fileRows),
    [fileRows],
  );

  const recomputeNotice = hasLoadedFiles && protectedRowCount > 0
    ? 'Rows already filled from a CSV import, API integration, or a manual edit will not change when you update these defaults.'
    : null;

  const triggerRecompute = useCallback(() => {
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
    setPreviewRow((prev) => (prev ? applyRowNamingDefaults({ ...prev }, enrichedConfig) : prev));
  }, [dispatch, enrichedConfig]);

  const onPreviewRowChange = useCallback((updatedRow) => {
    setPreviewRow(updatedRow);
  }, []);

  const loadPreviewFromFirstRow = useCallback(() => {
    if (!firstFileRow) return;
    setPreviewRow(clonePreviewRowFromFileRow(firstFileRow));
    setPreviewRowMode('file');
  }, [firstFileRow]);

  const resetPreviewRow = useCallback(() => {
    setPreviewRow({ ...examplePreviewRow });
    setPreviewRowMode('example');
  }, [examplePreviewRow]);

  return {
    enrichedConfig,
    filenameConfig,
    labelConfig,
    fileRows,
    fileCols,
    reservedColumns,
    hasLoadedFiles,
    controlsDisabled,
    previewRowMode,
    activePreviewRow,
    previewFilePath,
    resolvedPreview,
    schematicPreview,
    examplePreviewRow,
    recomputeNotice,
    triggerRecompute,
    onPreviewRowChange,
    loadPreviewFromFirstRow,
    resetPreviewRow,
  };
}

export function ConfigPreviewSandboxProvider({ children }) {
  const value = useConfigPreviewSandboxState();
  return (
    <ConfigPreviewSandboxContext.Provider value={value}>
      {children}
    </ConfigPreviewSandboxContext.Provider>
  );
}
