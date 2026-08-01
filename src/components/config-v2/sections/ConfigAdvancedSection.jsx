import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../actions/config';
import * as app_actions from '../../../actions/app';
import * as modal_actions from '../../../actions/modal';
import * as debug_actions from '../../../actions/debug';
import Button from '../../controls/button/Button';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigSettingHeader from '../primitives/ConfigSettingHeader';
import ConfigBooleanRow from '../primitives/ConfigBooleanRow';
import ConfigChoiceChips from '../primitives/ConfigChoiceChips';
import {
  DISCLAIMER_PROMPT_ALLOW_REMEMBER,
  DISCLAIMER_PROMPT_EVERY_LAUNCH,
  DISCLAIMER_TEXT_VERSION,
  needsDisclaimerPrompt,
} from '../../../helpers/disclaimer.js';

const RESTORE_CONFIRM =
  'Restore default settings and clear the file list? The app will stay open. Your saved configuration profiles are kept.';
const HARD_RESET_CONFIRM_EMPTY =
  'Clear all saved app data and close SlideRelabeler? You will need to open the app again.';
const CLEAR_DIAGNOSTICS_CONFIRM =
  'Clear the diagnostic log? This cannot be undone.';

const DISCLAIMER_MODE_OPTIONS = [
  { value: DISCLAIMER_PROMPT_EVERY_LAUNCH, label: 'Every launch' },
  { value: DISCLAIMER_PROMPT_ALLOW_REMEMBER, label: 'Allow remember' },
];

/**
 * Advanced — Phase 2g.
 * Recipe: Section → Panel → SettingHeader + BooleanRow ×3 → SettingHeader + dual reset.
 */
