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
import { isProfileDirty } from '../../../helpers/config_profile_snapshot.js';
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
  /** @type {[{ mode: 'saveAs'|'rename', profileId?: string, title: string }|null, function]} */
  const [nameEditor, setNameEditor] = useState(null);
  const [nameValue, setNameValue] = useState('New profile');
  const [nameError, setNameError] = useState('');

  const dirty = useMemo(
    () => isProfileDirty(profileStore, activeProfileId, activeFingerprint),
    [profileStore, activeProfileId, activeFingerprint],
  );

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

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
    }
    setNameEditor(null);
    setNameError('');
  }

  return (
    <ConfigSection
      id="config-profiles"
      title="Configuration profiles"
      description="Checkpoints of your settings on this computer."
    >
      <ConfigCallout variant="tinted" role="note">
        <div className="cfg-profiles__callout-title">What profiles are for</div>
        <p>
          As you change settings, those changes take effect right away. A profile is a named
          snapshot of your settings that you can switch back to later, or share as a file with
          another computer.
        </p>
        <ul className="cfg-profiles__callout-list">
          <li>
            Use <strong>Save as…</strong> when you want to keep a checkpoint of the current setup.
          </li>
          <li>
            Exported profile files do not include passwords or sign-in details. Folder paths often
            need to be set again on another machine.
          </li>
          <li>
            <strong>Clear all saved data</strong> (under Advanced) deletes saved profiles as well.
            Export any profiles you care about before using that action.
          </li>
        </ul>
      </ConfigCallout>

      <ConfigSectionPanel>
        <ConfigSettingHeader
          title="Saved profiles"
          description={(
            <>
              Check a profile, then use the buttons below. Check several to export or delete
              together. To add profiles from a file,{' '}
              <ConfigTextButton
                disabled={disabled || Boolean(nameEditor)}
                onClick={() => {
                  dispatch({ type: config_profiles_actions.IMPORT_CONFIG_PROFILES });
                }}
              >
                Import…
              </ConfigTextButton>
              .
            </>
          )}
        />

        <div className="cfg-profiles__list-box">
          {profiles.length === 0 ? (
            <p className="cfg-profiles__empty">No profiles yet. Choose Save as… to create one.</p>
          ) : (
            <ul className="cfg-profiles__list">
              {profiles.map((p) => {
                const isActive = p.id === activeProfileId;
                const isChecked = selectedIds.includes(p.id);
                const rowClasses = [
                  'cfg-profiles__row',
                  isActive && !dirty ? 'cfg-profiles__row--active' : '',
                  isActive && dirty ? 'cfg-profiles__row--modified' : '',
                  isChecked ? 'cfg-profiles__row--checked' : '',
                ].filter(Boolean).join(' ');

                return (
                  <li key={p.id} className={rowClasses}>
                    <label className="cfg-profiles__row-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disabled}
                        onChange={() => toggleSelected(p.id)}
                      />
                      <span className="cfg-profiles__name">{p.name}</span>
                      {isActive ? (
                        <span
                          className={[
                            'cfg-profiles__status',
                            dirty
                              ? 'cfg-profiles__status--modified'
                              : 'cfg-profiles__status--active',
                          ].join(' ')}
                          aria-live="polite"
                        >
                          {dirty ? 'Modified' : 'Active'}
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

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
            text="Activate…"
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
            tooltip={
              !activeProfile
                ? 'No active profile to save. Use Save as… to create one.'
                : dirty
                  ? `Save changes to the active “${activeProfile.name}” profile`
                  : 'There are no changes to save'
            }
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
            text="Export…"
            disabled={disabled || selectionForActions.length === 0 || Boolean(nameEditor)}
            onClick={() => {
              dispatch({
                type: config_profiles_actions.EXPORT_SELECTED_CONFIG_PROFILES,
                payload: { ids: selectionForActions },
              });
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
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
