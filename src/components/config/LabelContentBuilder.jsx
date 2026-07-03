import React, { useMemo, useState } from 'react';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';
import { evaluateTemplate, assembleFromFields } from '../../helpers/template_engine';
import { assemblyModeToGoal, goalToAssemblyMode } from '../../helpers/label_config_helpers';

const PSEUDO_FIELDS = [
  { label: 'Specimen ID', value: 'specimenId' },
  { label: 'UUID', value: 'uuid' },
];

const LABEL_GOAL_OPTIONS = [
  { label: 'Show one metadata field', value: 'one_column', helper: 'Pick a single column (e.g. stain, block, or assembled name).' },
  { label: 'Combine several fields', value: 'combine_fields', helper: 'Join fields with a separator (e.g. CASE42_B12_HE).' },
  { label: 'Write a custom pattern', value: 'custom_pattern', helper: 'For advanced layouts with placeholders.' },
];

const LABEL_COMPACT_PILLS = [
  { label: 'One field', value: 'one_column', title: 'Show one metadata column on the label.' },
  { label: 'Combine', value: 'combine_fields', title: 'Join several fields with a separator.' },
  { label: 'Pattern', value: 'custom_pattern', title: 'Custom pattern with placeholders.' },
];

const LABEL_ASSEMBLED_PILL = {
  label: 'Assembled name',
  value: 'assembled_name',
  title: 'Use the assembled name column from the file table.',
};

const QR_GOAL_OPTIONS = [
  { label: 'Link to this file (system file ID)', value: 'link_file', helper: 'Encodes the UUID assigned to the file.' },
  { label: 'One metadata field', value: 'one_field', helper: 'Encode a single column value.' },
  { label: 'Combine fields', value: 'combine_fields', helper: 'Join selected fields with a separator.' },
  { label: 'Custom pattern', value: 'custom_pattern', helper: 'Full control over encoded string.' },
];

const QR_COMPACT_PILLS = [
  { label: 'File UUID', value: 'link_file', title: 'Encode the system file UUID.' },
  { label: 'One field', value: 'one_field', title: 'Encode one metadata column.' },
  { label: 'Combine', value: 'combine_fields', title: 'Join fields with a separator.' },
  { label: 'Pattern', value: 'custom_pattern', title: 'Custom encoded string.' },
];

const QR_GOAL_ADVANCED = [
  { label: 'Structured data (JSON)', value: 'structured', helper: 'Encodes selected columns as JSON (advanced).' },
];

function mapFieldsToAssembly(fieldsOrder) {
  return fieldsOrder.map((f) => (f === 'deidToken' ? 'specimenId' : f));
}

