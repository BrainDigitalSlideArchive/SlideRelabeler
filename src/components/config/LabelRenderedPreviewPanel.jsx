import React from 'react';
import HelpIconPopover from '../controls/HelpIconPopover';
import LabelThumbnailPreview from './LabelThumbnailPreview';

const RENDERED_PREVIEW_HELP = 'The editable values in the "Test it out" grid below are reflected in this live preview.';

export default function LabelRenderedPreviewPanel({
  addText,
  addQr,
  addIcon,
  warnings = [],
  config,
  fileRow,
  filePath,
}) {
  const enabled = addText || addQr || addIcon;

  if (!enabled) return null;

  return (
    <div className="label-composer__rendered-preview">
      <div className="label-composer__rendered-header">
        <span className="label-composer__rendered-title">Rendered preview</span>
        <HelpIconPopover helpLabel="Rendered label preview help" variant="onLight">
          {RENDERED_PREVIEW_HELP}
        </HelpIconPopover>
      </div>
      <LabelThumbnailPreview
        compact
        config={config}
        fileRow={fileRow}
        filePath={filePath}
        enabled={enabled}
      />
      {warnings.length > 0 && (
        <div className="label-composer__rendered-warnings" title={warnings.join(' ')}>
          {warnings[0]}
          {warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ''}
        </div>
      )}
    </div>
  );
}
