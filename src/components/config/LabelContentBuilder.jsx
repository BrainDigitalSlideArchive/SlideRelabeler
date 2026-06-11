import React, { useMemo, useState } from 'react';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';
import { evaluateTemplate, assembleFromFields } from '../../helpers/template_engine';
import { assemblyModeToGoal, goalToAssemblyMode } from '../../helpers/label_config_helpers';

const PSEUDO_FIELDS = [
  { label: 'Specimen ID', value: 'deidToken' },
  { label: 'UUID', value: 'uuid' },
];

const LABEL_GOAL_OPTIONS = [
  { label: 'Show one metadata field', value: 'one_column', helper: 'Pick a single column (e.g. stain, block, or assembled name).' },
  { label: 'Combine several fields', value: 'combine_fields', helper: 'Join fields with a separator (e.g. CASE42_B12_HE).' },
  { label: 'Write a custom pattern', value: 'custom_pattern', helper: 'For advanced layouts with placeholders.' },
];

const QR_GOAL_OPTIONS = [
  { label: 'Link to this file (system file ID)', value: 'link_file', helper: 'Encodes the UUID assigned to the file.' },
  { label: 'One metadata field', value: 'one_field', helper: 'Encode a single column value.' },
  { label: 'Combine fields', value: 'combine_fields', helper: 'Join selected fields with a separator.' },
  { label: 'Custom pattern', value: 'custom_pattern', helper: 'Full control over encoded string.' },
];

const QR_GOAL_ADVANCED = [
  { label: 'Structured data (JSON)', value: 'structured', helper: 'Encodes selected columns as JSON (advanced).' },
];

function mapFieldsToAssembly(fieldsOrder) {
  return fieldsOrder.map((f) => (f === 'deidToken' ? 'specimenId' : f));
}

/**
 * Unified builder for label text or QR payload with goal-first radios.
 */
