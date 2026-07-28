import React from 'react';
import { useSelector } from 'react-redux';

import ConfigSection from '../primitives/ConfigSection';
import ConfigSectionPanel from '../primitives/ConfigSectionPanel';
import ConfigDivider from '../primitives/ConfigDivider';
import FilePickerInfoSection from './data-loading/FilePickerInfoSection';
import CsvImportSection from './data-loading/CsvImportSection';
import ApiIntegrationsSection from './data-loading/ApiIntegrationsSection';

const DATA_LOADING_HELP = (
  <>
    SlideRelabeler can load slides via the file picker, a CSV spreadsheet, or an API integration (e.g. eSlideManager).
    Each of these loading options is detailed below.
  </>
);

/**
 * Data loading — Phase 2e.
 * Recipe: Section → Panel → File picker → CSV → API (chips + eSM DetailPanel).
 */
export default function DataLoadingSection() {
  const processing = useSelector((state) => state.files.processing);
  const disableChanges = useSelector((state) => state.files.disable_changes);
  const disabled = processing || disableChanges;
  const csvConfig = useSelector((state) => state.config.csv);

  return (
    <ConfigSection
      id="config-data-loading"
      title="Data loading"
      description="How slides are added to the file list before processing."
      help={DATA_LOADING_HELP}
      helpLabel="Data loading help"
    >
      <ConfigSectionPanel>
        <FilePickerInfoSection />
        <ConfigDivider />
        <CsvImportSection csvConfig={csvConfig} disabled={disabled} />
        <ConfigDivider />
        <ApiIntegrationsSection disabled={disabled} />
      </ConfigSectionPanel>
    </ConfigSection>
  );
}
