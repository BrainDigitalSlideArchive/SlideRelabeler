import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import ConfigTestItOutSection from './ConfigTestItOutSection';
import ConfigPreviewRowEditor from './ConfigPreviewRowEditor';
import LabelComposer from './LabelComposer';

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

export default function LabelGuidedSteps({
  config,
  labelConfig,
  disabled,
  previewRow,
  previewRowMode,
  previewFilePath,
  resolvedPreview,
  schematicPreview,
  hasLoadedFiles,
  reservedColumns = [],
  fileCols = [],
  onPreviewRowChange,
  onLoadPreviewFromFirstRow,
  onResetPreviewRow,
  onRecompute,
  placeholderCatalogs = {},
  patternValidationMessages = [],
}) {
  const dispatch = useDispatch();

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
    <div className="label-guided-steps">
      {patternValidationMessages.length > 0 && (
        <div className="config-pattern-validation" role="alert">
          {patternValidationMessages.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
        </div>
      )}
      <LabelComposer
        disabled={disabled}
        labelConfig={labelConfig}
        config={config}
        previewRow={previewRow}
        previewFilePath={previewFilePath}
        previewWarnings={previewWarnings}
        resolvedPreview={schematicPreview}
        onRecompute={onRecompute}
        placeholderCatalogs={placeholderCatalogs}
        addText={labelConfig.add_text}
        addQr={labelConfig.add_qr}
        addIcon={labelConfig.add_icon}
        onToggleText={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_TEXT })}
        onToggleQr={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_QR })}
        onToggleIcon={() => dispatch({ type: config_actions.TOGGLE_ADD_ICON })}
        iconPath={labelConfig.icon_file?.source?.path}
      />
      <ConfigTestItOutSection
        hint={testItOutHint}
        disabled={disabled}
        hasLoadedFiles={hasLoadedFiles}
        onLoadFromFirstRow={onLoadPreviewFromFirstRow}
        onResetToExample={onResetPreviewRow}
      >
        <ConfigPreviewRowEditor
          previewRow={previewRow}
          config={config}
          reservedColumns={reservedColumns}
          fileCols={fileCols}
          disabled={disabled}
          onRowChange={onPreviewRowChange}
          highlightColumnFields={highlightColumnFields}
        />
      </ConfigTestItOutSection>
    </div>
  );
}
