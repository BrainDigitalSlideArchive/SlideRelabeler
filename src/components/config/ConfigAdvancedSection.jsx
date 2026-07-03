import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import * as app_actions from '../../actions/app';
import Checkbox from '../controls/checkbox/Checkbox';
import Button from '../controls/button/Button';

export default function ConfigAdvancedSection({
  wsiConfig,
  copyConfig,
  debugConfig,
  disabled = false,
}) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

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
            <div className="__config-control-subsection-title">Whole slide image</div>
            <div className="__config-control-subsection-description">
              Control whether deidentified files contain macro images.
            </div>
            <Checkbox
              disabled={disabled}
              label="Keep macro image"
              checked={wsiConfig?.save_macro_image}
              onClick={() => dispatch({ type: config_actions.TOGGLE_SAVE_MACRO })}
            />
          </div>
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Copy mode</div>
            <Checkbox
              label="Enable copy mode"
              checked={copyConfig?.enable_copy_mode ?? false}
              onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_COPY_MODE })}
            />
          </div>
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Debug</div>
            <Checkbox
              label="Enable debug"
              checked={debugConfig?.enable_debug}
              onClick={() => dispatch({ type: config_actions.TOGGLE_ENABLE_DEBUG })}
            />
          </div>
          <div className="__config-control-subsection">
            <div className="__config-control-subsection-title">Reset</div>
            <div className="__config-control-subsection-description">
              Reset the application state to default. This will exit the application immediately.
            </div>
            <Button text="Reset" onClick={() => dispatch({ type: app_actions.DELETE_STORE })} />
          </div>
        </div>
      )}
    </section>
  );
}
