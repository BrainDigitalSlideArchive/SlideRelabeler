import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_profiles_actions from '../../../actions/configProfiles';
import Button from '../../controls/button/Button';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigSettingHeader from '../primitives/ConfigSettingHeader';
import ConfigCallout from '../primitives/ConfigCallout';
import ConfigTextButton from '../primitives/ConfigTextButton';
import ConfigField from '../primitives/ConfigField';
import {
  buildConfigProfilePayload,
  fingerprintPayload,
  isProfileDirty,
} from '../../../helpers/config_profile_snapshot.js';
import { validateProfileName } from '../../../helpers/config_profile_naming.js';

import './ConfigProfilesSection.scss';

/**
 * Configuration profiles — named checkpoints + portable export/import.
 * Uses an inline name field (Electron does not support window.prompt).
 */
export default function ConfigProfilesSection() {
  const dispatch = useDispatch();
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);
  const disabled = processing || disableChanges;

  const profiles = useSelector((state) => state.configProfiles.profiles);
  const activeProfileId = useSelector((state) => state.configProfiles.activeProfileId);
  const activeFingerprint = useSelector((state) => state.configProfiles.activeFingerprint);

  const config = useSelector((state) => state.config);
  const uploadRouting = useSelector((state) => state.uploadRouting);
  const esm = useSelector((state) => state.esm);
  const dsa = useSelector((state) => state.dsa);
  const globus = useSelector((state) => state.globus);
  const apiIntegrations = useSelector((state) => state.apiIntegrations);
  const auditLogSettings = useSelector((state) => state.auditLog.settings);

  const profileStore = useMemo(
    () => ({
      config,
      uploadRouting,
      esm,
      dsa,
      globus,
      apiIntegrations,
      auditLog: auditLogSettings ? { settings: auditLogSettings } : undefined,
    }),
    [config, uploadRouting, esm, dsa, globus, apiIntegrations, auditLogSettings],
  );

  const [selectedIds, setSelectedIds] = useState([]);
  /** @type {[{ mode: 'saveAs'|'rename'|'exportCurrent', profileId?: string, title: string }|null, function]} */
  const [nameEditor, setNameEditor] = useState(null);
  const [nameValue, setNameValue] = useState('New profile');
  const [nameError, setNameError] = useState('');

  const dirty = useMemo(
    () => isProfileDirty(profileStore, activeProfileId, activeFingerprint),
    [profileStore, activeProfileId, activeFingerprint],
  );

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const activeLabel = !activeProfile
    ? 'Not using a saved profile'
    : dirty
      ? `Modified from “${activeProfile.name}”`
      : `Active: “${activeProfile.name}”`;

  const selectionForActions = selectedIds.filter((id) =>
    profiles.some((p) => p.id === id),
  );
  const singleSelected =
    selectionForActions.length === 1
      ? profiles.find((p) => p.id === selectionForActions[0])
      : null;

  function toggleSelected(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openNameEditor(editor, initial) {
    setNameEditor(editor);
    setNameValue(initial);
    setNameError('');
  }

  function cancelNameEditor() {
    setNameEditor(null);
    setNameError('');
  }

  function submitNameEditor() {
    if (!nameEditor) return;
    const check = validateProfileName(nameValue);
    if (!check.ok) {
      setNameError(check.error);
      return;
    }

    if (nameEditor.mode === 'saveAs') {
      dispatch({
        type: config_profiles_actions.SAVE_CONFIG_PROFILE_AS,
        payload: { name: check.name },
      });
    } else if (nameEditor.mode === 'rename') {
      dispatch({
        type: config_profiles_actions.RENAME_CONFIG_PROFILE,
        payload: { id: nameEditor.profileId, name: check.name },
      });
    } else if (nameEditor.mode === 'exportCurrent') {
      dispatch({
        type: config_profiles_actions.EXPORT_CURRENT_CONFIG_PROFILE,
        payload: { name: check.name },
      });
    }
    setNameEditor(null);
    setNameError('');
  }

  function onExportCurrent() {
    const liveFp = fingerprintPayload(buildConfigProfilePayload(profileStore));
    const cleanActive =
      activeProfile && activeFingerprint && liveFp === activeFingerprint;
    if (cleanActive) {
      dispatch({ type: config_profiles_actions.EXPORT_CURRENT_CONFIG_PROFILE });
      return;
    }
    openNameEditor(
      { mode: 'exportCurrent', title: 'Name for the exported profile' },
      'New profile',
    );
  }

  return (
    <ConfigSection
      id="config-profiles"
      title="Configuration profiles"
      description="Save and switch between named sets of settings, or share them as a file with another computer."
    >
      <ConfigCallout variant="tinted" role="note">
        <p>
          Your Configuration changes apply as you make them. A profile is a named copy you can
          return to later. Exported files leave out passwords and sign-in details; folder paths
          may need updating on another machine. Clear all saved data (Advanced) also deletes
          saved profiles — export first if you want to keep them.
        </p>
      </ConfigCallout>

      <ConfigSectionPanel>
        <p className="cfg-profiles__active" aria-live="polite">
          {activeLabel}
        </p>

        <ConfigSettingHeader
          title="Saved profiles"
          description="Named sets of settings on this computer. Select one to switch, or several to export or delete."
        />

        {profiles.length === 0 ? (
          <p className="cfg-profiles__empty">No profiles yet. Choose Save as… to create one.</p>
        ) : (
          <ul className="cfg-profiles__list">
            {profiles.map((p) => (
              <li key={p.id} className="cfg-profiles__row">
                <label className="cfg-profiles__row-label">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    disabled={disabled}
                    onChange={() => toggleSelected(p.id)}
                  />
                  <span className="cfg-profiles__name">
                    {p.name}
                    {p.id === activeProfileId ? (
                      <span className="cfg-profiles__badge">
                        {dirty ? 'modified' : 'active'}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {nameEditor ? (
          <div className="cfg-profiles__name-editor">
            <ConfigField
              size="md"
              label={nameEditor.title}
              value={nameValue}
              onChange={(value) => {
                setNameValue(value);
                if (nameError) setNameError('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitNameEditor();
                }
              }}
              disabled={disabled}
              error={Boolean(nameError)}
            />
            {nameError ? <p className="cfg-profiles__name-error">{nameError}</p> : null}
            <div className="cfg-profiles__name-editor-actions">
              <Button text="Cancel" disabled={disabled} onClick={cancelNameEditor} />
              <Button text="OK" disabled={disabled} onClick={submitNameEditor} />
            </div>
          </div>
        ) : null}

        <div className="cfg-panel-actions cfg-profiles__actions">
          <Button
            text="Switch…"
            disabled={disabled || !singleSelected || Boolean(nameEditor)}
            onClick={() => {
              if (!singleSelected) return;
              dispatch({
                type: config_profiles_actions.SWITCH_CONFIG_PROFILE,
                payload: { id: singleSelected.id },
              });
            }}
          />
          <Button
            text="Save as…"
            disabled={disabled || Boolean(nameEditor)}
            onClick={() => {
              openNameEditor(
                { mode: 'saveAs', title: 'Name for the new profile' },
                'New profile',
              );
            }}
          />
          <Button
            text="Save"
            disabled={disabled || !activeProfileId || !dirty || Boolean(nameEditor)}
            onClick={() => {
              dispatch({ type: config_profiles_actions.SAVE_ACTIVE_CONFIG_PROFILE });
            }}
          />
          <Button
            text="Rename…"
            disabled={disabled || !singleSelected || Boolean(nameEditor)}
            onClick={() => {
              if (!singleSelected) return;
              openNameEditor(
                {
                  mode: 'rename',
                  profileId: singleSelected.id,
                  title: 'Rename profile',
                },
                singleSelected.name,
              );
            }}
          />
          <Button
            text="Delete…"
            disabled={disabled || selectionForActions.length === 0 || Boolean(nameEditor)}
            onClick={() => {
              dispatch({
                type: config_profiles_actions.DELETE_CONFIG_PROFILE,
                payload: { ids: selectionForActions },
              });
              setSelectedIds([]);
            }}
          />
        </div>

        <ConfigSettingHeader
          title="Share"
          description="Copy settings to a file, or bring settings in from a file."
        />
        <div className="cfg-profiles__share">
          <ConfigTextButton
            disabled={disabled || Boolean(nameEditor)}
            onClick={onExportCurrent}
          >
            Export current…
          </ConfigTextButton>
          <ConfigTextButton
            disabled={disabled || profiles.length === 0 || Boolean(nameEditor)}
            onClick={() => {
              dispatch({
                type: config_profiles_actions.EXPORT_SELECTED_CONFIG_PROFILES,
                payload: { ids: selectionForActions },
              });
            }}
          >
            Export selected…
          </ConfigTextButton>
          <ConfigTextButton
            disabled={disabled || Boolean(nameEditor)}
            onClick={() => {
              dispatch({ type: config_profiles_actions.IMPORT_CONFIG_PROFILES });
            }}
          >
            Import…
          </ConfigTextButton>
        </div>
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
