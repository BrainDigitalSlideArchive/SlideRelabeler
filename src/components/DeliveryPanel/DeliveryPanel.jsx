import React from 'react';
import { useDispatch } from 'react-redux';

import * as upload_routing_actions from '../../actions/uploadRouting';
import GridHoverTooltip from '../AgGrid/GridHoverTooltip';
import { getSaveLocallyPanelCopy } from '../../selectors/outputReadiness.js';
import DsaDeliveryControls from './DsaDeliveryControls.jsx';
import GlobusDeliveryControls from './GlobusDeliveryControls.jsx';

import './DeliveryPanel.scss';

const UPLOAD_DESTINATION_OPTIONS = [
  { label: 'DSA', value: 'dsa' },
  { label: 'Globus', value: 'globus' },
];

const UPLOAD_OFF_TEXT = 'Off — enable to configure';

function CompactRadioPills({
  name,
  labelId,
  label,
  options,
  value,
  disabled,
  onChange,
}) {
  return (
    <div className="delivery-panel__field">
      <span className="delivery-panel__field-label" id={labelId}>
        {label}
      </span>
      <div
        className="delivery-panel__pills"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`delivery-panel__pill${value === opt.value ? ' _selected' : ''}`}
          >
            <input
              type="radio"
              name={name}
              disabled={disabled}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="delivery-panel__pill-label">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ColumnToggle({ checked, disabled, label, onChange }) {
  return (
    <label className="delivery-panel__column-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="delivery-panel__sr-only">{label}</span>
    </label>
  );
}

function SaveLocallyHint({ hint, hintTone }) {
  if (!hint) return null;
  const className = hintTone === 'blocked'
    ? 'delivery-panel__status-text _blocked'
    : 'delivery-panel__helper';
  return <p className={className}>{hint}</p>;
}

export default function DeliveryPanel({
  uploadRouting,
  destSummary,
  outputDir,
  disabled = false,
  onChooseFolder,
}) {
  const dispatch = useDispatch();
  const localEnabled = !!uploadRouting?.local_output_enabled;
  const uploadEnabled = !!uploadRouting?.auto_upload;
  const uploadDestination = uploadRouting?.destination === 'globus' ? 'globus' : 'dsa';

  const localCopy = getSaveLocallyPanelCopy(destSummary, outputDir, { localEnabled });

  return (
    <section className="delivery-panel" role="region" aria-label="Output delivery">
      <div className="delivery-panel__header">
        <h2 className="delivery-panel__title">Output delivery</h2>
      </div>

      <div className="delivery-panel__body">
        <div className={`delivery-panel__column${localEnabled ? '' : ' _off'}`}>
          <div className="delivery-panel__column-header">
            <h3 className="delivery-panel__column-title">Save locally</h3>
            <ColumnToggle
              checked={localEnabled}
              disabled={disabled}
              label="Enable local save"
              onChange={() => dispatch({ type: upload_routing_actions.TOGGLE_LOCAL_OUTPUT_ENABLED })}
            />
          </div>
          <div className={`delivery-panel__column-content${localEnabled ? '' : ' _disabled'}`}>
            {!localEnabled ? (
              <p className="delivery-panel__column-off">{localCopy.offText}</p>
            ) : localCopy.showChooseButton ? (
              <>
                <button
                  type="button"
                  className={`delivery-panel__button${disabled ? ' _disabled' : ''}`}
                  disabled={disabled}
                  onClick={onChooseFolder}
                >
                  {localCopy.chooseLabel}
                </button>
                <SaveLocallyHint hint={localCopy.hint} hintTone={localCopy.hintTone} />
              </>
            ) : localCopy.showPathRow ? (
              <>
                <div className="delivery-panel__path-row">
                  <div className="delivery-panel__path" title={outputDir}>
                    <i className="fi fi-rr-folder delivery-panel__path-icon" aria-hidden="true" />
                    <span className="delivery-panel__path-text">{outputDir}</span>
                  </div>
                  <GridHoverTooltip content={localCopy.changeTooltip} show="always" placement="below">
                    <button
                      type="button"
                      className={`delivery-panel__icon-btn${disabled ? ' _disabled' : ''}`}
                      aria-label={localCopy.changeTooltip}
                      disabled={disabled}
                      onClick={onChooseFolder}
                    >
                      <i className="fi fi-rr-arrows-repeat" aria-hidden="true" />
                    </button>
                  </GridHoverTooltip>
                </div>
                <SaveLocallyHint hint={localCopy.hint} hintTone={localCopy.hintTone} />
              </>
            ) : null}
          </div>
        </div>

        <div className={`delivery-panel__column${uploadEnabled ? '' : ' _off'}`}>
          <div className="delivery-panel__column-header">
            <h3 className="delivery-panel__column-title">Upload</h3>
            <ColumnToggle
              checked={uploadEnabled}
              disabled={disabled}
              label="Enable upload"
              onChange={() => dispatch({ type: upload_routing_actions.TOGGLE_AUTO_UPLOAD })}
            />
          </div>
          <div className={`delivery-panel__column-content${uploadEnabled ? '' : ' _disabled'}`}>
            {!uploadEnabled ? (
              <p className="delivery-panel__column-off">{UPLOAD_OFF_TEXT}</p>
            ) : (
              <>
                <CompactRadioPills
                  name="delivery-upload-destination"
                  labelId="delivery-upload-via-label"
                  label="Via"
                  options={UPLOAD_DESTINATION_OPTIONS}
                  value={uploadDestination}
                  disabled={disabled}
                  onChange={(next) => dispatch({
                    type: upload_routing_actions.SET_UPLOAD_DESTINATION,
                    payload: next,
                  })}
                />

                {uploadDestination === 'dsa' ? (
                  <DsaDeliveryControls disabled={disabled} />
                ) : (
                  <GlobusDeliveryControls disabled={disabled} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
