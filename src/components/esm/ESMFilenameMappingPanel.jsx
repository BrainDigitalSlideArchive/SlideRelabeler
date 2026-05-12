import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import InputText from '../controls/input/InputText';
import { compileStainFilterRegex } from '../../helpers/esm_results_filter';

import './esm_light_panel.scss';

export default function ESMFilenameMappingPanel({ disabled = false }) {
  const dispatch = useDispatch();
  const mappingConfig = useSelector((s) => s.esm.mappingConfig);

  const regexState = useMemo(
    () => compileStainFilterRegex(mappingConfig?.resultsFilterRegex),
    [mappingConfig?.resultsFilterRegex],
  );

  const filenameFieldItems = [
    { label: 'Accession', value: 'Accession' },
    { label: 'BlockId', value: 'BlockId' },
    { label: 'StainId', value: 'StainId' },
    { label: 'SlideNum', value: 'SlideNum' },
  ];

  const accessionMode = mappingConfig?.accessionMode || 'original';
  const duplicateStrategy = mappingConfig?.duplicateStrategy || 'suffix-index';
  const fieldsOrder = Array.isArray(mappingConfig?.fieldsOrder) ? mappingConfig.fieldsOrder : [];

  function toggleField(value) {
    const exists = fieldsOrder.includes(value);
    const next = exists ? fieldsOrder.filter((x) => x !== value) : [...fieldsOrder, value];
    dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { fieldsOrder: next } });
  }

  return (
    <section className="esm-filename-mapping-panel" aria-labelledby="esm-filename-mapping-title">
      <h3 id="esm-filename-mapping-title" className="esm-light-panel__subsection-title">
        Filename mapping
      </h3>
      <p className="esm-light-panel__hint">
        Choose how eSM slides are renamed when added to the file list. Staging rows use your criteria (accession load plus
        optional block and stain filters).
      </p>

      <div className="esm-light-panel__field-grid">
        <div className="esm-light-panel__field-row">
          <div className="esm-light-panel__field">
            <label className="esm-light-panel__label" htmlFor="esm-accession-mode">
              Accession token
            </label>
            <select
              id="esm-accession-mode"
              className="esm-light-panel__select"
              value={accessionMode}
              disabled={disabled}
              onChange={(e) =>
                dispatch({
                  type: esm_actions.ESM_SET_MAPPING_CONFIG,
                  payload: { accessionMode: e.target.value },
                })
              }
            >
              <option value="original">Original accession</option>
              <option value="manual">Manual token</option>
              <option value="auto">Auto token</option>
            </select>
          </div>
          <div className="esm-light-panel__field">
            <label className="esm-light-panel__label" htmlFor="esm-dup-strategy">
              Duplicate handling
            </label>
            <select
              id="esm-dup-strategy"
              className="esm-light-panel__select"
              value={duplicateStrategy}
              disabled={disabled}
              onChange={(e) =>
                dispatch({
                  type: esm_actions.ESM_SET_MAPPING_CONFIG,
                  payload: { duplicateStrategy: e.target.value },
                })
              }
            >
              <option value="suffix-index">Add numeric suffix</option>
              <option value="skip-duplicates">Skip duplicates</option>
            </select>
          </div>
        </div>

        {accessionMode === 'manual' && (
          <InputText
            label={'Manual accession token'}
            value={mappingConfig?.accessionToken || ''}
            onChange={(v) => dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { accessionToken: v } })}
            disabled={disabled}
            variant="onLight"
            tooltip={
              'Used when a criteria row has no de-ID value. If the row has a de-ID, that value is used as the accession token instead.'
            }
          />
        )}

        <InputText
          label={'Stain filter (regex)'}
          value={mappingConfig?.resultsFilterRegex ?? ''}
          onChange={(v) => dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { resultsFilterRegex: v } })}
          disabled={disabled}
          variant="onLight"
          error={Boolean(mappingConfig?.resultsFilterRegex) && !regexState.ok}
          tooltip={
            'When a criteria row leaves stain blank, only slides whose transformed StainId matches this regex are included. Leave empty to allow all stains in that case. Invalid regex excludes those slides until fixed.'
          }
        />

        <div>
          <div className="esm-light-panel__label" style={{ marginBottom: '0.35rem' }}>
            Filename fields
          </div>
          <div className="esm-light-panel__checkbox-row" role="group" aria-label="Filename fields">
            {filenameFieldItems.map((item) => (
              <label key={item.value} className="esm-light-panel__check-label">
                <input
                  type="checkbox"
                  checked={fieldsOrder.includes(item.value)}
                  disabled={disabled}
                  onChange={() => toggleField(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
