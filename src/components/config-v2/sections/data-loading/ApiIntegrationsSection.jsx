import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as esm_actions from '../../../../actions/esm';
import HelpIconPopover from '../../../controls/HelpIconPopover';
import EsmDataLoadingSection from '../../../config/EsmDataLoadingSection';
import ConfigCategory from '../../primitives/ConfigCategory';
import ConfigSubsection from '../../primitives/ConfigSubsection';
import ConfigLabeledRow from '../../primitives/ConfigLabeledRow';
import ConfigChoiceChips from '../../primitives/ConfigChoiceChips';

const API_INTEGRATIONS_HELP = (
  <>
    Connect SlideRelabeler to external APIs for loading slides. Enable each integration
    individually to configure its connection and import rules.
  </>
);

const ESM_LOCATION_DESC = (
  <>
    Saved connection profiles for eSlideManager. Open <strong>eSlideManager</strong> from the toolbar
    to log in, pick a profile, and load slides—or clone a profile to save a search preset variant.
  </>
);

const ENABLE_OPTIONS = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

/**
 * API integrations group: one location card per integration (eSM first).
 * Each card owns its enable chips; body collapses when that integration is disabled.
 */
export default function ApiIntegrationsSection({ disabled = false }) {
  const dispatch = useDispatch();
  const esmEnabled = useSelector((state) => state.esm?.integrationEnabled !== false);

  return (
    <ConfigCategory
      id="config-api-integrations"
      title={(
        <>
          API Integrations
          {' '}
          <HelpIconPopover helpLabel="API integrations help" variant="onLight">
            {API_INTEGRATIONS_HELP}
          </HelpIconPopover>
        </>
      )}
      description="External APIs that can load slides into the file table. Enable only the ones you use."
    >
      <ConfigSubsection
        id="config-esm-api"
        location
        title="eSlideManager"
        description={ESM_LOCATION_DESC}
      >
        <ConfigLabeledRow
          label="Status:"
          labelId="esm-integration-enabled-label-v2"
        >
          <ConfigChoiceChips
            name="esm-integration-enabled-v2"
            value={esmEnabled ? 'enabled' : 'disabled'}
            options={ENABLE_OPTIONS}
            disabled={disabled}
            ariaLabelledBy="esm-integration-enabled-label-v2"
            onChange={(next) => dispatch({
              type: esm_actions.SET_ESM_INTEGRATION_ENABLED,
              payload: next === 'enabled',
            })}
          />
        </ConfigLabeledRow>

        {esmEnabled ? (
          <EsmDataLoadingSection
            disabled={disabled}
            showLead={false}
            rootId={null}
          />
        ) : null}
      </ConfigSubsection>
    </ConfigCategory>
  );
}
