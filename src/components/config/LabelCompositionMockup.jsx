import React, { useEffect, useState } from 'react';

import { ExampleIconSvg, ExampleQrSvg } from './SlideLabelDecorations';

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
  compact = false,
}) {
  const [iconPreviewSrc, setIconPreviewSrc] = useState(null);

  const textDisplay = addText
    ? (previewText && String(previewText).trim() ? truncate(previewText) : 'Sample text')
    : 'Text';
  const qrPayloadLabel = previewQr && String(previewQr).trim()
    ? truncate(previewQr, 32)
    : '(empty)';
  const iconLabel = addIcon && iconPath ? truncate(iconPath.split(/[/\\]/).pop(), 24) : 'Image';
  const singleGraphic = (addIcon && !addQr) || (!addIcon && addQr);
  const showBothOff = !addIcon && !addQr;

  useEffect(() => {
    if (!addIcon || !iconPath) {
      setIconPreviewSrc(null);
      return undefined;
    }

    let cancelled = false;

    window.electronAPI
      .readLocalImagePreview(iconPath)
      .then((src) => {
        if (!cancelled) setIconPreviewSrc(src || null);
      })
      .catch(() => {
        if (!cancelled) setIconPreviewSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [addIcon, iconPath]);

  const iconZoneContent = (() => {
    if (!addIcon) return 'Image';
    if (iconPreviewSrc) {
      return (
        <>
          <img
            src={iconPreviewSrc}
            alt=""
            className="label-composition-mockup__icon-preview"
          />
          <span className="label-composition-mockup__icon-caption" title={iconPath}>
            {iconLabel}
          </span>
        </>
      );
    }
    if (iconPath) {
      return (
        <>
          <ExampleIconSvg className="label-composition-mockup__icon-svg" />
          <span className="label-composition-mockup__icon-caption" title={iconPath}>
            {iconLabel}
          </span>
        </>
      );
    }
    return (
      <>
        <ExampleIconSvg className="label-composition-mockup__icon-svg" />
        <span className="label-composition-mockup__region-label">Image</span>
      </>
    );
  })();

  const iconZone = (
    <div
      id="label-mockup-icon"
      data-state={addIcon ? 'on' : 'off'}
      aria-label={`Label image zone: ${iconLabel}`}
      className={`label-composition-mockup__zone label-composition-mockup__zone--icon ${addIcon ? 'label-composition-mockup__zone--on' : 'label-composition-mockup__zone--off'}`}
    >
      {iconZoneContent}
    </div>
  );

  const qrZone = (
    <div
      id="label-mockup-qr"
      data-state={addQr ? 'on' : 'off'}
      aria-label={`Label QR zone: ${addQr ? qrPayloadLabel : 'QR'}`}
      className={`label-composition-mockup__zone label-composition-mockup__zone--qr ${addQr ? 'label-composition-mockup__zone--on' : 'label-composition-mockup__zone--off'}`}
    >
      {addQr ? (
        <>
          <ExampleQrSvg className="label-composition-mockup__qr-svg" />
          <span className="label-composition-mockup__region-label">QR</span>
        </>
      ) : (
        'QR'
      )}
    </div>
  );

  return (
    <div
      className={`label-composition-mockup${compact ? ' label-composition-mockup--compact' : ''}`}
      aria-live="polite"
    >
      {!compact && <div className="label-composition-mockup__title">Label preview</div>}
      <div className="label-composition-mockup__card">
        <div
          id="label-mockup-text"
          data-state={addText ? 'on' : 'off'}
          aria-label={`Label text zone: ${textDisplay}`}
          className={`label-composition-mockup__zone label-composition-mockup__zone--text ${addText ? 'label-composition-mockup__zone--on' : 'label-composition-mockup__zone--off'}`}
        >
          {textDisplay}
        </div>
        <div
          className={`label-composition-mockup__row${singleGraphic ? ' label-composition-mockup__row--single' : ''}`}
        >
          {(addIcon || showBothOff) && iconZone}
          {(addQr || showBothOff) && qrZone}
        </div>
      </div>
    </div>
  );
}