export default function LabelContentBuilder({
  kind,
  assemblyConfig,
  onChange,
  onRecompute,
  columnOptions = [],
  disabled = false,
  exampleRow = null,
  exampleDeidToken = '',
  textColumnField,
  onTextColumnChange,
  qrMode,
  onQrModeChange,
  qrColumnField,
  onQrColumnFieldChange,
  qrColumnFields = [],
  onQrColumnFieldsChange,
  filenameUsesUuid = true,
  onAssemblyFieldsChange,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const mode = assemblyConfig?.mode || 'legacy';
  const goal = assemblyModeToGoal(mode);
  const fieldsOrder = Array.isArray(assemblyConfig?.fieldsOrder) ? assemblyConfig.fieldsOrder : [];
  const separator = assemblyConfig?.separator ?? (kind === 'qrPayload' ? '' : '_');

  const fieldItems = useMemo(() => {
    const fromCols = (columnOptions || [])
      .filter((c) => c?.value && !String(c.value).startsWith('__reserved.'))
      .map((c) => ({ label: c.label || c.value, value: c.value }));
    const assembled = { label: 'Assembled name', value: 'AssembledName' };
    const hasAssembled = fromCols.some((c) => c.value === 'AssembledName');
    return [...PSEUDO_FIELDS, ...(hasAssembled ? [] : [assembled]), ...fromCols.filter((c) => c.value !== 'rename')];
  }, [columnOptions]);

  const preview = useMemo(() => {
    if (!exampleRow || mode === 'legacy') return '';
    const ctx = { deidToken: exampleDeidToken };
    if (mode === 'template') {
      return evaluateTemplate(exampleRow, assemblyConfig?.template, ctx);
    }
    if (mode === 'fields') {
      return assembleFromFields(exampleRow, fieldsOrder, separator, ctx);
    }
    return '';
  }, [exampleRow, mode, assemblyConfig?.template, fieldsOrder, separator, exampleDeidToken]);

  function patch(partial) {
    onChange({ ...assemblyConfig, ...partial });
    if (onRecompute) onRecompute();
  }

  function setGoal(nextGoal) {
    const nextMode = goalToAssemblyMode(nextGoal);
    patch({ mode: nextMode });
    if (kind === 'qrPayload') {
      if (nextGoal === 'link_file' && onQrModeChange) {
        onQrModeChange({ value: 'uuid', label: 'Encode UUID' });
      } else if (nextGoal === 'one_field' && onQrModeChange) {
        onQrModeChange({ value: 'column_field', label: 'Single column value' });
      } else if (nextGoal === 'structured' && onQrModeChange) {
        onQrModeChange({ value: 'column_fields', label: 'JSON from columns' });
      }
    }
  }

  function toggleField(value) {
    const exists = fieldsOrder.includes(value);
    const next = exists ? fieldsOrder.filter((x) => x !== value) : [...fieldsOrder, value];
    patch({ fieldsOrder: next });
    if (kind === 'labelText' && onAssemblyFieldsChange) {
      onAssemblyFieldsChange({ fieldsOrder: mapFieldsToAssembly(next) });
    }
  }

  const goalOptions = kind === 'labelText' ? LABEL_GOAL_OPTIONS : [...QR_GOAL_OPTIONS, ...(advancedOpen ? QR_GOAL_ADVANCED : [])];
  const qrGoalValue = (() => {
    if (mode !== 'legacy') return goal;
    const qm = qrMode?.value ?? 'user_defined';
    if (qm === 'uuid') return 'link_file';
    if (qm === 'column_field') return 'one_field';
    if (qm === 'column_fields') return 'structured';
    return 'link_file';
  })();
  const activeGoal = kind === 'qrPayload' && mode === 'legacy' ? qrGoalValue : goal;

  const showFilenameWarning =
    kind === 'qrPayload' &&
    activeGoal === 'link_file' &&
    filenameUsesUuid;

  return (
    <div className="__config-control-subsection label-content-builder">
      <div className="label-content-builder__goals" role="radiogroup" aria-label={kind === 'labelText' ? 'Label text goal' : 'QR goal'}>
        {goalOptions.map((opt) => (
          <label key={opt.value} className="label-content-builder__goal">
            <input
              type="radio"
              name={`${kind}-goal`}
              disabled={disabled}
              checked={activeGoal === opt.value}
              onChange={() => setGoal(opt.value)}
            />
            <span className="label-content-builder__goal-label">{opt.label}</span>
            {opt.helper && <span className="label-content-builder__goal-helper">{opt.helper}</span>}
          </label>
        ))}
      </div>

      {kind === 'qrPayload' && (
        <button
          type="button"
          className="label-content-builder__advanced-toggle"
          disabled={disabled}
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
        >
          {advancedOpen ? 'Hide advanced QR options' : 'More QR options'}
        </button>
      )}

      {activeGoal === 'one_column' && kind === 'labelText' && (
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            multiSelect={false}
            items={fieldItems}
            label="Which field?"
            placeholder="Select column"
            selectedItems={textColumnField ? [textColumnField] : []}
            onSelect={(item) => {
              if (onTextColumnChange) onTextColumnChange(item);
              if (onRecompute) onRecompute();
            }}
          />
        </div>
      )}

      {activeGoal === 'one_field' && kind === 'qrPayload' && (
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            multiSelect={false}
            items={fieldItems}
            label="Which field?"
            placeholder="Select column"
            selectedItems={qrColumnField ? [qrColumnField] : []}
            onSelect={(item) => {
              if (onQrColumnFieldChange) onQrColumnFieldChange(item);
              if (onRecompute) onRecompute();
            }}
          />
        </div>
      )}

      {activeGoal === 'structured' && kind === 'qrPayload' && (
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            multiSelect={true}
            items={columnOptions}
            label="Columns for JSON"
            placeholder="Select columns"
            selectedItems={qrColumnFields}
            onSelect={(item) => {
              if (onQrColumnFieldsChange) onQrColumnFieldsChange(item);
              if (onRecompute) onRecompute();
            }}
          />
        </div>
      )}

      {showFilenameWarning && (
        <div className="__config-control-subsection-note-description">
          Output filename uses a system file ID — the QR encodes the UUID, not a readable name.
        </div>
      )}

      {activeGoal === 'custom_pattern' && (
        <div className="__config-control-subsection-row">
          <InputText
            disabled={disabled}
            label="Pattern"
            value={assemblyConfig?.template || ''}
            onChange={(v) => patch({ template: v })}
            placeholder={
              kind === 'qrPayload'
                ? 'e.g. https://example.org?id={uuid}'
                : 'e.g. {deidToken}_{field:BlockId}_{field:StainId}'
            }
          />
          <div className="__config-control-subsection-note-description">
            Placeholders: {'{uuid}'}, {'{deidToken}'}, {'{field:ColumnName}'}
          </div>
        </div>
      )}

      {activeGoal === 'combine_fields' && (
        <>
          <div className="__config-control-subsection-row">
            <InputText
              disabled={disabled}
              label="Separator"
              value={separator}
              onChange={(v) => patch({ separator: v })}
            />
          </div>
          <div className="__config-control-subsection-row">
            <span className="__config-control-subsection-row-label">Fields (order)</span>
            <div className="label-content-builder__field-list">
              {fieldItems.map((f) => (
                <label key={f.value} className="label-content-builder__field-item">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={fieldsOrder.includes(f.value)}
                    onChange={() => toggleField(f.value)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            {fieldsOrder.length > 0 && (
              <div className="__config-control-subsection-note-description">
                Order: {fieldsOrder.join(' → ')}
              </div>
            )}
          </div>
        </>
      )}

      {mode !== 'legacy' && preview !== '' && (
        <div className="__config-control-section-infobox">
          <div className="__infobox-title">Preview</div>
          <div className="__infobox-item">{preview}</div>
        </div>
      )}
    </div>
  );
}
