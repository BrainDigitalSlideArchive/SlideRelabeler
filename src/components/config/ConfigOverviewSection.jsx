import React, { useState } from 'react';

export default function ConfigOverviewSection({
  outputFilenameExample,
  labelTextExample,
  qrExample,
  assembledNameExample,
  catalogConfigured = false,
  hasLoadedFiles = false,
}) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const display = (v) => (v && String(v).trim() ? v : '(example)');

  return (
    <section className="__config-control-section config-guided-section" id="config-overview">
      <div className="__config-control-section-title">How de-identified files are named</div>
      <div className="__config-control-section-description">
        SlideRelabeler sets several names for each slide. They are independent—you can use a random filename while
        still showing a readable label, or vice versa.
      </div>

      {!hasLoadedFiles && (
        <div className="config-overview__hint">
          Load slides or import from eSM to preview with your real metadata. Until then, examples use sample values
          you can edit in each section.
        </div>
      )}

      <div className="config-overview__cards">
        <article className="config-overview__card">
          <h3 className="config-overview__card-title">File on disk</h3>
          <p className="config-overview__card-desc">
            The filename of the de-identified image saved to your output folder.
          </p>
          <code className="config-overview__card-example">{display(outputFilenameExample)}</code>
        </article>
        <article className="config-overview__card">
          <h3 className="config-overview__card-title">Slide label</h3>
          <p className="config-overview__card-desc">
            Text, QR code, and optional image drawn on the slide&apos;s label.
          </p>
          <code className="config-overview__card-example">
            {display(labelTextExample)}
            {qrExample ? ` + QR` : ''}
          </code>
        </article>
        <article className="config-overview__card">
          <h3 className="config-overview__card-title">Catalog entry (optional)</h3>
          <p className="config-overview__card-desc">
            Name and metadata after upload to DSA or Globus. Configure in <strong>Network</strong>.
          </p>
          <code className="config-overview__card-example">
            {catalogConfigured ? display(assembledNameExample) : 'Not configured'}
          </code>
        </article>
      </div>

      <button
        type="button"
        className="config-overview__glossary-toggle"
        aria-expanded={glossaryOpen}
        onClick={() => setGlossaryOpen(!glossaryOpen)}
      >
        {glossaryOpen ? 'Hide' : 'What do these terms mean?'}
      </button>
      {glossaryOpen && (
        <dl className="config-overview__glossary">
          <dt>Specimen ID</dt>
          <dd>A short anonymous ID for the case or slide (e.g. CASE42). Used in labels and tracking—not the filename.</dd>
          <dt>Assembled name</dt>
          <dd>Combined specimen/block/stain string shown in the file table; optional source for filename, label, exports, or catalog.</dd>
          <dt>Output filename</dt>
          <dd>The full filename on disk, including extension.</dd>
          <dt>Label text</dt>
          <dd>Human-readable text printed on the label image.</dd>
          <dt>QR content</dt>
          <dd>The exact text or URL encoded in the QR code.</dd>
          <dt>System file ID (UUID)</dt>
          <dd>A random ID assigned to each file. Often used as the output filename for privacy.</dd>
        </dl>
      )}
    </section>
  );
}
