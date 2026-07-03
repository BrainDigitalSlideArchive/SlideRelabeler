import React, { useState } from 'react';

import InputText from '../controls/input/InputText';
import { makeEsmStainPreset } from '../../helpers/esm_profile_helpers';

function summarizePreset(preset) {
  const match = preset.matchValue?.trim() || '';
  const label = preset.label?.trim() || '';
  if (!match && !label) return '(empty)';
  if (!label || label === match) return match || label;
  if (!match) return `menu: ${label}`;
  return `${match} · menu: ${label}`;
}

/**
 * Stain filtering presets editor for an eSM profile (Configuration modal).
 */
export default function EsmStainPresetsEditor({
  disabled = false,
  profile,
  onProfileChange,
}) {
  const stainPresets = profile?.stainPresets || [];
  const [expandedPresetId, setExpandedPresetId] = useState(null);

  function updatePresets(nextPresets) {
    onProfileChange({ stainPresets: nextPresets });
  }

  function updatePreset(preset) {
    updatePresets(stainPresets.map((p) => (p && p.id === preset.id ? { ...p, ...preset } : p)));
  }

  function deletePreset(id) {
    const nextPresets = stainPresets.filter((p) => p && p.id !== id);
    const partial = { stainPresets: nextPresets };
    if (profile.defaultStainPresetId === id) {
      partial.defaultStainPresetId = null;
    }
    onProfileChange(partial);
    if (expandedPresetId === id) setExpandedPresetId(null);
  }

  function addPreset() {
    const preset = makeEsmStainPreset({ matchValue: '', label: '' });
    updatePresets([...stainPresets, preset]);
    setExpandedPresetId(preset.id);
  }

  function togglePresetExpanded(id) {
    setExpandedPresetId((prev) => (prev === id ? null : id));
  }

  function renderPresetEdit(preset) {
    return (
      <div
        id={`preset-edit-${preset.id}`}
        className="esm-stain-presets-editor__preset-edit"
      >
        <InputText
          disabled={disabled}
          label="Stain to match"
          variant="onLight"
          placeholder="H&E"
          value={preset.matchValue ?? ''}
          onChange={(v) => updatePreset({ ...preset, matchValue: v })}
        />
        <InputText
          disabled={disabled}
          label="Name in menu"
          variant="onLight"
          placeholder="H&E"
          value={preset.label ?? ''}
          onChange={(v) => updatePreset({ ...preset, label: v })}
        />
      </div>
    );
  }

  function renderPresetCard(preset) {
    const isExpanded = expandedPresetId === preset.id;
    const displayLabel = preset.label?.trim() || '(unnamed)';
    const summary = summarizePreset(preset);
    const cardClass = [
      'esm-light-panel__rule-card',
      isExpanded
        ? 'esm-transform-rules-editor__rule-card--expanded'
        : 'esm-transform-rules-editor__rule-card--collapsed',
    ].join(' ');

    return (
      <div key={preset.id} className={cardClass} role="listitem">
        <div className="esm-transform-rules-editor__rule-header">
          <button
            type="button"
            className={
              isExpanded
                ? 'esm-transform-rules-editor__rule-toggle esm-transform-rules-editor__rule-toggle--chevron-only'
                : 'esm-transform-rules-editor__rule-toggle'
            }
            aria-expanded={isExpanded}
            aria-controls={`preset-edit-${preset.id}`}
            aria-label={isExpanded ? `Collapse preset "${displayLabel}"` : `Expand preset "${displayLabel}"`}
            disabled={disabled}
            onClick={() => togglePresetExpanded(preset.id)}
          >
            <span className="esm-transform-rules-editor__rule-chevron" aria-hidden="true">
              {isExpanded ? '▾' : '▸'}
            </span>
            {!isExpanded && (
              <>
                <span className="esm-transform-rules-editor__rule-name">{displayLabel}</span>
                <span className="esm-transform-rules-editor__rule-summary">{summary}</span>
              </>
            )}
          </button>
          <div className="esm-transform-rules-editor__rule-actions">
            <button
              type="button"
              className="esm-transform-rules-editor__icon-btn esm-transform-rules-editor__icon-btn--remove"
              disabled={disabled}
              aria-label={`Delete preset "${displayLabel}"`}
              onClick={() => deletePreset(preset.id)}
            >
              ×
            </button>
          </div>
        </div>
        {isExpanded && renderPresetEdit(preset)}
      </div>
    );
  }

  return (
    <section className="esm-stain-presets-editor esm-stain-presets-editor--config">
      <div className="esm-profile-editor__list">
        <div className="esm-transform-rules-editor__rules-list" role="list">
          {stainPresets.map((preset) => renderPresetCard(preset))}
        </div>
        <button
          type="button"
          className="esm-profile-editor__btn esm-profile-editor__btn--add"
          disabled={disabled}
          onClick={addPreset}
        >
          Add stain shortcut
        </button>
      </div>

      {stainPresets.length > 0 && (
        <div className="esm-profile-editor__subsection">
          <h5 className="esm-profile-editor__subsection-title">Pre-fill stain on new search rows</h5>
          <p className="esm-profile-editor__hint">Applies when you add a new search row.</p>
          <select
            id="esm-default-stain-preset"
            className="esm-profile-editor__select"
            disabled={disabled}
            value={profile.defaultStainPresetId ?? ''}
            onChange={(e) => onProfileChange({
              defaultStainPresetId: e.target.value || null,
            })}
          >
            <option value="">All stains</option>
            {stainPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label?.trim() || p.matchValue || '(unnamed)'}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
