import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import OverviewLabelIllustration from '../../config/OverviewLabelIllustration';
import { OVERVIEW_FILENAME } from '../../config/overview_examples';
import ConfigSection from '../primitives/ConfigSection';
import ConfigCallout from '../primitives/ConfigCallout';
import ConfigInfoCard from '../primitives/ConfigInfoCard';
import ConfigMonoExample from '../primitives/ConfigMonoExample';
import ConfigCollapsible from '../primitives/ConfigCollapsible';

/** Glossary terms shown on the Overview section (alphabetical). */
export const OVERVIEW_GLOSSARY = [
  {
    term: 'API Integration',
    definition:
      'A way to connect the application to an external system, either for loading data or as a place to upload deidentified files. Current integrations include eSlide Manager, the Digital Slide Archive, and Globus.',
  },
  {
    term: 'CSV import',
    definition:
      'Loading slides from a spreadsheet file. Column headers can supply the file path, output name, label text, QR content, and other fields.',
  },
  {
    term: 'De-identification',
    definition:
      'Creating a copy of a slide with identifying details removed or replaced—new label artwork, redacted internal metadata, and usually a redacted macro (overview) image.',
  },
  {
    term: 'Delivery panel',
    definition:
      'The area on the main app window where you turn on saving locally and/or uploading, and where you sign in and choose folders for DSA or Globus. Configuration sets defaults; the Delivery panel controls the current session.',
  },
  {
    term: 'Digital Slide Archive (DSA)',
    definition:
      'An online slide archive. Uploaded files become items in a folder you choose. You can set how items are named and whether to attach extra data from the file list.',
  },
  {
    term: 'eSlideManager (eSM)',
    definition:
      'An external system that can search and load slides into the file list. Connection profiles and import naming rules are configured under Data loading.',
  },
  {
    term: 'File list',
    definition:
      'The table of slides in the main window. Each row is one slide file, with columns such as Output name, Label, and QR.',
  },
  {
    term: 'Globus',
    definition:
      'A service for sending files to a remote storage collection. Globus uploads use the output filename; there is no separate archive item name.',
  },
  {
    term: 'Label text',
    definition:
      'Text printed on the new slide label. It can span more than one line. Edit it per slide in the Label column of the file list, or set defaults and patterns under Settings → Slide label.',
  },
  {
    term: 'Macro image',
    definition:
      'The overview photo of the whole slide embedded in many WSI files. It can show part of the original label (and thus patient details), so SlideRelabeler usually removes or replaces it.',
  },
  {
    term: 'Metadata',
    definition:
      'Extra information stored inside or alongside a slide file. Internal slide metadata is redacted during de-identification. You can configure how the application handles metadata fields that are loaded into the table for each file, either from a CSV import or an API integration.',
  },
  {
    term: 'Output name',
    definition:
      'The filename used for the de-identified file on disk (and for Globus uploads). It can be a random UUID, the original name, a custom pattern, or a value from CSV/eSM.',
  },
  {
    term: 'Pattern',
    definition:
      'A naming template that mixes fixed text with placeholders (see Placeholder), such as deid_{uuid} or {blockId}_{stainId}.',
  },
  {
    term: 'Placeholder',
    definition:
      'A name in curly braces inside a pattern that is replaced with a real value for each slide—for example {uuid}, {outputName}, or a file-list column like {blockId}. Some placeholders are always available; others appear after you load slides (or come from CSV import / an API integration).',
  },
  {
    term: 'QR content',
    definition:
      'The exact text or URL encoded in the label QR code—often the output name, UUID, label text, or a custom pattern.',
  },
  {
    term: 'UUID',
    definition:
      'A universally unique identifier: a random value assigned to each file. You can use it as the output filename when you want a name that does not describe the specimen.',
  },
  {
    term: 'Whole-slide image (WSI)',
    definition:
      'A large digital microscopy file (for example .svs, .ndpi, .tif, or .tiff) that SlideRelabeler loads, de-identifies, and optionally uploads.',
  },
];

/**
 * Overview — educational summary of de-identification and naming.
 */
export default function ConfigOverviewSection() {
  const fileRows = useSelector((state) => state.files.file_rows);
  const hasLoadedFiles = Array.isArray(fileRows) && fileRows.length > 0;
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <ConfigSection
      id="config-overview"
      title="How WSI deidentification works"
      description={(
        <>
          SlideRelabeler creates a copy of the WSI that contains a new label image, which can include text,
          an image, and a QR code. Internal metadata is automatically redacted. Usually, the macro image
          (the overview image of the whole slide) is also redacted, as this image can contain a portion of
          the slide label which may have protected health information. The options below let you customize
          how the label looks, how to name the file, what data to include in the QR code, and more.
        </>
      )}
    >
      {!hasLoadedFiles && (
        <ConfigCallout variant="tinted" role="note">
          The configuration page uses basic example file information by default. If you load a real WSI file on the
          main page of the app, the data from the first row can be used instead. This can be useful for
          testing and understanding the app&apos;s behavior.
        </ConfigCallout>
      )}

      <div className="cfg-info-card-grid">
        <ConfigInfoCard
          title="Renaming the file"
          description="You can choose how to name the de-identified image. Often, a random UUID is used for privacy, but you can also build a custom name by using data loaded into the app, or even keep the original name."
        >
          <ConfigMonoExample>{OVERVIEW_FILENAME}</ConfigMonoExample>
        </ConfigInfoCard>

        <ConfigInfoCard
          title="Creating the new label"
          description="Text, an image/icon, and/or a QR code can all be drawn onto the slide's new label."
        >
          <OverviewLabelIllustration />
        </ConfigInfoCard>

        <ConfigInfoCard
          title="Uploading to a server"
          description={(
            <>
              You can configure the app to upload the de-identified image to a server after it is created, for
              example to a Digital Slide Archive (DSA) server or by using Globus to send the file to a remote location.
              Depending on the target, you can define additional options like how to name the file on the server, or
              what extra data to send along with the file. By doing this, you can run the application locally without
              needing storage space for all of the de-identified images.
            </>
          )}
        />
      </div>

      <ConfigCollapsible
        title="Glossary of terms used below"
        subtitle={
          glossaryOpen
            ? 'Close the glossary'
            : 'Open the glossary'
        }
        open={glossaryOpen}
        onToggle={setGlossaryOpen}
        panelId="config-overview-glossary"
      >
        <p className="cfg-glossary-intro">
          Definitions for terms you will see in Configuration and on the main app window.
        </p>
        <dl className="cfg-glossary">
          {OVERVIEW_GLOSSARY.map(({ term, definition }) => (
            <React.Fragment key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </React.Fragment>
          ))}
        </dl>
      </ConfigCollapsible>
    </ConfigSection>
  );
}