function PillGroup({ options, active, disabled, name, onSelect }) {
  return (
    <div className="label-content-builder__pills" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          name={name}
          title={opt.title || opt.helper}
          disabled={disabled}
          aria-checked={active === opt.value}
          className={`label-content-builder__pill${active === opt.value ? ' label-content-builder__pill--active' : ''}`}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function LabelContentBuilder({
  kind,
  assemblyConfig,
  onChange,
  onRecompute,
  columnOptions = [],
  disabled = false,
  exampleRow = null,
  exampleSpecimenId = '',
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
  compact = false,
  showAssembledNamePill = false,
  onUseAssembledName,
  onLeaveAssembledName,
  routingConfig,
  globalAssemblyConfig,
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

  function patch(partial) {
    onChange({ ...assemblyConfig, ...partial });
    if (onRecompute) onRecompute();
  }

  function setGoal(nextGoal) {
    if (nextGoal === 'assembled_name') {
      if (onUseAssembledName) onUseAssembledName();
      return;
    }
    if (
      kind === 'labelText' &&
      textAssembledActive &&
      nextGoal !== 'assembled_name' &&
      onLeaveAssembledName
    ) {
      onLeaveAssembledName();
    }
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

  const qrGoalValue = (() => {
    if (mode !== 'legacy') return goal;
    const qm = qrMode?.value ?? 'user_defined';
    if (qm === 'uuid') return 'link_file';
    if (qm === 'column_field') return 'one_field';
    if (qm === 'column_fields') return 'structured';
    return 'link_file';
  })();

  const colName = globalAssemblyConfig?.columnName || 'AssembledName';
  const textAssembledActive =
    routingConfig?.labelText?.enabled &&
    (routingConfig?.labelText?.column || colName) === colName &&
    mode === 'legacy';

  let activeGoal = kind === 'qrPayload' && mode === 'legacy' ? qrGoalValue : goal;
  if (kind === 'labelText' && textAssembledActive) {
    activeGoal = 'assembled_name';
  }

  const showFilenameWarning =
    kind === 'qrPayload' &&
    activeGoal === 'link_file' &&
    filenameUsesUuid;

  const rootClass = compact
    ? 'label-content-builder label-content-builder--compact'
    : '__config-control-subsection label-content-builder';

  const textPills =
    kind === 'labelText' && (showAssembledNamePill || textAssembledActive)
      ? [...LABEL_COMPACT_PILLS.slice(0, 1), LABEL_ASSEMBLED_PILL, ...LABEL_COMPACT_PILLS.slice(1)]
      : LABEL_COMPACT_PILLS;

  return (
    <div className={rootClass}>
      {compact ? (
        <>
          <PillGroup
            name={`${kind}-goal`}
            options={kind === 'labelText' ? textPills : QR_COMPACT_PILLS}
            active={activeGoal}
            disabled={disabled}
            onSelect={setGoal}
          />
          {kind === 'qrPayload' && (
            <button
              type="button"
              className="label-content-builder__advanced-toggle"
              disabled={disabled}
              onClick={() => setAdvancedOpen(!advancedOpen)}
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? 'Hide JSON option' : 'More QR options'}
            </button>
          )}
          {kind === 'qrPayload' && advancedOpen && (
            <PillGroup
              name={`${kind}-goal-adv`}
              options={[{ label: 'JSON fields', value: 'structured', title: QR_GOAL_ADVANCED[0].helper }]}
              active={activeGoal}
              disabled={disabled}
              onSelect={setGoal}
            />
          )}
        </>
      ) : (
        <>
          <div className="label-content-builder__goals" role="radiogroup" aria-label={kind === 'labelText' ? 'Label text goal' : 'QR goal'}>
            {(kind === 'labelText' ? LABEL_GOAL_OPTIONS : [...QR_GOAL_OPTIONS, ...(advancedOpen ? QR_GOAL_ADVANCED : [])]).map((opt) => (
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
        </>
      )}

      {activeGoal === 'assembled_name' && kind === 'labelText' && (
        <div className="label-content-builder__assembled-note">
          Uses the <strong>Assembled name</strong> column from your file table.
        </div>
      )}

      {activeGoal === 'one_column' && kind === 'labelText' && (
        <div className={compact ? 'label-content-builder__field-row' : '__config-control-subsection-row'}>
          {!compact && (
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
          )}
          {compact && (
            <>
              <span className="label-content-builder__field-label">Field</span>
              <Dropdown
                disabled={disabled}
                omitLabel
                ariaLabel="Which field"
                multiSelect={false}
                items={fieldItems}
                placeholder="Select column"
                selectedItems={textColumnField ? [textColumnField] : []}
                onSelect={(item) => {
                  if (onTextColumnChange) onTextColumnChange(item);
                  if (onRecompute) onRecompute();
                }}
              />
            </>
          )}
        </div>
      )}

      {activeGoal === 'one_field' && kind === 'qrPayload' && (
        <div className={compact ? 'label-content-builder__field-row' : '__config-control-subsection-row'}>
          {compact ? (
            <>
              <span className="label-content-builder__field-label">Field</span>
              <Dropdown
                disabled={disabled}
                omitLabel
                ariaLabel="Which field"
                multiSelect={false}
                items={fieldItems}
                placeholder="Select column"
                selectedItems={qrColumnField ? [qrColumnField] : []}
                onSelect={(item) => {
                  if (onQrColumnFieldChange) onQrColumnFieldChange(item);
                  if (onRecompute) onRecompute();
                }}
              />
            </>
          ) : (
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
          )}
        </div>
      )}

      {activeGoal === 'structured' && kind === 'qrPayload' && (
        <div className={compact ? 'label-content-builder__field-row' : '__config-control-subsection-row'}>
          <Dropdown
            disabled={disabled}
            omitLabel={compact}
            label={compact ? undefined : 'Columns for JSON'}
            ariaLabel="Columns for JSON"
            multiSelect={true}
            items={columnOptions}
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
        <div className={compact ? 'label-content-builder__field-row' : '__config-control-subsection-row'}>
          <InputText
            disabled={disabled}
            omitLabel={compact}
            ariaLabel="Pattern"
            label={compact ? undefined : 'Pattern'}
            value={assemblyConfig?.template || ''}
            onChange={(v) => patch({ template: v })}
            placeholder={
              kind === 'qrPayload'
                ? 'e.g. https://example.org?id={uuid}'
                : 'e.g. {specimenId}_{field:BlockId}_{field:StainId}'
            }
          />
          {!compact && (
            <div className="__config-control-subsection-note-description">
              Placeholders: {'{uuid}'}, {'{specimenId}'}, {'{field:ColumnName}'}
            </div>
          )}
        </div>
      )}

      {activeGoal === 'combine_fields' && (
        <>
          <div className={compact ? 'label-content-builder__field-row' : '__config-control-subsection-row'}>
            <InputText
              disabled={disabled}
              omitLabel={compact}
              ariaLabel="Separator"
              label={compact ? undefined : 'Separator'}
              value={separator}
              onChange={(v) => patch({ separator: v })}
            />
          </div>
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
        </>
      )}
    </div>
  );
}
