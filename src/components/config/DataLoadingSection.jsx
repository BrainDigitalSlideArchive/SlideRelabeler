import React from 'react';

import HelpIconPopover from '../controls/HelpIconPopover';
import FilePickerInfoSection from './FilePickerInfoSection';
import CsvImportSection from './CsvImportSection';
import ApiIntegrationsSection from './ApiIntegrationsSection';

const DATA_LOADING_HELP = (
  <>
    SlideRelabeler can load slides via the file picker, a CSV spreadsheet, or eSlideManager. Each path
    has its own subsection below. Output name and label defaults always come from the sections
    above in Configuration.
  </>
);

export default function DataLoadingSection({
  csvConfig,
  disabled = false,
}) {
  return (
    <section className="__config-control-section data-loading-section" id="config-data-loading">
      <div className="__config-control-section-title">Data loading</div>
      <div className="__config-control-section-description">
        How slide rows enter the file table before processing.
        {' '}
        <HelpIconPopover helpLabel="Data loading help" variant="onLight">
          {DATA_LOADING_HELP}
        </HelpIconPopover>
      </div>

      <div className="config-section-panel data-loading-section__panel">
        <FilePickerInfoSection />

        <hr className="data-loading-section__divider" aria-hidden="true" />

        <CsvImportSection csvConfig={csvConfig} disabled={disabled} />

        <hr className="data-loading-section__divider" aria-hidden="true" />

        <ApiIntegrationsSection
          disabled={disabled}
        />
      </div>
    </section>
  );
}
