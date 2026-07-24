import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as config_actions from '../../../actions/config';
import * as app_actions from '../../../actions/app';
import Button from '../../controls/button/Button';
import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigSettingHeader from '../primitives/ConfigSettingHeader';
import ConfigBooleanRow from '../primitives/ConfigBooleanRow';

const RESTORE_CONFIRM =
  'Restore default settings and clear the file list? The app will stay open.';
const HARD_RESET_CONFIRM =
  'Clear all saved app data and close SlideRelabeler? You will need to open the app again.';

/**
 * Advanced — Phase 2g.
 * Recipe: Section → Panel → SettingHeader + BooleanRow ×3 → SettingHeader + dual reset.
 */
export default function ConfigAdvancedSection() {
  const dispatch = useDispatch();
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);
  const disabled = processing || disableChanges;

  const saveMacro = useSelector((state) => !!state.config.wsi?.save_macro_image);
  const copyUnchanged = useSelector((state) => !!state.config.copy?.enable_copy_mode);
  const showDebug = useSelector((state) => !!state.config.debug?.enable_debug);

  const restoreDefaults = () => {
    if (!window.confirm(RESTORE_CONFIRM)) return;
    dispatch({ type: app_actions.RESTORE_DEFAULTS });
  };

  const hardReset = () => {
    if (!window.confirm(HARD_RESET_CONFIRM)) return;
    dispatch({ type: app_actions.DELETE_STORE });
  };

  return (
    <ConfigSection
      id="config-advanced"
      title="Advanced"
      description="Less common options for output files, troubleshooting, and resetting the app."
    >
      <ConfigSectionPanel>
        <ConfigSettingHeader
          title="Macro image (overview)"
          description="By default the large overview photo inside the slide file is removed because it can show patient details. Turn this on only if that image is safe to keep in saved files."
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
          description="Adds a toolbar button for diagnostic messages. Leave this off for normal use."
        />
        <ConfigBooleanRow
          label="Show troubleshooting tools"
          checked={showDebug}
          disabled={disabled}
          onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_DEBUG })}
        />

        <ConfigSettingHeader
          title="Reset"
          description="Restore defaults keeps the app open. Clear all saved data closes SlideRelabeler — open the app again to start fresh."
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
