import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from "react-redux";

import * as config_actions from "../../actions/config";
import ModalHeader from './ModalHeader';
import Checkbox from '../../components/controls/checkbox/Checkbox';
import InputText from '../../components/controls/input/InputText';
import Button from '../../components/controls/button/Button';
import { return_file_extension_from_path, return_filename_basename_from_filename } from "../../helpers/renderer_path_helpers";
import { generate_dropdown_for_table_columns } from "../../helpers/fe_helpers";
import { previewLabelStrings } from '../../helpers/label_config_preview';
import { buildAssembledName } from '../../helpers/assembly_routing';
import { buildOutputFilenameColumnOptions } from '../../helpers/output_filename';
import ConfigStickyNav, { scrollConfigSectionIntoView } from '../../components/config/ConfigStickyNav';
import ConfigOverviewSection from '../../components/config/ConfigOverviewSection';
import OutputFilenameSection from '../../components/config/OutputFilenameSection';
import LabelGuidedSteps from '../../components/config/LabelGuidedSteps';
import AssembledNameSection from '../../components/config/AssembledNameSection';
import ConfigAdvancedSection from '../../components/config/ConfigAdvancedSection';

function ModalConfig() {
  const file_cols = useSelector(state => state.files.file_columns);
  const reserved_cols = useSelector(state => state.files.reserved_columns);
  const filename_config = useSelector(state => state.config.filename);
  const csv_config = useSelector(state => state.config.csv);
  const label_config = useSelector(state => state.config.label);
  const naming_config = useSelector(state => state.config.naming);
  const wsi_config = useSelector(state => state.config.wsi);
  const debug_config = useSelector(state => state.config.debug);
  const processing = useSelector(state => state.files.processing);
  const copy_config = useSelector(state => state.config.copy);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const file_rows = useSelector(state => state.files.file_rows);
  const config = useSelector(state => state.config);
  const assembly_config = useSelector(state => state.config.assembly);
  const routing_config = useSelector(state => state.config.routing);

  const dispatch = useDispatch();
  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const example_filename = '1234.tiff';
  const example_basename = return_filename_basename_from_filename(example_filename);
  const example_ext = return_file_extension_from_path(example_filename);
  const example_uuid = "acde070d-8c4c-4f0d-9d8a-162843c10333";
  const [previewRowSource, setPreviewRowSource] = useState('sample');

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const firstFileRow = hasLoadedFiles ? file_rows[0] : null;
  const previewFilePath = firstFileRow?.__reserved?.source?.path ?? null;

  const sampleRow = useMemo(() => {
    const metadata = {
      BlockId: 'B12',
      StainId: 'HE',
      SlideNum: '1',
      Accession: 'DEMO_ACC',
    };
    const assembled = buildAssembledName(metadata, assembly_config) || 'DEMO_ACC_B12_HE_1';
    return {
      ...metadata,
      AssembledName: assembled,
      __reserved: {
        uuid: example_uuid,
        rename: example_basename,
        source: { filename: example_filename },
      },
    };
  }, [example_basename, example_filename, example_uuid, assembly_config]);

  const activePreviewRow = useMemo(() => {
    if (previewRowSource === 'first' && firstFileRow) return firstFileRow;
    return sampleRow;
  }, [previewRowSource, firstFileRow, sampleRow]);

  const assembledPreview = useMemo(
    () => buildAssembledName(activePreviewRow, assembly_config) || example_basename,
    [activePreviewRow, assembly_config, example_basename],
  );

  const resolvedPreview = useMemo(
    () => previewLabelStrings(config, activePreviewRow, {
      usingSample: !hasLoadedFiles,
    }),
    [config, activePreviewRow, hasLoadedFiles],
  );

  const controlsDisabled = processing || disable_changes;

  const [column_options, set_column_options] = useState([]);

  useEffect(() => {
    const new_all_cols = [...reserved_cols, ...file_cols];
    set_column_options(generate_dropdown_for_table_columns(new_all_cols, blocked_fields));
  }, [reserved_cols, file_cols, blocked_fields]);

  const outputFilenameColumnOptions = useMemo(
    () => buildOutputFilenameColumnOptions({
      fileRows: file_rows,
      fileCols: file_cols,
      savedColumn: filename_config.column,
      csvConfig: csv_config,
    }),
    [file_rows, file_cols, filename_config.column, csv_config],
  );

  function triggerRecompute() {
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
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
                config={config}
                filenameConfig={filename_config}
                assemblyConfig={assembly_config}
                columnOptions={outputFilenameColumnOptions}
                activePreviewRow={activePreviewRow}
                disabled={controlsDisabled}
                exampleFilename={example_filename}
                exampleExt={example_ext}
                exampleUuid={example_uuid}
                onRecompute={triggerRecompute}
              />

          <div className={"__divider"} />

          <section className="__config-control-section" id="config-slide-label">
            <div className={"__config-control-section-title"}>Slide label</div>
            <div className={"__config-control-section-description"}>
              Configure text, QR, and optional overlay on the deidentified slide label.
            </div>
            <div className="label-config-section">
              <LabelGuidedSteps
                config={config}
                labelConfig={label_config}
                assemblyConfig={assembly_config}
                routingConfig={routing_config}
                namingConfig={naming_config}
                columnOptions={column_options}
                disabled={controlsDisabled}
                activePreviewRow={activePreviewRow}
                previewFilePath={previewFilePath}
                resolvedPreview={resolvedPreview}
                hasLoadedFiles={hasLoadedFiles}
                previewRowSource={previewRowSource}
                onPreviewRowSourceChange={setPreviewRowSource}
                onRecompute={triggerRecompute}
                assembledPreview={assembledPreview}
              />
            </div>
          </section>

          <div className={"__divider"} />

          <section className="__config-control-section" id="config-import-csv">
            <div className={"__config-control-section-title"}>Import from CSV</div>
            <div className={"__config-control-section-description"}>
              If you process slides from a spreadsheet, specify which columns mean file path, optional output name, and
              optional output folder. Column names are case-sensitive.
            </div>
            <div className={"__config-control-section-container"}>
              <div className={"__config-control-subsection"}>
                <InputText disabled={controlsDisabled} label={"File path column (required)"} value={csv_config.file_path_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_PATH_COLUMN, payload: new_value })} />
                <InputText disabled={controlsDisabled} label={"Output name column (optional)"} value={csv_config.file_rename_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: new_value })} />
                <InputText disabled={controlsDisabled} label={"Output folder column (optional)"} value={csv_config.file_destination_directory_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_DESTINATION_DIRECTORY_COLUMN, payload: new_value })} />
                <div className={"__config-control-subsection-row _top-margin _align-center"}>
                  <Button text={"Export sample CSV"} onClick={() => dispatch({ type: config_actions.EXPORT_SAMPLE_CSV_TEMPLATE })} />
                </div>
              </div>
              <div className={"__config-control-subsection"}>
                <Checkbox disabled={controlsDisabled} label={"Save processing log CSV (deid_output.csv)"} checked={csv_config.save_csv} onClick={() => dispatch({ type: config_actions.TOGGLE_SAVE_CSV })} />
                <Checkbox
                  disabled={controlsDisabled}
                  label={"Include assembled name in exported CSV"}
                  checked={!!routing_config?.exportCsv?.enabled}
                  onClick={() => dispatch({
                    type: config_actions.SET_ROUTING_CONFIG,
                    payload: {
                      exportCsv: {
                        enabled: !routing_config?.exportCsv?.enabled,
                        columnHeader: assembly_config?.columnName || 'AssembledName',
                      },
                    },
                  })}
                />
                <div className="__config-control-subsection-note-description">
                  Build rules for assembled name are in the <strong>Assembled name</strong> section.
                </div>
              </div>
            </div>
          </section>

          <div className={"__divider"} />

          <AssembledNameSection
            assembly={assembly_config}
            routing={routing_config}
            filenameSource={filename_config?.source}
            disabled={controlsDisabled}
            columnOptions={column_options}
            sampleRow={activePreviewRow}
            onScrollToLabel={() => scrollConfigSectionIntoView('config-slide-label')}
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
