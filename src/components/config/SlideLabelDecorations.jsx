import React from 'react';

const QR_PATTERN = [
  '11100111011',
  '10100101010',
  '10100111011',
  '00010100000',
  '11101011101',
  '01010000100',
  '11101010111',
  '00010101010',
  '11100111011',
  '10100010101',
  '11100111011',
];

/** Decorative QR pattern (not scannable). */
export function ExampleQrSvg({ className = '' }) {
  const size = 11;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
    >
      {QR_PATTERN.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '1' ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Simple stain-style icon for the image region. */
export function ExampleIconSvg({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="14" r="6" fill="#E8A0BF" opacity="0.85" />
      <circle cx="20" cy="18" r="6" fill="#6B9BD1" opacity="0.85" />
      <rect x="4" y="26" width="24" height="2" rx="1" fill="#ADB5BD" />
    </svg>
  );
}
