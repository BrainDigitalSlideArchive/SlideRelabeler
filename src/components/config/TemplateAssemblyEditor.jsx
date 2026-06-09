import React, { useMemo } from 'react';
import InputText from '../controls/input/InputText';
import { evaluateTemplate, assembleFromFields } from '../../helpers/template_engine';

const MODE_OPTIONS = [
  { value: 'legacy', label: 'Legacy (use controls below)' },
  { value: 'fields', label: 'Assemble from fields' },
  { value: 'template', label: 'Template string' },
];

const PSEUDO_FIELDS = [
  { label: 'De-ID token', value: 'deidToken' },
  { label: 'UUID', value: 'uuid' },
];

/**
 * Reusable editor for label text or QR payload assembly.
 */
export default function TemplateAssemblyEditor({
  title,
  description,
  assemblyConfig,
  onChange,
  onRecompute,
  columnOptions = [],
  disabled = false,
  exampleRow = null,
  exampleDeidToken = '',
}) {
  const mode = assemblyConfig?.mode || 'legacy';
  const fieldsOrder = Array.isArray(assemblyConfig?.fieldsOrder) ? assemblyConfig.fieldsOrder : [];
  const separator = assemblyConfig?.separator ?? '_';

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

  return (
    <div className="__config-control-subsection">
      <div className="__config-control-subsection-title">{title}</div>
      {description && (
        <div className="__config-control-subsection-description">{description}</div>
      )}
      <div className="__config-control-subsection-row">
        <label className="__config-control-subsection-row-label" htmlFor={`${title}-mode`}>
          Assembly mode
        </label>
        <select
          id={`${title}-mode`}
          className="__input-text"
          disabled={disabled}
          value={mode}
          onChange={(e) => patch({ mode: e.target.value })}
        >
          {MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {mode === 'template' && (
        <div className="__config-control-subsection-row">
          <InputText
            disabled={disabled}
            label="Template"
            value={assemblyConfig?.template || ''}
            onChange={(v) => patch({ template: v })}
            placeholder="e.g. {deidToken}_{field:BlockId} or {uuid}"
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {fieldItems.map((f) => (
                <label key={f.value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
