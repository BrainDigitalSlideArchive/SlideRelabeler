import React, { useMemo } from 'react';
import HelpIconPopover from '../controls/HelpIconPopover';
import LabelCompositionMockup from './LabelCompositionMockup';
import LabelRenderedPreviewPanel from './LabelRenderedPreviewPanel';
import { getLabelSchematicTemplates } from '../../helpers/label_config_preview.js';

const SCHEMATIC_HELP = 'Shows enabled label elements and template placeholders from your selected options. Edit cells in Test it out below to preview on a specific row.';

export default function LabelSchematicPanel({
  addText,
  addQr,
  addIcon,
  labelConfig,
  iconPath,
  iconUnreadable = false,
  config,
  previewRow,
  previewFilePath,
  previewWarnings = [],
}) {
  const templates = useMemo(
    () => getLabelSchematicTemplates(labelConfig),
    [labelConfig],
  );

  return (
    <div className="label-composer__schematic">
      <div className="label-composer__schematic-header">
        <span className="label-composer__schematic-title">Label schematic</span>
        <HelpIconPopover helpLabel="Label schematic help" variant="onLight">
          {SCHEMATIC_HELP}
        </HelpIconPopover>
      </div>
      <LabelCompositionMockup
        compact
        addText={addText}
        addQr={addQr}
        addIcon={addIcon}
        textTemplate={templates.labelText}
        qrTemplate={templates.qrPayload}
        iconPath={iconPath}
        iconUnreadable={iconUnreadable}
      />
      <LabelRenderedPreviewPanel
        addText={addText}
        addQr={addQr}
        addIcon={addIcon}
        warnings={previewWarnings}
        config={config}
        fileRow={previewRow}
        filePath={previewFilePath}
      />
    </div>
  );
}
