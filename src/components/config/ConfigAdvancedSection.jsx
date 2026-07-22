import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import * as app_actions from '../../actions/app';
import Checkbox from '../controls/checkbox/Checkbox';
import Button from '../controls/button/Button';

const RESTORE_CONFIRM =
  'Restore default settings and clear the file list? The app will stay open.';
const HARD_RESET_CONFIRM =
  'Clear all saved app data and close SlideRelabeler? You will need to open the app again.';

export default function ConfigAdvancedSection({
  wsiConfig,
  copyConfig,
  debugConfig,
  disabled = false,
}) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const restoreDefaults = () => {
    if (!window.confirm(RESTORE_CONFIRM)) return;
    dispatch({ type: app_actions.RESTORE_DEFAULTS });
  };

  const hardReset = () => {
    if (!window.confirm(HARD_RESET_CONFIRM)) return;
    dispatch({ type: app_actions.DELETE_STORE });
  };

  return (
    <section className="__config-control-section config-guided-section" id="config-advanced">
      <button
        type="button"
        className="config-advanced__toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="__config-control-section-title">Advanced</span>
        <span className="config-advanced__chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="config-advanced__body">
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Overview image</div>
            <div className="__config-control-subsection-description">
              By default the large overview photo inside the slide file is removed because it can
              show patient details. Turn this on only if that image is safe to keep in saved files.
            </div>
            <Checkbox
              disabled={disabled}
              label="Keep the overview image"
              checked={wsiConfig?.save_macro_image}
              onClick={() => dispatch({ type: config_actions.TOGGLE_SAVE_MACRO })}
            />
          </div>
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Unchanged file copy</div>
            <div className="__config-control-subsection-description">
              Puts an unchanged copy of each source file in the output folder instead of rewriting
              the file. Use only when you need the original file contents preserved.
            </div>
            <Checkbox
              disabled={disabled}
              label="Copy files without changing them"
              checked={copyConfig?.enable_copy_mode ?? false}
              onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_COPY_MODE })}
            />
          </div>
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Troubleshooting</div>
            <div className="__config-control-subsection-description">
              Adds a toolbar button for diagnostic messages. Leave this off for normal use.
            </div>
            <Checkbox
              disabled={disabled}
              label="Show troubleshooting tools"
              checked={debugConfig?.enable_debug}
              onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_DEBUG })}
            />
          </div>
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Reset</div>
            <div className="__config-control-subsection-description">
              Restore defaults keeps the app open. Hard reset clears saved app data and closes
              SlideRelabeler — open the app again to start fresh.
            </div>
            <div className="config-advanced__reset-actions">
              <Button
                variant="onLight"
                text="Restore defaults"
                disabled={disabled}
                onClick={restoreDefaults}
              />
              <Button
                variant="onLight"
                text="Hard reset"
                disabled={disabled}
                onClick={hardReset}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
