import React from 'react';
import Checkbox from '../controls/checkbox/Checkbox';

const ROWS = [
  {
    key: 'text',
    label: 'Human-readable text',
    helper: 'Shown as a bar at the top of the label.',
    mockupId: 'label-mockup-text',
  },
  {
    key: 'icon',
    label: 'Image',
    helper: 'Overlay an icon on the label.',
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
          <div key={row.key} className="label-composition-controls__row">
            <Checkbox
              disabled={disabled}
              label={row.label}
              checked={checked}
              onClick={onClick}
            />
            <div className="label-composition-controls__helper" id={row.mockupId}>
              {row.helper}
            </div>
          </div>
        );
      })}
    </div>
  );
}
