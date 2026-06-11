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
import ConfigStickyNav from '../../components/config/ConfigStickyNav';
import ConfigOverviewSection from '../../components/config/ConfigOverviewSection';
import AssemblyBuildControls from '../../components/config/AssemblyBuildControls';
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
  const dsa = useSelector(state => state.dsa);

  const dispatch = useDispatch();
  const blocked_fields = useSelector(state => state.files.blocked_fields);

  const example_filename = '1234.tiff';
  const example_basename = return_filename_basename_from_filename(example_filename);
  const example_ext = return_file_extension_from_path(example_filename);
  const example_uuid = "acde070d-8c4c-4f0d-9d8a-162843c10333";
  const [rename, set_rename] = useState(example_basename);
  const [previewRowSource, setPreviewRowSource] = useState('sample');

  const hasLoadedFiles = Array.isArray(file_rows) && file_rows.length > 0;
  const firstFileRow = hasLoadedFiles ? file_rows[0] : null;
  const previewFilePath = firstFileRow?.__reserved?.source?.path ?? null;

  const sampleRow = useMemo(() => ({
    BlockId: 'B12',
    StainId: 'HE',
    SlideNum: '1',
    Accession: 'DEMO_ACC',
    AssembledName: rename,
    __reserved: { uuid: example_uuid, rename: rename },
  }), [rename, example_uuid]);

  const activePreviewRow = useMemo(() => {
    if (previewRowSource === 'first' && firstFileRow) return firstFileRow;
    return sampleRow;
  }, [previewRowSource, firstFileRow, sampleRow]);

  const assembledPreview = useMemo(
    () => buildAssembledName(activePreviewRow, assembly_config) || rename,
    [activePreviewRow, assembly_config, rename],
  );

  const resolvedPreview = useMemo(
    () => previewLabelStrings(config, activePreviewRow, {
      usingSample: !hasLoadedFiles,
    }),
    [config, activePreviewRow, hasLoadedFiles],
  );

  const controlsDisabled = processing || disable_changes;
  const useReadableFilename = !filename_config.use_uuid;

  const [column_options, set_column_options] = useState([]);

  useEffect(() => {
    const new_all_cols = [...reserved_cols, ...file_cols];
    set_column_options(generate_dropdown_for_table_columns(new_all_cols, blocked_fields));
  }, [reserved_cols, file_cols, blocked_fields]);

  function triggerRecompute() {
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  function setAssembly(partial) {
    dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
    triggerRecompute();
  }

  function selectFilenameStyle(style) {
    if (style === 'uuid' && !filename_config.use_uuid) {
      dispatch({ type: config_actions.TOGGLE_UUID });
    } else if (style === 'readable' && filename_config.use_uuid) {
      dispatch({ type: config_actions.TURN_ON_RENAME_MODE });
    }
  }

  function create_filename_example() {
    let output_filename = '';
    if (filename_config.use_uuid) {
      output_filename += example_uuid;
    } else {
      output_filename += assembledPreview || example_basename;
    }
    if (filename_config.use_prefix) {
      output_filename = filename_config.prefix + output_filename;
    }
    if (filename_config.use_suffix) {
      output_filename = output_filename + filename_config.suffix;
    }
    return output_filename;
  }

  const catalogConfigured = Boolean(dsa?.api_auth && routing_config?.dsaItemName?.enabled);

  return (
    <div className="__modal">
      <ModalHeader title={"Configuration"} type={"config"} />
      <div className={"__content"}>
        <div className={"__divider"} />
        <ConfigStickyNav />
        <div className={"__config-controls"}>
          <ConfigOverviewSection
            outputFilenameExample={`${create_filename_example()}.${example_ext}`}
            labelTextExample={resolvedPreview.labelText}
            qrExample={resolvedPreview.qrPayload}
            assembledNameExample={assembledPreview}
            catalogConfigured={catalogConfigured}
            hasLoadedFiles={hasLoadedFiles}
          />

          <div className={"__divider"} />

          <section className="__config-control-section config-guided-section" id="config-output-filename">
            <div className={"__config-control-section-title"}>Output filename</div>
            <div className={"__config-control-section-description"}>
              Choose how de-identified files are named when saved to disk. This does not change the slide label unless
              you configure that separately.
            </div>

            <div className="config-filename-style" role="radiogroup" aria-label="Naming style">
              <label className="config-filename-style__option">
                <input
                  type="radio"
                  name="filename-style"
                  disabled={controlsDisabled}
                  checked={filename_config.use_uuid}
                  onChange={() => selectFilenameStyle('uuid')}
                />
                <span className="config-filename-style__label">Use a system file ID (recommended for sharing)</span>
                <span className="config-filename-style__helper">Assigns a random UUID per file.</span>
              </label>
              <label className="config-filename-style__option">
                <input
                  type="radio"
                  name="filename-style"
                  disabled={controlsDisabled}
                  checked={useReadableFilename}
                  onChange={() => selectFilenameStyle('readable')}
                />
                <span className="config-filename-style__label">Use assembled name from metadata</span>
                <span className="config-filename-style__helper">Builds the filename from slide metadata below.</span>
              </label>
            </div>

            {useReadableFilename && (
              <div className="config-filename-style__assembly">
                <div className="__config-control-subsection-title">Build assembled name</div>
                <AssemblyBuildControls
                  assembly={assembly_config}
                  disabled={controlsDisabled}
                  columnOptions={column_options}
                  sampleRow={activePreviewRow}
                  onAssemblyChange={setAssembly}
                  compact
                />
              </div>
            )}

            {useReadableFilename && (
              <div className={"__config-control-section-group"}>
                <Checkbox disabled={controlsDisabled} label={"Add prefix"} checked={filename_config.use_prefix} onClick={() => dispatch({ type: config_actions.TOGGLE_PREFIX })} />
                <InputText disabled={controlsDisabled || !filename_config.use_prefix} label={"Prefix"} value={filename_config.prefix} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_PREFIX, payload: new_value })} />
              </div>
            )}
            {useReadableFilename && (
              <div className={"__config-control-section-group"}>
                <Checkbox disabled={controlsDisabled} label={"Add suffix"} checked={filename_config.use_suffix} onClick={() => dispatch({ type: config_actions.TOGGLE_SUFFIX })} />
                <InputText disabled={controlsDisabled || !filename_config.use_suffix} label={"Suffix"} value={filename_config.suffix} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_SUFFIX, payload: new_value })} />
              </div>
            )}

            <div className={"__config-control-section-infobox"}>
              <div className={"__infobox-title"}>Example for one file</div>
              <div className={"__infobox-labels"}>
                <div className={"__infobox-label"}>Original file</div>
                <div className={"__infobox-label"}>Assembled name</div>
                <div className={"__infobox-label"}>Your output filename</div>
              </div>
              <div className={"__infobox-items"}>
                <div className={"__infobox-item"}>{example_filename}</div>
                <div className={"__infobox-item"}>
                  {filename_config.use_prefix && useReadableFilename && <span>{filename_config.prefix}</span>}
                  <input
                    className={controlsDisabled ? "__input-text _disabled" : "__input-text"}
                    disabled={controlsDisabled || filename_config.use_uuid}
                    value={filename_config.use_uuid ? example_uuid : assembledPreview}
                    onChange={(e) => set_rename(e.target.value)}
                  />
                  {filename_config.use_suffix && useReadableFilename && <span>{filename_config.suffix}</span>}
                  {!filename_config.use_uuid && <span>.{example_ext}</span>}
                </div>
                <div className={"__infobox-item"}>
                  {create_filename_example()}.{example_ext}
                </div>
              </div>
            </div>
            <div className="__config-control-subsection-note-description">
              Globus uploads use the same filename as the file on disk. There is no separate Globus display name.
            </div>
          </section>

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
              If you process slides from a spreadsheet, specify which columns mean file path, optional rename hint, and
              optional output folder. Column names are case-sensitive.
            </div>
            <div className={"__config-control-section-container"}>
              <div className={"__config-control-subsection"}>
                <InputText disabled={controlsDisabled} label={"File path column (required)"} value={csv_config.file_path_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_PATH_COLUMN, payload: new_value })} />
                <InputText disabled={controlsDisabled} label={"Rename hint column (optional)"} value={csv_config.file_rename_column} onChange={(new_value) => dispatch({ type: config_actions.CHANGE_FILE_RENAME_COLUMN, payload: new_value })} />
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
            disabled={controlsDisabled}
            columnOptions={column_options}
            sampleRow={activePreviewRow}
            onScrollToLabel={() => {
              document.getElementById('config-slide-label')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
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
      <div className={"__footer"} />
    </div>
  );
}

export default ModalConfig;
