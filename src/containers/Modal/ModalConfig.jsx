import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from "react-redux";

import * as config_actions from "../../actions/config";
import ModalHeader from './ModalHeader';
import { previewLabelStrings } from '../../helpers/label_config_preview';
import { applyRowNamingDefaults, countProtectedNamingRows } from '../../helpers/row_naming_defaults';
import {
  buildExamplePreviewRow,
  clonePreviewRowFromFileRow,
} from '../../helpers/config_preview_row';
import { getPatternPlaceholderCatalog } from '../../helpers/pattern_engine.js';
import { selectPatternValidationFromState } from '../../helpers/pattern_validation.js';
import ConfigStickyNav from '../../components/config/ConfigStickyNav';
import ConfigOverviewSection from '../../components/config/ConfigOverviewSection';
import OutputFilenameSection from '../../components/config/OutputFilenameSection';
import LabelGuidedSteps from '../../components/config/LabelGuidedSteps';
import AuditLoggingSection from '../../components/config/AuditLoggingSection';
import DataLoadingSection from '../../components/config/DataLoadingSection';
import ConfigAdvancedSection from '../../components/config/ConfigAdvancedSection';
import HelpIconPopover from '../../components/controls/HelpIconPopover';

const SLIDE_LABEL_HELP = (
  <>
    Similar to <strong>Output name</strong> config above, the options below will be applied any time a file
    does not already have a value defined in the table. If a value is provided for the component during data
    loading or manual editing, it will override these defaults.
  </>
);

