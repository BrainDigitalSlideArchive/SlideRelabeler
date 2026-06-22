import React from 'react';
import LabelCompositionItem from './LabelCompositionItem';

const ROWS = [
  {
    key: 'text',
    label: 'Text',
    helper: 'Printed at the top of the label.',
    mockupId: 'label-mockup-text',
  },
  {
    key: 'icon',
    label: 'Image',
    helper: 'Display an image (logo) on the label.',
    mockupId: 'label-mockup-icon',
  },
  {
    key: 'qr',
    label: 'QR code',
    helper: 'Encode a QR code on the label.',
    mockupId: 'label-mockup-qr',
  },
];

export default function LabelCompositionControls({
  disabled,
  addText,
  addQr,
  addIcon,
  onToggleText,
  onToggleQr,
  onToggleIcon,
  expandedKey,
  onToggleExpand,
  summaries = {},
  renderConfigBody,
  showSpecimen,
  specimenSummary,
  specimenBody,
}) {
  const state = {
    text: { checked: addText, onClick: onToggleText },
    qr: { checked: addQr, onClick: onToggleQr },
    icon: { checked: addIcon, onClick: onToggleIcon },
  };

  return (
    <div className="label-composition-controls">
      {ROWS.map((row) => {
        const { checked, onClick } = state[row.key];
        return (
          <LabelCompositionItem
            key={row.key}
            disabled={disabled}
            label={row.label}
            helper={row.helper}
            mockupId={row.mockupId}
            checked={checked}
            onToggleCheck={onClick}
            summary={summaries[row.key] || ''}
            expanded={expandedKey === row.key}
            onToggleExpand={() => onToggleExpand(row.key)}
          >
            {renderConfigBody?.(row.key)}
          </LabelCompositionItem>
        );
      })}

      {showSpecimen && (
        <LabelCompositionItem
          disabled={disabled}
          label="Specimen ID"
          helper="Required because label text or QR uses the specimen ID."
          checked
          showCheckbox={false}
          summary={specimenSummary || 'Not set'}
          expanded={expandedKey === 'specimen'}
          onToggleExpand={() => onToggleExpand('specimen')}
          onToggleCheck={() => {}}
        >
          {specimenBody}
        </LabelCompositionItem>
      )}
    </div>
  );
}
