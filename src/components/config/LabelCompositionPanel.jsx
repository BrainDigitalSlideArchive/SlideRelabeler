import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import LabelCompositionControls from './LabelCompositionControls';
import LabelCompositionMockup from './LabelCompositionMockup';
import LabelContentBuilder from './LabelContentBuilder';
import SpecimenIdStep from './SpecimenIdStep';
import Button from '../controls/button/Button';
import {
  iconSummary,
  labelTextSummary,
  qrSummary,
  specimenIdSummary,
} from '../../helpers/label_composition_summaries';

export default function LabelCompositionPanel({
  disabled,
  addText,
  addQr,
  addIcon,
  onToggleText,
  onToggleQr,
  onToggleIcon,
  previewText,
  previewQr,
  iconPath,
  showSpecimen,
  resolvedPreview,
  labelConfig,
  config,
  assemblyConfig,
  routingConfig,
  namingConfig,
  columnOptions,
  activePreviewRow,
  onRecompute,
  usesCustomLabel,
}) {
  const dispatch = useDispatch();
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    if (!showSpecimen) {
      setExpandedKey((prev) => (prev === 'specimen' ? null : prev));
    }
  }, [showSpecimen]);

  const summaries = {
    text: labelTextSummary(previewText),
    icon: iconSummary(iconPath),
    qr: qrSummary(previewQr),
  };

  const handleToggleExpand = useCallback((key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  function wrapToggle(toggleFn, key) {
    return () => {
      const wasChecked = key === 'text' ? addText : key === 'qr' ? addQr : addIcon;
      toggleFn();
      if (wasChecked) {
        setExpandedKey((prev) => (prev === key ? null : prev));
      } else {
        setExpandedKey((prev) => (prev === null ? key : prev));
      }
    };
  }

  function renderConfigBody(key) {
    if (key === 'text') {
      return (
        <>
          {!routingConfig?.labelText?.enabled && (
            <div className="label-guided-steps__shortcut">
              <Button
                variant="onLight"
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
            exampleSpecimenId={namingConfig?.accessionToken || 'CASE_DEMO'}
            textColumnField={labelConfig.text_column_field}
            onTextColumnChange={(item) => dispatch({ type: config_actions.CHANGE_TEXT_COLUMN_FIELD, payload: item })}
            filenameUsesUuid={config.filename?.use_uuid}
            fieldItemsForCombine={columnOptions}
            onAssemblyFieldsChange={(partial) => {
              dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
              onRecompute();
            }}
          />
        </>
      );
    }

    if (key === 'icon') {
      return (
        <div className="__config-control-section-group">
          <Button
            variant="onLight"
            disabled={disabled}
            text="Select icon (file)"
            onClick={() => dispatch({ type: config_actions.SELECT_ICON_FILE })}
            result={labelConfig.icon_file && labelConfig.icon_file.source.path}
          />
          <Button
            variant="onLight"
            disabled={disabled || !labelConfig.icon_file}
            text="Clear"
            onClick={() => dispatch({ type: config_actions.CHANGE_ICON_FILE, payload: null })}
          />
        </div>
      );
    }

    if (key === 'qr') {
      return (
        <LabelContentBuilder
          kind="qrPayload"
          assemblyConfig={labelConfig.qr_assembly || { mode: 'legacy', template: '', fieldsOrder: [], separator: '' }}
          onChange={(cfg) => dispatch({ type: config_actions.SET_QR_ASSEMBLY, payload: cfg })}
          onRecompute={onRecompute}
          columnOptions={columnOptions}
          disabled={disabled}
          exampleRow={activePreviewRow}
          exampleSpecimenId={namingConfig?.accessionToken || 'CASE_DEMO'}
          qrMode={labelConfig.qr_mode}
          onQrModeChange={(item) => dispatch({ type: config_actions.CHANGE_QR_MODE, payload: item })}
          qrColumnField={labelConfig.qr_column_field}
          onQrColumnFieldChange={(item) => dispatch({ type: config_actions.CHANGE_QR_COLUMN_FIELD, payload: item })}
          qrColumnFields={labelConfig.qr_column_fields}
          onQrColumnFieldsChange={(item) => dispatch({ type: config_actions.CHANGE_QR_COLUMN_FIELDS, payload: item })}
          filenameUsesUuid={config.filename?.use_uuid}
        />
      );
    }

    return null;
  }

  return (
    <div className="label-composition-panel">
      <div className="label-composition-panel__heading">What should the new label include?</div>
      <div className="label-composition-panel__columns">
        <LabelCompositionControls
          disabled={disabled}
          addText={addText}
          addQr={addQr}
          addIcon={addIcon}
          onToggleText={wrapToggle(onToggleText, 'text')}
          onToggleQr={wrapToggle(onToggleQr, 'qr')}
          onToggleIcon={wrapToggle(onToggleIcon, 'icon')}
          expandedKey={expandedKey}
          onToggleExpand={handleToggleExpand}
          summaries={summaries}
          renderConfigBody={renderConfigBody}
          showSpecimen={showSpecimen}
          specimenSummary={specimenIdSummary(namingConfig?.accessionToken || 'CASE_DEMO')}
          specimenBody={(
            <SpecimenIdStep
              embedded
              assembly={assemblyConfig}
              disabled={disabled}
              columnOptions={columnOptions}
              previewToken={namingConfig?.accessionToken || 'CASE_DEMO'}
            />
          )}
        />
        <LabelCompositionMockup
          addText={addText}
          addQr={addQr}
          addIcon={addIcon}
          previewText={previewText}
          previewQr={previewQr}
          iconPath={iconPath}
        />
      </div>
    </div>
  );
}
