import React from 'react';

import './styles/index.scss';
import ConfigShell from './primitives/ConfigShell';
import ConfigV2Nav, { CONFIG_V2_NAV_ITEMS } from './ConfigV2Nav';
import { ConfigPreviewSandboxProvider } from './preview/ConfigPreviewSandbox';
import ConfigOverviewSection from './sections/ConfigOverviewSection';
import OutputFilenameSection from './sections/OutputFilenameSection';
import OutputDeliverySection from './sections/OutputDeliverySection';
import DataLoadingSection from './sections/DataLoadingSection';
import SlideLabelSection from './sections/SlideLabelSection';
import AuditLoggingSection from './sections/AuditLoggingSection';
import ConfigAdvancedSection from './sections/ConfigAdvancedSection';

function renderSection(item) {
  switch (item.id) {
    case 'config-overview':
      return <ConfigOverviewSection />;
    case 'config-output-filename':
      return <OutputFilenameSection />;
    case 'config-slide-label':
      return <SlideLabelSection />;
    case 'config-output-delivery':
      return <OutputDeliverySection />;
    case 'config-data-loading':
      return <DataLoadingSection />;
    case 'config-audit-logging':
      return <AuditLoggingSection />;
    case 'config-advanced':
      return <ConfigAdvancedSection />;
    default:
      return null;
  }
}

/**
 * Configuration UI v2 root.
 * Sections render in sticky-nav order; migration fills them progressively.
 */
export default function ConfigV2App() {
  return (
    <div className="config-v2">
      <ConfigPreviewSandboxProvider>
        <ConfigShell
          badge="v2 preview"
          nav={<ConfigV2Nav />}
        >
          {CONFIG_V2_NAV_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 ? <div className="cfg-shell__divider" role="separator" /> : null}
              {renderSection(item)}
            </React.Fragment>
          ))}
        </ConfigShell>
      </ConfigPreviewSandboxProvider>
    </div>
  );
}