export default function ConfigAdvancedSection() {
  const dispatch = useDispatch();
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);
  const disabled = processing || disableChanges;
  const profileCount = useSelector(
    (state) => state.configProfiles?.profiles?.length ?? 0,
  );

  const saveMacro = useSelector((state) => !!state.config.wsi?.save_macro_image);
  const copyUnchanged = useSelector((state) => !!state.config.copy?.enable_copy_mode);
  const showDebug = useSelector((state) => !!state.config.debug?.enable_debug);
  const disclaimer = useSelector((state) => state.config.disclaimer);
  const promptMode = disclaimer?.promptMode === DISCLAIMER_PROMPT_ALLOW_REMEMBER
    ? DISCLAIMER_PROMPT_ALLOW_REMEMBER
    : DISCLAIMER_PROMPT_EVERY_LAUNCH;
  const hasRemembered =
    promptMode === DISCLAIMER_PROMPT_ALLOW_REMEMBER
    && disclaimer?.acceptedVersion === DISCLAIMER_TEXT_VERSION;

  const restoreDefaults = () => {
    if (!window.confirm(RESTORE_CONFIRM)) return;
    dispatch({ type: app_actions.RESTORE_DEFAULTS });
  };

  const hardReset = () => {
    const message =
      profileCount > 0
        ? `Clear all saved app data and close SlideRelabeler?\n\n` +
          `This also permanently deletes your saved configuration profiles (${profileCount} profile${
            profileCount === 1 ? '' : 's'
          }).\n\n` +
          `To keep them, click Cancel, open Configuration → Profiles, check the profiles to keep, ` +
          `and use Export…, then return here.\n\n` +
          `Continue without exporting?`
        : HARD_RESET_CONFIRM_EMPTY;
    if (!window.confirm(message)) return;
    dispatch({ type: app_actions.DELETE_STORE });
  };

  function setPromptMode(mode) {
    dispatch({ type: config_actions.SET_DISCLAIMER_PROMPT_MODE, payload: mode });
    if (mode === DISCLAIMER_PROMPT_EVERY_LAUNCH || needsDisclaimerPrompt({
      promptMode: mode,
      acceptedVersion: mode === DISCLAIMER_PROMPT_EVERY_LAUNCH
        ? null
        : disclaimer?.acceptedVersion,
    })) {
      dispatch({
        type: modal_actions.PUSH_MODAL_IF_ABSENT,
        payload: { type: 'disclaimer' },
      });
    }
  }

  function clearRemembered() {
    dispatch({ type: config_actions.CLEAR_DISCLAIMER_ACCEPTED });
    dispatch({
      type: modal_actions.PUSH_MODAL_IF_ABSENT,
      payload: { type: 'disclaimer' },
    });
  }

  function openDiagnosticsLog() {
    dispatch({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'debug' } });
  }

  function clearDiagnosticsLog() {
    if (!window.confirm(CLEAR_DIAGNOSTICS_CONFIRM)) return;
    dispatch({ type: debug_actions.CLEAR_DIAGNOSTICS_LOG });
  }

  return (
    <ConfigSection
      id="config-advanced"
      title="Advanced"
      description="Less common options for output files, troubleshooting, and resetting the app."
    >
      <ConfigSectionPanel>
        <ConfigSettingHeader
          title="Macro image (overview)"
          description="By default the macro image (overview photo) inside the slide file is removed because it can show patient details. Turn this on only if that image is safe to keep in saved files."
        />
        <ConfigBooleanRow
          label="Keep the macro image (overview)"
          checked={saveMacro}
          disabled={disabled}
          onClick={() => dispatch({ type: config_actions.TOGGLE_SAVE_MACRO })}
        />

        <ConfigSettingHeader
          title="Unchanged file copy"
          description="Puts an unchanged copy of each source file in the output folder instead of rewriting the file. Use only when you need the original file contents preserved."
        />
        <ConfigBooleanRow
          label="Copy files without changing them"
          checked={copyUnchanged}
          disabled={disabled}
          onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_COPY_MODE })}
        />

        <ConfigSettingHeader
          title="Troubleshooting"
          description="When on, SlideRelabeler records diagnostic messages to a local log for support. Leave this off for normal use. Turning it off stops recording but keeps the log until you clear it."
        />
        <ConfigBooleanRow
          label="Record diagnostic log"
          checked={showDebug}
          disabled={disabled}
          onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_DEBUG })}
        />
        <div className="cfg-panel-actions" style={{ marginTop: '0.5rem' }}>
          <Button
            variant="onLight"
            text="View diagnostic log…"
            disabled={disabled}
            onClick={openDiagnosticsLog}
          />
          <Button
            variant="onLight"
            text="Clear log"
            disabled={disabled}
            onClick={clearDiagnosticsLog}
          />
        </div>

        <ConfigSettingHeader
          title="Startup disclaimer"
          description="By default the liability disclaimer appears every time the app starts. Choose “Allow remember” to show a Remember my answer checkbox so you can skip it on future launches until cleared."
        />
        <ConfigChoiceChips
          name="disclaimer-prompt-mode"
          value={promptMode}
          disabled={disabled}
          options={DISCLAIMER_MODE_OPTIONS}
          onChange={setPromptMode}
          ariaLabel="Startup disclaimer mode"
        />
        {hasRemembered ? (
          <div className="cfg-panel-actions" style={{ marginTop: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem' }}>
              Agreement is remembered for this computer.
            </p>
            <Button
              variant="onLight"
              text="Clear remembered agreement"
              disabled={disabled}
              onClick={clearRemembered}
            />
          </div>
        ) : null}

        <ConfigSettingHeader
          title="Reset"
          description="Restore defaults resets settings and keeps your profiles. Clear all saved data deletes profiles and closes the app — export profiles first if you need them."
        />
        <div className="cfg-panel-actions">
          <Button
            variant="onLight"
            text="Restore defaults"
            disabled={disabled}
            onClick={restoreDefaults}
          />
          <Button
            variant="onLight"
            text="Clear all saved data"
            disabled={disabled}
            onClick={hardReset}
          />
        </div>
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
