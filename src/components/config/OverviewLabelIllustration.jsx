import React from 'react';

import { OVERVIEW_LABEL_TEXT } from './overview_examples';
import { ExampleIconSvg, ExampleQrSvg } from './SlideLabelDecorations';
import './OverviewLabelIllustration.scss';

/**
 * Static slide-label layout for the Configuration overview (not live preview).
 */
export default function OverviewLabelIllustration() {
  return (
    <figure className="overview-label-illustration">
      <div className="overview-label-illustration__sticker" aria-hidden="true">
        <div className="overview-label-illustration__text">{OVERVIEW_LABEL_TEXT}</div>
        <div className="overview-label-illustration__row">
          <div className="overview-label-illustration__icon">
            <ExampleIconSvg className="overview-label-illustration__icon-svg" />
            <span className="overview-label-illustration__region-label">Image</span>
          </div>
          <div className="overview-label-illustration__qr">
            <ExampleQrSvg className="overview-label-illustration__qr-svg" />
            <span className="overview-label-illustration__region-label">QR</span>
          </div>
        </div>
      </div>
      <figcaption className="overview-label-illustration__caption">
        Example layout: readable text, optional logo, and QR code
      </figcaption>
    </figure>
  );
}
