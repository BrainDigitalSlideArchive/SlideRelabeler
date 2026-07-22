import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import OverviewLabelIllustration from '../../config/OverviewLabelIllustration';
import {
  OVERVIEW_DSA_UPLOAD_ALIAS,
  OVERVIEW_FILENAME,
} from '../../config/overview_examples';
import ConfigSection from '../primitives/ConfigSection';
import ConfigCallout from '../primitives/ConfigCallout';
import ConfigInfoCard from '../primitives/ConfigInfoCard';
import ConfigMonoExample from '../primitives/ConfigMonoExample';
import ConfigCollapsible from '../primitives/ConfigCollapsible';

/**
 * Overview — educational naming summary (Phase 2a).
 * Behavioral parity with v1; presentation via style-kit primitives.
 */
export default function ConfigOverviewSection() {
  const fileRows = useSelector((state) => state.files.file_rows);
  const hasLoadedFiles = Array.isArray(fileRows) && fileRows.length > 0;
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <ConfigSection
      id="config-overview"
      title="How de-identified files are named"
      description={(
        <>
          SlideRelabeler sets several names for each slide. They are independent—you can use a random
          filename while still showing a readable label, or vice versa.
        </>
      )}
    >
      {!hasLoadedFiles && (
        <ConfigCallout variant="tinted" role="note">
          Load slides or import from eSM to work with your real metadata. Use the sections below to
          configure naming; each section has its own live preview.
        </ConfigCallout>
      )}

      <div className="cfg-info-card-grid">
        <ConfigInfoCard
          title="File on disk"
          description="The filename of the de-identified image saved to your output folder. Often a random UUID for privacy."
        >
          <ConfigMonoExample>{OVERVIEW_FILENAME}</ConfigMonoExample>
        </ConfigInfoCard>

        <ConfigInfoCard
          title="Slide label"
          description="Text, QR code, and optional image drawn on the slide's label sticker."
        >
          <OverviewLabelIllustration />
        </ConfigInfoCard>

        <ConfigInfoCard
          title="DSA item name (optional)"
          description={(
            <>
              By default the DSA item name matches the uploaded file. You can set it to Label text or a
              custom pattern instead. Sign in and choose a folder on the main{' '}
              <strong>delivery panel</strong>. Default server URL, item naming, metadata, and staging
              limits are in <strong>Output delivery</strong> below.
            </>
          )}
        >
          <ConfigCallout variant="accent" role="note" className="cfg-callout--flush">
            <strong>Note:</strong> <strong>Globus</strong> uploads always use the output filename;
            there is no separate alias.
          </ConfigCallout>
          <ConfigMonoExample caption="Example DSA item name">
            {OVERVIEW_DSA_UPLOAD_ALIAS}
          </ConfigMonoExample>
        </ConfigInfoCard>
      </div>

      <ConfigCollapsible
        title="More terms used below"
        subtitle={
          glossaryOpen
            ? 'Hide additional definitions'
            : 'Expand for UUID, label text, and QR content'
        }
        open={glossaryOpen}
        onToggle={setGlossaryOpen}
        panelId="config-overview-glossary"
      >
        <p className="cfg-glossary-intro">
          The cards above summarize the main outputs. These definitions cover other naming terms you
          will see in the configuration sections below.
        </p>
        <dl className="cfg-glossary">
          <dt>UUID</dt>
          <dd>
            A universally unique identifier—a completely randomized value assigned to each file. You
            can optionally use it as the output filename instead of a readable name.
          </dd>
          <dt>Label text</dt>
          <dd>Human-readable text printed on the slide label image.</dd>
          <dt>QR content</dt>
          <dd>
            The exact text or URL encoded in the label QR code (often the UUID or another field you
            choose).
          </dd>
        </dl>
      </ConfigCollapsible>
    </ConfigSection>
  );
}
