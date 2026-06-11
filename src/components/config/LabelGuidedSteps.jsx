import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import LabelCompositionPanel from './LabelCompositionPanel';
import LabelContentBuilder from './LabelContentBuilder';
import SpecimenIdStep from './SpecimenIdStep';
import LabelReviewPanel from './LabelReviewPanel';
import Button from '../controls/button/Button';
import { needsSpecimenId } from '../../helpers/label_config_helpers';

export default function LabelGuidedSteps({
  config,
  labelConfig,
  assemblyConfig,
  routingConfig,
  namingConfig,
  columnOptions,
  disabled,
  activePreviewRow,
  previewFilePath,
  resolvedPreview,
  hasLoadedFiles,
  previewRowSource,
  onPreviewRowSourceChange,
  onRecompute,
  assembledPreview,
}) {
  const dispatch = useDispatch();
  const showSpecimen = needsSpecimenId(labelConfig);

  const steps = useMemo(() => {
    const list = [{ key: 'composition', label: "What's on the label?" }];
    if (labelConfig?.add_text) list.push({ key: 'text', label: 'Readable text' });
    if (showSpecimen) list.push({ key: 'specimen', label: 'Specimen ID' });
    if (labelConfig?.add_qr) list.push({ key: 'qr', label: 'QR code' });
    if (labelConfig?.add_icon) list.push({ key: 'icon', label: 'Overlay image' });
    list.push({ key: 'review', label: 'Review' });
    return list;
  }, [labelConfig, showSpecimen]);

  function stepHeader(index, label) {
    return `Step ${index + 1} of ${steps.length} · ${label}`;
  }

  function stepIndex(key) {
    return steps.findIndex((s) => s.key === key);
  }

  const colName = assemblyConfig?.columnName || 'AssembledName';
  const usesCustomLabel =
    labelConfig?.add_text &&
    (labelConfig.label_text_assembly?.mode !== 'legacy' ||
      (routingConfig?.labelText?.enabled &&
        labelConfig.text_column_field?.value !== colName));

  return (
    <div className="label-guided-steps">
      <div className="config-guided-step">
        <div className="config-step-header">{stepHeader(stepIndex('composition'), steps[stepIndex('composition')]?.label)}</div>
        <LabelCompositionPanel
          disabled={disabled}
          addText={labelConfig.add_text}
          addQr={labelConfig.add_qr}
          addIcon={labelConfig.add_icon}
          onToggleText={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_TEXT })}
          onToggleQr={() => dispatch({ type: config_actions.TOGGLE_ADD_LABEL_QR })}
          onToggleIcon={() => dispatch({ type: config_actions.TOGGLE_ADD_ICON })}
          previewText={resolvedPreview.labelText}
          previewQr={resolvedPreview.qrPayload}
          iconPath={labelConfig.icon_file?.source?.path}
        />
      </div>

      {labelConfig.add_text && (
        <div className="config-guided-step">
          <div className="config-step-header">{stepHeader(stepIndex('text'), steps[stepIndex('text')]?.label)}</div>
          {!routingConfig?.labelText?.enabled && (
            <div className="label-guided-steps__shortcut">
              <Button
                disabled={disabled}
                text="Use assembled name column"
                onClick={() => {
                  dispatch({ type: config_actions.USE_ASSEMBLED_NAME_FOR_LABEL });
                  onRecompute();
                }}
              />
            </div>
          )}
          {usesCustomLabel && (
            <div className="__config-control-subsection-note-description">
              Label uses custom pattern (not assembled name).
            </div>
          )}
          <LabelContentBuilder
            kind="labelText"
            assemblyConfig={labelConfig.label_text_assembly || { mode: 'legacy', template: '', fieldsOrder: [], separator: '_' }}
            onChange={(cfg) => dispatch({ type: config_actions.SET_LABEL_TEXT_ASSEMBLY, payload: cfg })}
            onRecompute={onRecompute}
            columnOptions={columnOptions}
            disabled={disabled}
            exampleRow={activePreviewRow}
            exampleDeidToken={resolvedPreview.deidToken || namingConfig?.accessionToken || 'CASE_DEMO'}
            textColumnField={labelConfig.text_column_field}
            onTextColumnChange={(item) => dispatch({ type: config_actions.CHANGE_TEXT_COLUMN_FIELD, payload: item })}
            filenameUsesUuid={config.filename?.use_uuid}
            fieldItemsForCombine={columnOptions}
            onAssemblyFieldsChange={(partial) => {
              dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
              onRecompute();
            }}
          />
        </div>
      )}

      {showSpecimen && (
        <SpecimenIdStep
          assembly={assemblyConfig}
          disabled={disabled}
          columnOptions={columnOptions}
          previewToken={resolvedPreview.deidToken}
          stepLabel={stepHeader(stepIndex('specimen'), steps[stepIndex('specimen')]?.label)}
        />
      )}

      {labelConfig.add_qr && (
        <div className="config-guided-step">
          <div className="config-step-header">{stepHeader(stepIndex('qr'), steps[stepIndex('qr')]?.label)}</div>
          <LabelContentBuilder
            kind="qrPayload"
            assemblyConfig={labelConfig.qr_assembly || { mode: 'legacy', template: '', fieldsOrder: [], separator: '' }}
            onChange={(cfg) => dispatch({ type: config_actions.SET_QR_ASSEMBLY, payload: cfg })}
            onRecompute={onRecompute}
            columnOptions={columnOptions}
            disabled={disabled}
            exampleRow={activePreviewRow}
            exampleDeidToken={resolvedPreview.deidToken || namingConfig?.accessionToken || 'CASE_DEMO'}
            qrMode={labelConfig.qr_mode}
            onQrModeChange={(item) => dispatch({ type: config_actions.CHANGE_QR_MODE, payload: item })}
            qrColumnField={labelConfig.qr_column_field}
            onQrColumnFieldChange={(item) => dispatch({ type: config_actions.CHANGE_QR_COLUMN_FIELD, payload: item })}
            qrColumnFields={labelConfig.qr_column_fields}
            onQrColumnFieldsChange={(item) => dispatch({ type: config_actions.CHANGE_QR_COLUMN_FIELDS, payload: item })}
            filenameUsesUuid={config.filename?.use_uuid}
          />
        </div>
      )}

      {labelConfig.add_icon && (
        <div className="config-guided-step">
          <div className="config-step-header">{stepHeader(stepIndex('icon'), steps[stepIndex('icon')]?.label)}</div>
          <div className="__config-control-section-group">
            <Button
              disabled={disabled}
              text="Select icon (file)"
              onClick={() => dispatch({ type: config_actions.SELECT_ICON_FILE })}
              result={labelConfig.icon_file && labelConfig.icon_file.source.path}
            />
          </div>
        </div>
      )}

      <LabelReviewPanel
        addText={labelConfig.add_text}
        addQr={labelConfig.add_qr}
        addIcon={labelConfig.add_icon}
        labelText={resolvedPreview.labelText}
        qrPayload={resolvedPreview.qrPayload}
        assembledName={assembledPreview}
        deidToken={showSpecimen ? resolvedPreview.deidToken : ''}
        warnings={resolvedPreview.warnings}
        rowSource={hasLoadedFiles && previewRowSource === 'first' ? 'first' : 'sample'}
        onRowSourceChange={onPreviewRowSourceChange}
        hasLoadedFiles={hasLoadedFiles}
        emptyFilesBanner={
          !hasLoadedFiles
            ? 'No slides loaded—showing sample data. Load files to verify.'
            : null
        }
        config={config}
        fileRow={activePreviewRow}
        filePath={previewFilePath}
        iconPath={labelConfig.icon_file?.source?.path}
      />
    </div>
  );
}
