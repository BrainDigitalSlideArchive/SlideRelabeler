import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as esm_actions from '../../actions/esm';
import InputText from '../controls/input/InputText';
import { compileStainFilterRegex } from '../../helpers/esm_results_filter';

import './esm_light_panel.scss';

/**
 * eSM-only stain filter (assembly rules live in Configuration).
 */
export default function ESMStainFilterPanel({ disabled = false }) {
  const dispatch = useDispatch();
  const mappingConfig = useSelector((s) => s.esm.mappingConfig);

  const regexState = useMemo(
    () => compileStainFilterRegex(mappingConfig?.resultsFilterRegex),
    [mappingConfig?.resultsFilterRegex],
  );

  return (
    <section className="esm-stain-filter-panel" aria-labelledby="esm-stain-filter-title">
      <h3 id="esm-stain-filter-title" className="esm-light-panel__subsection-title">
        Stain filter
      </h3>
      <p className="esm-light-panel__hint">
        When a criteria row leaves stain blank, only slides whose transformed StainId matches this regex are included.
      </p>
      <InputText
        label="Stain filter (regex)"
        value={mappingConfig?.resultsFilterRegex ?? ''}
        onChange={(v) => dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { resultsFilterRegex: v } })}
        disabled={disabled}
        variant="onLight"
        error={Boolean(mappingConfig?.resultsFilterRegex) && !regexState.ok}
      />
    </section>
  );
}
