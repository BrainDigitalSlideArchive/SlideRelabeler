import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import { cloneEsmProfile, makeEsmProfile } from '../../helpers/esm_profile_helpers';
import EsmProfileCard from './EsmProfileCard';

export default function EsmDataLoadingSection({
  disabled = false,
  showLead = true,
  rootId = 'config-esm-api',
}) {
  const dispatch = useDispatch();
  const profiles = useSelector((s) => s.esm.profiles);
  const [expandedProfileId, setExpandedProfileId] = useState(null);

  function addProfile() {
    const profile = makeEsmProfile({ name: 'New profile', url: '' });
    dispatch({ type: esm_actions.ESM_ADD_PROFILE, payload: profile });
    setExpandedProfileId(profile.id);
  }

  function cloneProfile(source) {
    const clone = cloneEsmProfile(source);
    dispatch({ type: esm_actions.ESM_ADD_PROFILE, payload: clone });
    setExpandedProfileId(clone.id);
  }

  function deleteProfile(id) {
    if (profiles.length <= 1) return;
    if (!window.confirm('Delete this profile?')) return;
    dispatch({ type: esm_actions.ESM_DELETE_PROFILE, payload: id });
    if (expandedProfileId === id) {
      const remaining = profiles.filter((p) => p.id !== id);
      setExpandedProfileId(remaining[0]?.id ?? null);
    }
  }

  function toggleProfileExpanded(id) {
    setExpandedProfileId((prev) => (prev === id ? null : id));
  }

  return (
    <div
      className="esm-data-loading-section"
      id={rootId || undefined}
    >
      {showLead ? (
        <p className="esm-data-loading-section__lead">
          Saved eSlideManager connection profiles. Open <strong>eSlideManager</strong> from the toolbar
          to log in, pick a profile, and load slides—or <strong>clone</strong> a profile to save a search preset variant.
        </p>
      ) : null}

      <div className="esm-profiles-section">
        <div className="esm-profiles-section__header">
          <span className="esm-profiles-section__title">Profiles</span>
        </div>

        <div className="esm-profile-editor__list">
          <div className="esm-transform-rules-editor__rules-list" role="list">
            {profiles.map((p) => (
              <EsmProfileCard
                key={p.id}
                profile={p}
                disabled={disabled}
                expanded={expandedProfileId === p.id}
                onToggleExpand={() => toggleProfileExpanded(p.id)}
                onClone={() => cloneProfile(p)}
                onDelete={() => deleteProfile(p.id)}
                deleteDisabled={profiles.length <= 1}
              />
            ))}
          </div>
          <button
            type="button"
            className="esm-profile-editor__btn esm-profile-editor__btn--add"
            disabled={disabled}
            onClick={addProfile}
          >
            Add profile
          </button>
        </div>
      </div>
    </div>
  );
}
