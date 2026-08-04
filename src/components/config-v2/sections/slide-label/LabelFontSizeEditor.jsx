import React, { useState } from 'react';

import {
  LABEL_FONT_SIZE_DEFAULT,
  LABEL_FONT_SIZE_UI_MAX,
  LABEL_FONT_SIZE_UI_MIN,
  fontSizeFractionToUi,
  fontSizeUiToFraction,
} from '../../../../helpers/computed_field_config';
import ConfigChoiceChips from '../../primitives/ConfigChoiceChips';
import ConfigDetailPanel from '../../primitives/ConfigDetailPanel';
import ConfigHelperText from '../../primitives/ConfigHelperText';

const FONT_MODE_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto',
    helper: 'Scale text to fit the label width.',
  },
  {
    value: 'manual',
    label: 'Manual',
    helper: 'Use the live label preview to dial in size.',
  },
];

/**
 * Auto / Manual label font size controls for the Label Text feature block.
 * Manual UI is a unitless 1–100 size; config still stores a width fraction.
 */
export default function LabelFontSizeEditor({
  labelConfig,
  disabled = false,
  inactive = false,
  onChange,
}) {
  const mode = labelConfig?.fontSizeMode === 'manual' ? 'manual' : 'auto';
  const fontSize = Number.isFinite(Number(labelConfig?.fontSize))
    ? Number(labelConfig.fontSize)
    : LABEL_FONT_SIZE_DEFAULT;
  const sizeUi = fontSizeFractionToUi(fontSize);
  const controlsDisabled = disabled || inactive;
  const activeOption = FONT_MODE_OPTIONS.find((opt) => opt.value === mode);
  const [draftSize, setDraftSize] = useState(null);
  const displaySize = draftSize != null ? draftSize : String(sizeUi);

  function commitSize(raw) {
    setDraftSize(null);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      onChange({ fontSize: fontSizeUiToFraction(sizeUi) });
      return;
    }
    onChange({ fontSize: fontSizeUiToFraction(parsed) });
  }

  function onSizeUiChange(nextUi) {
    setDraftSize(null);
    onChange({ fontSize: fontSizeUiToFraction(nextUi) });
  }

  return (
    <div className={inactive ? 'cfg-labeled-row--inactive' : undefined}>
      <ConfigHelperText>Font size</ConfigHelperText>
      <ConfigChoiceChips
        name="label-font-size-mode-v2"
        value={mode}
        options={FONT_MODE_OPTIONS.map((opt) => ({
          value: opt.value,
          label: opt.label,
          helper: opt.helper,
        }))}
        disabled={controlsDisabled}
        ariaLabel="Label font size mode"
        onChange={(value) => onChange({ fontSizeMode: value })}
      />
      <ConfigDetailPanel aria-live="polite">
        {mode === 'manual' ? (
          <>
            <ConfigHelperText>Size (1–100). Use the preview to judge.</ConfigHelperText>
            <div className="cfg-label-font-size">
              <input
                type="range"
                className="cfg-label-font-size__range"
                min={LABEL_FONT_SIZE_UI_MIN}
                max={LABEL_FONT_SIZE_UI_MAX}
                step={1}
                value={sizeUi}
                disabled={controlsDisabled}
                aria-label="Label font size"
                onChange={(e) => onSizeUiChange(Number(e.target.value))}
              />
              <input
                type="number"
                className="__input-text cfg-label-font-size__input"
                min={LABEL_FONT_SIZE_UI_MIN}
                max={LABEL_FONT_SIZE_UI_MAX}
                step={1}
                value={displaySize}
                disabled={controlsDisabled}
                aria-label="Label font size value"
                onChange={(e) => setDraftSize(e.target.value)}
                onBlur={() => commitSize(displaySize)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
          </>
        ) : (
          <ConfigHelperText>{activeOption?.helper}</ConfigHelperText>
        )}
      </ConfigDetailPanel>
    </div>
  );
}
