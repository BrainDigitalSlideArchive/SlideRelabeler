import React from 'react';
import GridHoverTooltip from './GridHoverTooltip.jsx';

const IMAGE_TYPES = [
  { key: 'thumbnail', label: 'Thumbnail', letter: 'T' },
  { key: 'label', label: 'Label', letter: 'L' },
  { key: 'macro', label: 'Macro', letter: 'M' },
];

export default function AssociatedImagesIcons({ images = [] }) {
  const present = new Set(Array.isArray(images) ? images : []);
  const presentLabels = IMAGE_TYPES
    .filter(({ key }) => present.has(key))
    .map(({ label }) => label);
  const tooltip = presentLabels.length > 0
    ? presentLabels.join(', ')
    : 'No associated images';

  return (
    <GridHoverTooltip
      content={tooltip}
      show="always"
      className="__associated-images-icons"
    >
      {IMAGE_TYPES.map(({ key, letter }, index) => {
        const active = present.has(key);
        return (
          <React.Fragment key={key}>
            {index > 0 && (
              <span className="__associated-images-icons__sep" aria-hidden="true">,</span>
            )}
            <span
              className={`__associated-images-icons__letter${active ? ' __associated-images-icons__letter--active' : ''}`}
              aria-hidden="true"
            >
              {letter}
            </span>
          </React.Fragment>
        );
      })}
    </GridHoverTooltip>
  );
}
