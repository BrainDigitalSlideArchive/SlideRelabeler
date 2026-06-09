import React from 'react';
import LabelCompositionControls from './LabelCompositionControls';
import LabelCompositionMockup from './LabelCompositionMockup';

export default function LabelCompositionPanel({
  disabled,
  addText,
  addQr,
  addIcon,
  onToggleText,
  onToggleQr,
  onToggleIcon,
  previewText,
  previewQr,
  iconPath,
}) {
  return (
    <div className="label-composition-panel">
      <div className="label-composition-panel__heading">What should the new label include?</div>
      <div className="label-composition-panel__columns">
        <LabelCompositionControls
          disabled={disabled}
          addText={addText}
          addQr={addQr}
          addIcon={addIcon}
          onToggleText={onToggleText}
          onToggleQr={onToggleQr}
          onToggleIcon={onToggleIcon}
        />
        <LabelCompositionMockup
          addText={addText}
          addQr={addQr}
          addIcon={addIcon}
          previewText={previewText}
          previewQr={previewQr}
          iconPath={iconPath}
        />
      </div>
    </div>
  );
}
