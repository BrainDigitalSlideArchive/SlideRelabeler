import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../actions/config';
import { getPatternPlaceholderCatalog } from '../../../helpers/pattern_engine.js';
import { selectPatternValidationFromState } from '../../../helpers/pattern_validation.js';
import ConfigPreviewRowEditor from '../../config/ConfigPreviewRowEditor';
import { useConfigPreviewSandbox } from '../preview/ConfigPreviewSandbox';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigTestPreview from '../primitives/ConfigTestPreview';
import ConfigWarnText from '../primitives/ConfigWarnText';
import ConfigCallout from '../primitives/ConfigCallout';
import LabelComposer from './slide-label/LabelComposer';

const SLIDE_LABEL_HELP = (
  <>
    Choose what appears on the printed slide label: text, a QR code, and/or an icon. For text and QR,
    set how empty cells are filled by default. Use <strong>Test it out</strong> to preview on the
    sample row or the first loaded file.
  </>
);

function buildLabelTestItOutHint(labelConfig) {
  const names = [];
  if (labelConfig?.add_text) names.push('Label');
  if (labelConfig?.add_qr) names.push('QR');

  if (names.length === 0) {
    return 'Edit cells below to update the rendered preview. Changes stay here.';
  }

  if (names.length === 2) {
    return (
      <>
        The highlighted <strong>Label</strong> and <strong>QR</strong> columns show values
        used in the rendered preview. Edit cells to try different content.
      </>
    );
  }

  return (
    <>
      The highlighted <strong>{names[0]}</strong> column shows values used in the rendered
      preview. Edit cells to try different content.
    </>
  );
}

/**
 * Slide label — Phase 2f.
 * Recipe: Section → FeatureBlock×3 → schematic/preview → TestPreview (shared sandbox).
 */
export default function SlideLabelSection() {
  const dispatch = useDispatch();
  const {
    enrichedConfig,
    labelConfig,
    fileRows,
    fileCols,
    reservedColumns,
    hasLoadedFiles,
    controlsDisabled,
    activePreviewRow,
    previewFilePath,
    resolvedPreview,
    schematicPreview,
    recomputeNotice,
    triggerRecompute,
    onPreviewRowChange,
    loadPreviewFromFirstRow,
    resetPreviewRow,
  } = useConfigPreviewSandbox();

  const csvConfig = useSelector((state) => state.config.csv);
  const disabled = controlsDisabled;

  const placeholderCatalogs = useMemo(
    () => ({
      labelText: getPatternPlaceholderCatalog({
        field: 'labelText',
        fileRows,
        fileCols,
        hasLoadedFiles,
        csvConfig,
      }),
      qrContent: getPatternPlaceholderCatalog({
        field: 'qrContent',
        fileRows,
        fileCols,
        hasLoadedFiles,
        csvConfig,
      }),
    }),
    [fileRows, fileCols, hasLoadedFiles, csvConfig],
  );

  const patternValidationMessages = useMemo(
    () => selectPatternValidationFromState({
      config: enrichedConfig,
      file_rows: fileRows,
      file_cols: fileCols,
    }).messages,
    [enrichedConfig, fileRows, fileCols],
  );

  const previewWarnings = useMemo(() => {
    const issueMessages = new Set((resolvedPreview.issues ?? []).map((issue) => issue.message));
    return (resolvedPreview.warnings ?? []).filter((w) => !issueMessages.has(w));
  }, [resolvedPreview.warnings, resolvedPreview.issues]);

  const highlightColumnFields = useMemo(() => {
    const fields = [];
    if (labelConfig?.add_text) fields.push('__reserved.labelText');
    if (labelConfig?.add_qr) fields.push('__reserved.qrPayload');
    return fields;
  }, [labelConfig?.add_text, labelConfig?.add_qr]);

  const testItOutHint = useMemo(
    () => buildLabelTestItOutHint(labelConfig),
    [labelConfig?.add_text, labelConfig?.add_qr],
  );

  return (
    <ConfigSection
      id="config-slide-label"
      title="Slide label"
      description="What appears on each slide's new label, and how empty Label text and QR content cells are filled."
      help={SLIDE_LABEL_HELP}
      helpLabel="Slide label help"
    >
      <ConfigSectionPanel>
        {patternValidationMessages.length > 0 ? (
          <div className="cfg-pattern-validation" role="alert">
            {patternValidationMessages.map((msg) => (
              <ConfigWarnText key={msg}>{msg}</ConfigWarnText>
            ))}
          </div>
        ) : null}

        {recomputeNotice ? (
          <ConfigCallout variant="accent">{recomputeNotice}</ConfigCallout>
        ) : null}

        <LabelComposer
          disabled={disabled}
          labelConfig={labelConfig}
          config={enrichedConfig}
          previewRow={activePreviewRow}
          previewFilePath={previewFilePath}
          previewWarnings={previewWarnings}
          schematicPreview={schematicPreview}
          onRecompute={triggerRecompute}
          placeholderCatalogs={placeholderCatalogs}
          hasLoadedFiles={hasLoadedFiles}
          addText={labelConfig?.add_text}
          addQr={labelConfig?.add_qr}
          addIcon={labelConfig?.add_icon}
          onToggleText={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_TEXT })}
          onToggleQr={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_QR })}
          onToggleIcon={() => dispatch({ type: config_actions.TOGGLE_ADD_ICON })}
          iconPath={labelConfig?.icon_file?.source?.path}
        />

        <ConfigTestPreview
          hint={testItOutHint}
          disabled={disabled}
          hasLoadedFiles={hasLoadedFiles}
          onLoadFromFirstRow={loadPreviewFromFirstRow}
          onResetToExample={resetPreviewRow}
        >
          <ConfigPreviewRowEditor
            previewRow={activePreviewRow}
            config={enrichedConfig}
            reservedColumns={reservedColumns}
            fileCols={fileCols}
            disabled={disabled}
            onRowChange={onPreviewRowChange}
            highlightColumnFields={highlightColumnFields}
          />
        </ConfigTestPreview>
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
