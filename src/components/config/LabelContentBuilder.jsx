import React, { useMemo, useState } from 'react';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';
import { evaluateTemplate, assembleFromFields } from '../../helpers/template_engine';

const MODE_OPTIONS = [
  { label: 'Single column', value: 'legacy' },
  { label: 'Build from fields', value: 'fields' },
  { label: 'Custom template', value: 'template' },
];

const PSEUDO_FIELDS = [
  { label: 'De-ID token', value: 'deidToken' },
  { label: 'UUID', value: 'uuid' },
];

const QR_MODE_OPTIONS = [
  { label: 'Encode output filename', value: 'user_defined', description: 'Use rename column featuring output filename' },
  { label: 'Encode UUID', value: 'uuid', description: 'Use uuid value generated for file regardless of output filename.' },
  { label: 'JSON from columns', value: 'column_fields', description: 'Use base64 encoded JSON from selected columns.' },
  { label: 'Single column value', value: 'column_field', description: 'Use text from a single column' },
];

/**
 * Unified builder for label text or QR payload.
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
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const mode = assemblyConfig?.mode || 'legacy';
  const fieldsOrder = Array.isArray(assemblyConfig?.fieldsOrder) ? assemblyConfig.fieldsOrder : [];
  const separator = assemblyConfig?.separator ?? (kind === 'qrPayload' ? '' : '_');

  const title = kind === 'labelText' ? 'Label text' : 'QR code';
  const description =
    kind === 'labelText'
      ? 'Choose what human-readable text appears on the label.'
      : 'Any text can be encoded — URL, UUID, identifier, or structured data.';

  const fieldItems = useMemo(() => {
    const fromCols = (columnOptions || [])
      .filter((c) => c?.value && !String(c.value).startsWith('__reserved.'))
      .map((c) => ({ label: c.label || c.value, value: c.value }));
    const reserved = (columnOptions || [])
      .filter((c) => c?.value === 'rename' || c?.value === '__reserved.rename')
      .map((c) => ({ label: 'Renamed as', value: 'rename' }));
    return [...PSEUDO_FIELDS, ...reserved, ...fromCols];
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

  function toggleField(value) {
    const exists = fieldsOrder.includes(value);
    const next = exists ? fieldsOrder.filter((x) => x !== value) : [...fieldsOrder, value];
    patch({ fieldsOrder: next });
  }

  const selectedMode = MODE_OPTIONS.filter((o) => o.value === mode);
  const showQrLegacy = kind === 'qrPayload' && mode === 'legacy';
  const qrModeValue = qrMode?.value ?? 'user_defined';
  const basicQrModes = ['uuid', 'column_field'];
  const visibleQrModes = advancedOpen
    ? QR_MODE_OPTIONS
    : QR_MODE_OPTIONS.filter(
      (o) => basicQrModes.includes(o.value) || o.value === qrModeValue,
    );
  const showQrColumnSingle = showQrLegacy && qrModeValue === 'column_field';
  const showQrColumnMulti = showQrLegacy && qrModeValue === 'column_fields';
  const showFilenameWarning =
    kind === 'qrPayload' &&
    mode === 'legacy' &&
    qrModeValue === 'user_defined' &&
    filenameUsesUuid;

  return (
    <div className="__config-control-subsection label-content-builder">
      <div className="__config-control-subsection-title">{title}</div>
      <div className="__config-control-subsection-description">{description}</div>

      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="Content source"
          placeholder="Select mode"
          items={MODE_OPTIONS}
          selectedItems={selectedMode}
          onSelect={(item) => patch({ mode: item.value })}
        />
      </div>

      {mode === 'legacy' && kind === 'labelText' && (
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            multiSelect={false}
            items={columnOptions}
            label="Column"
            placeholder="Select column"
            selectedItems={textColumnField ? [textColumnField] : []}
            onSelect={(item) => {
              if (onTextColumnChange) onTextColumnChange(item);
              if (onRecompute) onRecompute();
            }}
          />
        </div>
      )}

      {showQrLegacy && (
        <>
          <div className="__config-control-subsection-row">
            <Dropdown
              disabled={disabled}
              items={visibleQrModes}
              show_selected_descriptions={true}
              label="QR encoding"
              placeholder="QR mode"
              selectedItems={qrMode ? [qrMode] : []}
              onSelect={(item) => {
                if (onQrModeChange) onQrModeChange(item);
                if (onRecompute) onRecompute();
              }}
            />
          </div>
          {showFilenameWarning && (
            <div className="__config-control-subsection-note-description">
              Output filename mode is UUID — the QR will encode the UUID, not the human-readable rename.
            </div>
          )}
          {showQrColumnSingle && (
            <div className="__config-control-subsection-row">
              <Dropdown
                disabled={disabled}
                multiSelect={false}
                items={columnOptions}
                label="QR column"
                placeholder="Select column"
                selectedItems={qrColumnField ? [qrColumnField] : []}
                onSelect={(item) => {
                  if (onQrColumnFieldChange) onQrColumnFieldChange(item);
                  if (onRecompute) onRecompute();
                }}
              />
            </div>
          )}
          {showQrColumnMulti && (
            <div className="__config-control-subsection-row">
              <Dropdown
                disabled={disabled}
                multiSelect={true}
                items={columnOptions}
                label="QR columns"
                placeholder="Select columns"
                selectedItems={qrColumnFields}
                onSelect={(item) => {
                  if (onQrColumnFieldsChange) onQrColumnFieldsChange(item);
                  if (onRecompute) onRecompute();
                }}
              />
            </div>
          )}
          {kind === 'qrPayload' && (
            <div className="__config-control-subsection-row">
              <button
                type="button"
                className="label-content-builder__advanced-toggle"
                disabled={disabled}
                onClick={() => setAdvancedOpen(!advancedOpen)}
                aria-expanded={advancedOpen}
              >
                {advancedOpen ? 'Hide advanced QR options' : 'Advanced QR options'}
              </button>
            </div>
          )}
        </>
      )}

      {mode === 'template' && (
        <div className="__config-control-subsection-row">
          <InputText
            disabled={disabled}
            label="Template"
            value={assemblyConfig?.template || ''}
            onChange={(v) => patch({ template: v })}
            placeholder={
              kind === 'qrPayload'
                ? 'e.g. https://example.org?uuid={uuid}'
                : 'e.g. {deidToken}_{field:BlockId}'
            }
          />
          <div className="__config-control-subsection-note-description">
            Placeholders: {'{uuid}'}, {'{deidToken}'}, {'{field:ColumnName}'}
          </div>
        </div>
      )}

      {mode === 'fields' && (
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
