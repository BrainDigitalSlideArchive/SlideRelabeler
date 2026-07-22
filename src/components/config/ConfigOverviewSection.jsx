import React, { useState } from 'react';

import OverviewLabelIllustration from './OverviewLabelIllustration';
import {
  OVERVIEW_DSA_UPLOAD_ALIAS,
  OVERVIEW_FILENAME,
} from './overview_examples';

export default function ConfigOverviewSection({ hasLoadedFiles = false }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <section className="config-overview" id="config-overview">
      <h2 className="config-overview__title">How de-identified files are named</h2>
      <p className="config-overview__lead">
        SlideRelabeler sets several names for each slide. They are independent—you can use a random filename while
        still showing a readable label, or vice versa.
      </p>

      {!hasLoadedFiles && (
        <div className="config-overview__callout" role="note">
          Load slides or import from eSM to work with your real metadata. Use the sections below to configure naming;
          each section has its own live preview.
        </div>
      )}

      <div className="config-overview__cards">
        <article className="config-overview__card">
          <h3 className="config-overview__card-title">File on disk</h3>
          <p className="config-overview__card-desc">
            The filename of the de-identified image saved to your output folder. Often a random UUID for privacy.
          </p>
          <code className="config-overview__card-example">{OVERVIEW_FILENAME}</code>
        </article>
        <article className="config-overview__card config-overview__card--label">
          <h3 className="config-overview__card-title">Slide label</h3>
          <p className="config-overview__card-desc">
            Text, QR code, and optional image drawn on the slide&apos;s label sticker.
          </p>
          <OverviewLabelIllustration />
        </article>
        <article className="config-overview__card">
          <h3 className="config-overview__card-title">DSA item name (optional)</h3>
          <p className="config-overview__card-desc">
            By default the DSA item name matches the uploaded file. You can set it to Label text or a custom pattern instead.
            Sign in and choose a folder on the main <strong>delivery panel</strong>. Default server URL, item naming, metadata, and staging limits are in <strong>Output delivery</strong> below.
          </p>
          <p className="config-overview__card-aside" role="note">
            <strong>Note:</strong> <strong>Globus</strong> uploads always use the output filename; there is no separate alias.
          </p>
          <code className="config-overview__card-example">{OVERVIEW_DSA_UPLOAD_ALIAS}</code>
          <p className="config-overview__card-note">Example DSA item name</p>
        </article>
      </div>

      <div className="config-overview__glossary-disclosure">
        <button
          type="button"
          className="config-overview__glossary-toggle"
          aria-expanded={glossaryOpen}
          aria-controls="config-overview-glossary"
          onClick={() => setGlossaryOpen(!glossaryOpen)}
        >
          <span className="config-overview__glossary-toggle-text">
            <span className="config-overview__glossary-toggle-title">More terms used below</span>
            <span className="config-overview__glossary-toggle-hint">
              {glossaryOpen
                ? 'Hide additional definitions'
                : 'Expand for UUID, label text, and QR content'}
            </span>
          </span>
          <span className="config-overview__glossary-chevron" aria-hidden="true">
            {glossaryOpen ? '▾' : '▸'}
          </span>
        </button>
        {glossaryOpen && (
          <div id="config-overview-glossary" className="config-overview__glossary-panel">
            <p className="config-overview__glossary-intro">
              The cards above summarize the main outputs. These definitions cover other naming terms you will see in
              the configuration sections below.
            </p>
            <dl className="config-overview__glossary">
              <dt>UUID</dt>
              <dd>
                A universally unique identifier—a completely randomized value assigned to each file. You can optionally
                use it as the output filename instead of a readable name.
              </dd>
              <dt>Label text</dt>
              <dd>Human-readable text printed on the slide label image.</dd>
              <dt>QR content</dt>
              <dd>The exact text or URL encoded in the label QR code (often the UUID or another field you choose).</dd>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
