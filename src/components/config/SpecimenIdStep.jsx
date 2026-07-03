import React from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';

const SPECIMEN_SOURCE_OPTIONS = [
  { label: 'From slide metadata', value: 'from_metadata' },
  { label: 'Same ID for every slide', value: 'fixed' },
  { label: 'Generate from slide Image ID', value: 'generated' },
  { label: 'From CSV column', value: 'from_column' },
];

export default function SpecimenIdStep({
  assembly,
  disabled = false,
  columnOptions = [],
  previewToken = '',
  stepLabel,
  embedded = false,
  compact = false,
}) {
  const dispatch = useDispatch();
  const specimenId = assembly?.specimenId ?? {};
  const selectedSource = SPECIMEN_SOURCE_OPTIONS.filter((o) => o.value === (specimenId.source || 'from_metadata'));
  const tokenColumnItem = specimenId.column
    ? columnOptions.find((o) => o.value === specimenId.column) || { label: specimenId.column, value: specimenId.column }
    : null;

  function setAssembly(partial) {
    dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  const body = compact ? (
    <div className="specimen-id-step specimen-id-step--compact">
      <div className="label-content-builder__field-row">
        <span className="label-content-builder__field-label">Source</span>
        <Dropdown
          disabled={disabled}
          omitLabel
          ariaLabel="Specimen ID source"
          placeholder="Select source"
          items={SPECIMEN_SOURCE_OPTIONS}
          selectedItems={selectedSource}
          onSelect={(item) => setAssembly({ specimenId: { ...specimenId, source: item.value } })}
        />
      </div>
      {specimenId.source === 'fixed' && (
        <div className="label-content-builder__field-row">
          <InputText
            disabled={disabled}
            omitLabel
            ariaLabel="Fixed specimen ID"
            placeholder="e.g. CASE42"
            value={specimenId.fixedValue || ''}
            onChange={(v) => setAssembly({ specimenId: { ...specimenId, fixedValue: v } })}
          />
        </div>
      )}
      <div className="label-content-builder__field-row">
        <span className="label-content-builder__field-label">Column</span>
        <Dropdown
          disabled={disabled}
          omitLabel
          ariaLabel="Column with per-slide ID"
          placeholder="Optional"
          items={columnOptions}
          selectedItems={tokenColumnItem ? [tokenColumnItem] : []}
          onSelect={(item) => setAssembly({ specimenId: { ...specimenId, column: item?.value ?? '' } })}
        />
      </div>
    </div>
  ) : (
    <>
      {!embedded && (
        <>
          <div className="__config-control-subsection-title">Specimen ID</div>
          <div className="__config-control-subsection-description">
            A short anonymous ID for the case or slide (example: CASE42). It can appear in label text, QR codes, and
            upload metadata. It is not the filename on disk.
          </div>
        </>
      )}
      {embedded && !compact && (
        <div className="__config-control-subsection-description">
          A short anonymous ID for the case or slide. It can appear in label text, QR codes, and upload metadata.
        </div>
      )}
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="Specimen ID source"
          placeholder="Select source"
          items={SPECIMEN_SOURCE_OPTIONS}
          selectedItems={selectedSource}
          onSelect={(item) => setAssembly({ specimenId: { ...specimenId, source: item.value } })}
        />
      </div>
      {specimenId.source === 'fixed' && (
        <InputText
          disabled={disabled}
          label="Fixed specimen ID"
          value={specimenId.fixedValue || ''}
          onChange={(v) => setAssembly({ specimenId: { ...specimenId, fixedValue: v } })}
        />
      )}
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="Column with per-slide ID (optional)"
          placeholder="Select column"
          items={columnOptions}
          selectedItems={tokenColumnItem ? [tokenColumnItem] : []}
          onSelect={(item) => setAssembly({ specimenId: { ...specimenId, column: item?.value ?? '' } })}
        />
      </div>
      <div className="__config-control-subsection-note-description">
        For the preview slide: <strong>{previewToken && String(previewToken).trim() ? previewToken : '(not set)'}</strong>
      </div>
    </>
  );

  if (embedded || compact) {
    return body;
  }

  return (
    <div className="config-guided-step config-guided-section">
      {stepLabel && <div className="config-step-header">{stepLabel}</div>}
      {body}
    </div>
  );
}
