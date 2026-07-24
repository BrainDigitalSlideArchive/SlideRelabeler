import React from 'react';

import InputText from '../controls/input/InputText';
import { PlaceholderChips } from './ComputedFieldEditor';
import { ESM_PATTERN_PLACEHOLDERS } from '../../helpers/esm_profile_helpers';

const SLIDE_FIELDS_HELP = 'Click a chip to insert eSlideManager slide fields or search-row values into the pattern. De-identification text comes from the De-identification column in Search criteria. A random unique ID (UUID) is assigned when slides are added to the file list — the Results preview shows {uuid} literally until then.';

export default function EsmProfileColumnMappings({
  profile,
  disabled = false,
  onChange,
}) {
  if (!profile) return null;

  function patch(partial) {
    onChange({ ...profile, ...partial });
  }

  function patchOutputName(partial) {
    patch({
      outputNameMapping: { ...profile.outputNameMapping, ...partial },
    });
  }

  function patchLabelText(partial) {
    patch({
      labelTextMapping: { ...profile.labelTextMapping, ...partial },
    });
  }

  function addExtraMapping() {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    patch({
      extraColumnMappings: [
        ...(profile.extraColumnMappings || []),
        { id, enabled: true, targetColumn: '', pattern: '' },
      ],
    });
  }

  function updateExtraMapping(id, partial) {
    patch({
      extraColumnMappings: (profile.extraColumnMappings || []).map((m) =>
        m.id === id ? { ...m, ...partial } : m
      ),
    });
  }

  function removeExtraMapping(id) {
    patch({
      extraColumnMappings: (profile.extraColumnMappings || []).filter((m) => m.id !== id),
    });
  }

  return (
    <div className="esm-profile-column-mappings">
      <p className="esm-profile-column-mappings__lead">
        Choose how each slide&apos;s Output name and Label text are filled when you add it from eSlideManager.
        Leave off to use the app-wide settings in Configuration.
      </p>

      <div className="esm-profile-column-mappings__shortcut">
        <label className="esm-profile-column-mappings__toggle">
          <input
            type="checkbox"
            disabled={disabled}
            checked={profile.outputNameMapping?.enabled === true}
            onChange={(e) => patchOutputName({ enabled: e.target.checked })}
          />
          <span>Output file name</span>
        </label>
        {profile.outputNameMapping?.enabled && (
          <div className="esm-profile-column-mappings__pattern">
            <InputText
              disabled={disabled}
              omitLabel
              variant="onLight"
              ariaLabel="Output file name pattern"
              placeholder="{deid}_{blockId}_{stainId}"
              value={profile.outputNameMapping?.pattern ?? ''}
              onChange={(v) => patchOutputName({ pattern: v })}
            />
            <PlaceholderChips
              catalog={ESM_PATTERN_PLACEHOLDERS}
              catalogLabel="Slide fields"
              helpText={SLIDE_FIELDS_HELP}
              disabled={disabled}
              onInsert={(token) => patchOutputName({
                pattern: `${profile.outputNameMapping?.pattern ?? ''}${token}`,
              })}
            />
          </div>
        )}
      </div>

      <div className="esm-profile-column-mappings__shortcut">
        <label className="esm-profile-column-mappings__toggle">
          <input
            type="checkbox"
            disabled={disabled}
            checked={profile.labelTextMapping?.enabled === true}
            onChange={(e) => patchLabelText({ enabled: e.target.checked })}
          />
          <span>Label text</span>
        </label>
        {profile.labelTextMapping?.enabled && (
          <div className="esm-profile-column-mappings__pattern">
            <InputText
              disabled={disabled}
              omitLabel
              variant="onLight"
              ariaLabel="Label text pattern"
              placeholder="{blockId} {stainId}"
              value={profile.labelTextMapping?.pattern ?? ''}
              onChange={(v) => patchLabelText({ pattern: v })}
            />
            <PlaceholderChips
              catalog={ESM_PATTERN_PLACEHOLDERS}
              catalogLabel="Slide fields"
              helpText={SLIDE_FIELDS_HELP}
              disabled={disabled}
              onInsert={(token) => patchLabelText({
                pattern: `${profile.labelTextMapping?.pattern ?? ''}${token}`,
              })}
            />
          </div>
        )}
      </div>

      {(profile.extraColumnMappings || []).map((m) => (
        <div key={m.id} className="esm-profile-column-mappings__extra">
          <label className="esm-profile-column-mappings__toggle">
            <input
              type="checkbox"
              disabled={disabled}
              checked={m.enabled === true}
              onChange={(e) => updateExtraMapping(m.id, { enabled: e.target.checked })}
            />
            <span>Custom column</span>
          </label>
          <InputText
            disabled={disabled}
            label="Column name"
            variant="onLight"
            value={m.targetColumn ?? ''}
            onChange={(v) => updateExtraMapping(m.id, { targetColumn: v })}
          />
          {m.enabled && (
            <div className="esm-profile-column-mappings__pattern">
              <InputText
                disabled={disabled}
                omitLabel
                variant="onLight"
                ariaLabel="Column pattern"
                value={m.pattern ?? ''}
                onChange={(v) => updateExtraMapping(m.id, { pattern: v })}
              />
              <PlaceholderChips
                catalog={ESM_PATTERN_PLACEHOLDERS}
                catalogLabel="Slide fields"
                helpText={SLIDE_FIELDS_HELP}
                disabled={disabled}
                onInsert={(token) => updateExtraMapping(m.id, {
                  pattern: `${m.pattern ?? ''}${token}`,
                })}
              />
            </div>
          )}
          <button
            type="button"
            className="esm-profile-editor__btn esm-profile-editor__btn--ghost"
            disabled={disabled}
            onClick={() => removeExtraMapping(m.id)}
          >
            Remove
          </button>
        </div>
      ))}

      <div className="esm-profile-editor__list-actions">
        <button
          type="button"
          className="esm-profile-editor__btn esm-profile-editor__btn--add"
          disabled={disabled}
          onClick={addExtraMapping}
        >
          Add column mapping
        </button>
      </div>
    </div>
  );
}