function ModalConfig() {
  const filename_config = useSelector(state => state.config.filename);
  const csv_config = useSelector(state => state.config.csv);
  const label_config = useSelector(state => state.config.label);
  const wsi_config = useSelector(state => state.config.wsi);
  const debug_config = useSelector(state => state.config.debug);
  const processing = useSelector(state => state.files.processing);
  const copy_config = useSelector(state => state.config.copy);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const file_rows = useSelector(state => state.files.file_rows);
  const file_cols = useSelector(state => state.files.file_columns);
  const reserved_columns = useSelector(state => state.files.reserved_columns);
  const config = useSelector(state => state.config);
  const routing_config = useSelector(state => state.config.routing);

  const dispatch = useDispatch();

  const example_filename = '1234.tiff';
  const example_uuid = "acde070d-8c4c-4f0d-9d8a-162843c10333";

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const firstFileRow = hasLoadedFiles ? file_rows[0] : null;

  const [previewRowMode, setPreviewRowMode] = useState('example');
  const [previewRow, setPreviewRow] = useState(null);

  const enrichedConfig = useMemo(
    () => ({ ...config, fileCols: file_cols }),
    [config, file_cols],
  );

  const examplePreviewRow = useMemo(
    () => buildExamplePreviewRow({
      uuid: example_uuid,
      filename: example_filename,
      fileCols: file_cols,
      config: enrichedConfig,
    }),
    [example_uuid, example_filename, file_cols, enrichedConfig],
  );

  useEffect(() => {
    setPreviewRow((prev) => prev ?? examplePreviewRow);
  }, [examplePreviewRow]);

  useEffect(() => {
    setPreviewRow((prev) => {
      if (!prev) return prev;
      return applyRowNamingDefaults({ ...prev }, enrichedConfig);
    });
  }, [label_config, filename_config, enrichedConfig]);

  const activePreviewRow = previewRow ?? {
    __reserved: { uuid: example_uuid, source: { filename: example_filename } },
  };
  const previewFilePath = activePreviewRow?.__reserved?.source?.path ?? null;

  const placeholderCatalogs = useMemo(
    () => ({
      outputName: getPatternPlaceholderCatalog({
        field: 'outputName',
        fileRows: file_rows,
        fileCols: file_cols,
        hasLoadedFiles,
        csvConfig: csv_config,
      }),
      labelText: getPatternPlaceholderCatalog({
        field: 'labelText',
        fileRows: file_rows,
        fileCols: file_cols,
        hasLoadedFiles,
        csvConfig: csv_config,
      }),
      qrContent: getPatternPlaceholderCatalog({
        field: 'qrContent',
        fileRows: file_rows,
        fileCols: file_cols,
        hasLoadedFiles,
        csvConfig: csv_config,
      }),
      dsaAlias: getPatternPlaceholderCatalog({
        field: 'dsaAlias',
        fileRows: file_rows,
        fileCols: file_cols,
        hasLoadedFiles,
        csvConfig: csv_config,
      }),
    }),
    [file_rows, file_cols, hasLoadedFiles, csv_config],
  );

  const patternValidation = useMemo(
    () => selectPatternValidationFromState({
      config: enrichedConfig,
      file_rows,
      file_cols,
    }),
    [enrichedConfig, file_rows, file_cols],
  );

  const resolvedPreview = useMemo(
    () => previewLabelStrings(enrichedConfig, activePreviewRow, {
      usingSample: previewRowMode === 'example',
    }),
    [enrichedConfig, activePreviewRow, previewRowMode],
  );

  const schematicPreview = useMemo(
    () => previewLabelStrings(enrichedConfig, examplePreviewRow, { usingSample: true }),
    [enrichedConfig, examplePreviewRow, label_config, filename_config],
  );

  const controlsDisabled = processing || disable_changes;

  const protectedRowCount = useMemo(
    () => countProtectedNamingRows(file_rows),
    [file_rows],
  );

  const recomputeNotice = hasLoadedFiles && protectedRowCount > 0
    ? 'Rows with values from CSV, eSM, or manual edits will not be changed when you update defaults.'
    : null;

  function triggerRecompute() {
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
    setPreviewRow((prev) => (prev ? applyRowNamingDefaults({ ...prev }, enrichedConfig) : prev));
  }

  function handlePreviewRowChange(updatedRow) {
    setPreviewRow(updatedRow);
  }

  function handleLoadPreviewFromFirstRow() {
    if (!firstFileRow) return;
    setPreviewRow(clonePreviewRowFromFileRow(firstFileRow));
    setPreviewRowMode('file');
  }

  function handleResetPreviewRow() {
    setPreviewRow({ ...examplePreviewRow });
    setPreviewRowMode('example');
  }

  return (
    <div className="__modal">
      <ModalHeader title={"Configuration"} type={"config"} />
      <div className={"__content __content--config"}>
        <div className="config-panel">
          <ConfigStickyNav />
          <div className="config-panel__body">
            <div className={"__config-controls"}>
              <ConfigOverviewSection hasLoadedFiles={hasLoadedFiles} />

              <div className={"__divider"} />

              <OutputFilenameSection
                config={enrichedConfig}
                filenameConfig={filename_config}
                previewRow={activePreviewRow}
                disabled={controlsDisabled}
                hasLoadedFiles={hasLoadedFiles}
                reservedColumns={reserved_columns}
                fileCols={file_cols}
                onPreviewRowChange={handlePreviewRowChange}
                onLoadPreviewFromFirstRow={handleLoadPreviewFromFirstRow}
                onResetPreviewRow={handleResetPreviewRow}
                onRecompute={triggerRecompute}
                recomputeNotice={recomputeNotice}
                placeholderCatalog={placeholderCatalogs.outputName}
                patternValidationMessages={patternValidation.messages}
              />

          <div className={"__divider"} />

          <section className="__config-control-section" id="config-slide-label">
            <div className={"__config-control-section-title"}>Slide label</div>
            <div className={"__config-control-section-description"}>
              Choose which components appear on the new, deidentified slide labels.
              {' '}
              <HelpIconPopover helpLabel="Slide label defaults help" variant="onLight">
                {SLIDE_LABEL_HELP}
              </HelpIconPopover>
            </div>
            <div className="config-section-panel label-config-section">
              <LabelGuidedSteps
                config={enrichedConfig}
                labelConfig={label_config}
                disabled={controlsDisabled}
                previewRow={activePreviewRow}
                previewRowMode={previewRowMode}
                previewFilePath={previewFilePath}
                resolvedPreview={resolvedPreview}
                schematicPreview={schematicPreview}
                hasLoadedFiles={hasLoadedFiles}
                reservedColumns={reserved_columns}
                fileCols={file_cols}
                onPreviewRowChange={handlePreviewRowChange}
                onLoadPreviewFromFirstRow={handleLoadPreviewFromFirstRow}
                onResetPreviewRow={handleResetPreviewRow}
                onRecompute={triggerRecompute}
                placeholderCatalogs={placeholderCatalogs}
                patternValidationMessages={patternValidation.messages}
              />
            </div>
          </section>

          <div className={"__divider"} />

          <AuditLoggingSection
            disabled={controlsDisabled}
          />

          <div className={"__divider"} />

          <DataLoadingSection
            csvConfig={csv_config}
            disabled={controlsDisabled}
          />

          <div className={"__divider"} />

          <ConfigAdvancedSection
            wsiConfig={wsi_config}
            copyConfig={copy_config}
            debugConfig={debug_config}
            disabled={controlsDisabled}
          />
            </div>
          </div>
        </div>
      </div>
      <div className={"__footer"} />
    </div>
  );
}

export default ModalConfig;
