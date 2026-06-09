import React from 'react';

function truncate(str, max = 48) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export default function LabelCompositionMockup({
  addText,
  addQr,
  addIcon,
  previewText,
  previewQr,
  iconPath,
}) {
  const textDisplay = addText
    ? (previewText && String(previewText).trim() ? truncate(previewText) : 'Sample text')
    : 'Text';
  const qrDisplay = addQr
    ? (previewQr && String(previewQr).trim() ? truncate(previewQr, 32) : 'QR')
    : 'QR';

  return (
    <div className="label-composition-mockup" aria-live="polite">
      <div className="label-composition-mockup__title">Label preview</div>
      <div className="label-composition-mockup__card">
        <div
          id="label-mockup-text"
          className={`label-composition-mockup__zone label-composition-mockup__zone--text ${addText ? 'label-composition-mockup__zone--on' : 'label-composition-mockup__zone--off'}`}
        >
          {textDisplay}
        </div>
        <div
          id="label-mockup-icon"
          className={`label-composition-mockup__zone label-composition-mockup__zone--icon ${addIcon ? 'label-composition-mockup__zone--on' : 'label-composition-mockup__zone--off'}`}
        >
          {addIcon && iconPath ? (
            <span className="label-composition-mockup__icon-name" title={iconPath}>
              {truncate(iconPath.split(/[/\\]/).pop(), 24)}
            </span>
          ) : (
            'Image'
          )}
        </div>
        <div
          id="label-mockup-qr"
          className={`label-composition-mockup__zone label-composition-mockup__zone--qr ${addQr ? 'label-composition-mockup__zone--on' : 'label-composition-mockup__zone--off'}`}
        >
          <div className="label-composition-mockup__qr-box">{qrDisplay}</div>
        </div>
      </div>
    </div>
  );
}
