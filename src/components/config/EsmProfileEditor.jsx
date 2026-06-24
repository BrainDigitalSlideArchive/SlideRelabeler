import React from 'react';
import { useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import InputText from '../controls/input/InputText';
import EsmProfileColumnMappings from './EsmProfileColumnMappings';
import EsmStainPresetsEditor from './EsmStainPresetsEditor';
import ESMTransformRulesEditor from '../esm/ESMTransformRulesEditor';
import {
  DUPLICATE_STRATEGIES,
  esmProfileImportMappingSummary,
} from '../../helpers/esm_profile_helpers';

export default function EsmProfileEditor({ profile, disabled = false, variant = 'standalone' }) {
  const dispatch = useDispatch();
  const embedded = variant === 'embedded';

  if (!profile) return null;

  function updateProfile(partial) {
    dispatch({
      type: esm_actions.ESM_UPDATE_PROFILE,
      payload: { ...profile, ...partial },
    });
  }

  const ruleCount = (profile.transformRules || []).filter((r) => r && r.enabled !== false).length;
  const presetCount = (profile.stainPresets || []).length;
  const importSummary = esmProfileImportMappingSummary(profile);

  return (
    <div className={`esm-profile-editor${embedded ? ' esm-profile-editor--embedded' : ''}`}>
      <div className="esm-profile-editor__connection">
        {!embedded && (
          <InputText
            disabled={disabled}
            label="Profile name"
            variant="onLight"
            value={profile.name ?? ''}
            onChange={(v) => updateProfile({ name: v })}
          />
        )}
        <InputText
          disabled={disabled}
          label="Description"
          variant="onLight"
          value={profile.description ?? ''}
          onChange={(v) => updateProfile({ description: v })}
        />
        <InputText
          disabled={disabled}
          label="eSM server URL"
          variant="onLight"
          value={profile.url ?? ''}
          onChange={(v) => updateProfile({ url: v })}
        />
        <InputText
          disabled={disabled}
          label="Proxy URL (optional)"
          variant="onLight"
          value={profile.proxyUrl ?? ''}
          onChange={(v) => updateProfile({ proxyUrl: v })}
        />
      </div>

      <div className="esm-profile-editor__section">
        <div className="esm-profile-editor__section-header">
          <h4 className="esm-profile-editor__section-title">Field cleanup</h4>
          {ruleCount > 0 && (
            <span className="esm-profile-editor__chip">{ruleCount} cleanup rule{ruleCount === 1 ? '' : 's'}</span>
          )}
        </div>
        <div className="esm-profile-editor__section-body">
          <div className="esm-profile-editor__intro" role="note">
            Optional find/replace on block and stain text before matching and naming. Search filters,
            stain presets, and import name patterns all use the cleaned values.
          </div>
          <ESMTransformRulesEditor
            disabled={disabled}
            profile={profile}
            onProfileChange={updateProfile}
          />
        </div>
      </div>

      <div className="esm-profile-editor__section">
        <div className="esm-profile-editor__section-header">
          <h4 className="esm-profile-editor__section-title">Stain filtering presets</h4>
          {presetCount > 0 && (
            <span className="esm-profile-editor__chip">
              {presetCount} preset{presetCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="esm-profile-editor__section-body">
          <div className="esm-profile-editor__intro" role="note">
            Quick picks for the stain filtering dropdown when you search eSM. Matching uses stain text{' '}
            <strong>after</strong> the cleanup rules above are applied — enter the spelling those rules produce
            (or type a custom stain when searching).
          </div>
          <EsmStainPresetsEditor
            disabled={disabled}
            profile={profile}
            onProfileChange={updateProfile}
          />
        </div>
      </div>

      <div className="esm-profile-editor__section">
        <div className="esm-profile-editor__section-header">
          <h4 className="esm-profile-editor__section-title">Names when importing slides</h4>
          <span className="esm-profile-editor__chip esm-profile-editor__chip--summary">{importSummary}</span>
        </div>
        <div className="esm-profile-editor__section-body">
          <EsmProfileColumnMappings
            profile={profile}
            disabled={disabled}
            onChange={updateProfile}
          />
          <div className="esm-profile-editor__subsection esm-profile-editor__duplicate-names">
            <h5 className="esm-profile-editor__subsection-title">Duplicate output names</h5>
            <p className="esm-profile-editor__hint">
              If two slides would get the same file name, add -2, -3, … or skip the duplicate.
            </p>
            <select
              className="esm-profile-editor__select"
              disabled={disabled}
              value={profile.duplicateStrategy ?? 'suffix-index'}
              onChange={(e) => updateProfile({ duplicateStrategy: e.target.value })}
            >
              {DUPLICATE_STRATEGIES.map((s) => (
                <option key={s} value={s}>
                  {s === 'suffix-index' ? 'Add -2, -3, …' : 'Skip duplicates'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
