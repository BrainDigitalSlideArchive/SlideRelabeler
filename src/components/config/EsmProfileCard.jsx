import React from 'react';
import { useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import InputText from '../controls/input/InputText';
import EsmProfileEditor from './EsmProfileEditor';

export default function EsmProfileCard({
  profile,
  disabled = false,
  expanded = false,
  onToggleExpand,
  onClone,
  onDelete,
  deleteDisabled = false,
}) {
  const dispatch = useDispatch();

  if (!profile) return null;

  const profileLabel = profile.name?.trim() || 'Unnamed';
  const description = profile.description?.trim() ?? '';

  const cardClass = [
    'esm-light-panel__rule-card',
    'esm-profiles-section__profile-card',
    expanded
      ? 'esm-transform-rules-editor__rule-card--expanded'
      : 'esm-transform-rules-editor__rule-card--collapsed',
  ].join(' ');

  function updateProfile(partial) {
    dispatch({
      type: esm_actions.ESM_UPDATE_PROFILE,
      payload: { ...profile, ...partial },
    });
  }

  return (
    <div className={cardClass} role="listitem">
      <div className="esm-transform-rules-editor__rule-header">
        <button
          type="button"
          className={
            expanded
              ? 'esm-transform-rules-editor__rule-toggle esm-transform-rules-editor__rule-toggle--chevron-only'
              : 'esm-transform-rules-editor__rule-toggle'
          }
          aria-expanded={expanded}
          aria-controls={`profile-edit-${profile.id}`}
          aria-label={expanded ? `Collapse profile "${profileLabel}"` : `Expand profile "${profileLabel}"`}
          disabled={disabled}
          onClick={onToggleExpand}
        >
          <span className="esm-transform-rules-editor__rule-chevron" aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
          {!expanded && (
            <>
              <span className="esm-transform-rules-editor__rule-name">{profileLabel}</span>
              {description && (
                <span
                  className="esm-transform-rules-editor__rule-summary"
                  title={description}
                >
                  {description}
                </span>
              )}
            </>
          )}
        </button>
        {expanded && (
          <InputText
            omitLabel
            ariaLabel="Profile name"
            placeholder="Profile name"
            value={profile.name || ''}
            variant="onLight"
            disabled={disabled}
            onChange={(v) => updateProfile({ name: v })}
          />
        )}
        <div className="esm-transform-rules-editor__rule-actions">
          <button
            type="button"
            className="esm-transform-rules-editor__icon-btn"
            disabled={disabled}
            aria-label={`Clone profile "${profileLabel}"`}
            title="Clone profile"
            onClick={onClone}
          >
            ⎘
          </button>
          <button
            type="button"
            className="esm-transform-rules-editor__icon-btn esm-transform-rules-editor__icon-btn--remove"
            disabled={disabled || deleteDisabled}
            aria-label={`Delete profile "${profileLabel}"`}
            title={deleteDisabled ? 'At least one profile is required' : 'Delete profile'}
            onClick={onDelete}
          >
            ×
          </button>
        </div>
      </div>
      {expanded && (
        <div id={`profile-edit-${profile.id}`} className="esm-profiles-section__profile-body">
          <EsmProfileEditor profile={profile} disabled={disabled} variant="embedded" />
        </div>
      )}
    </div>
  );
}
