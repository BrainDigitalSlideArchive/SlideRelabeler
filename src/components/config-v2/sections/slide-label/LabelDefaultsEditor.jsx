import React, { useCallback } from 'react';

import { PlaceholderChips } from '../../../config/ComputedFieldEditor';
import ConfigChoiceChips from '../../primitives/ConfigChoiceChips';
import ConfigDetailPanel from '../../primitives/ConfigDetailPanel';
import ConfigField from '../../primitives/ConfigField';
import ConfigHelperText from '../../primitives/ConfigHelperText';
import LabelFontSizeEditor from './LabelFontSizeEditor';

const TEXT_OPTIONS = [
  {
    value: 'output_name',
    label: 'Use Output name',
    helper: "When Label is empty, fill from each row's Output name.",
  },
  {
    value: 'none',
    label: 'Leave blank',
    helper: 'When Label is empty, leave it blank. Enter text in the table when needed.',
  },
  {
    value: 'pattern',
    label: 'Custom pattern',
    helper: 'Build label text from placeholders and column values. Press Enter for a new line.',
    patternPlaceholder: '{outputName}',
  },
];

const QR_OPTIONS = [
  {
    value: 'output_name',
    label: 'Use Output name',
    helper: "When QR is empty, encode each row's Output name.",
  },
  {
    value: 'label_text',
    label: 'Use Label',
    helper:
      "When QR is empty, encode each row's Label value. Multiline labels are not supported: slides with line breaks in Label will not get a QR code.",
  },
  {
    value: 'uuid',
    label: 'Use UUID',
    helper: 'When QR is empty, encode the file UUID.',
  },
  {
    value: 'pattern',
    label: 'Custom pattern',
    helper: 'Build QR content from placeholders and column values.',
    patternPlaceholder: 'https://example.org?id={uuid}',
  },
];

/**
 * Label text / QR default chips + detail (config-v2 kit).
 */
export default function LabelDefaultsEditor({
  kind,
  labelConfig,
  disabled = false,
  inactive = false,
  onChange,
  placeholderCatalog = [],
  hasLoadedFiles = false,
}) {
  const isText = kind === 'text';
  const options = isText ? TEXT_OPTIONS : QR_OPTIONS;
  const chipOptions = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
    helper: opt.helper,
  }));
  const spec = isText
    ? (labelConfig?.labelText ?? { mode: labelConfig?.textDefault ?? 'output_name', pattern: '' })
    : (labelConfig?.qrContent ?? {
      mode: labelConfig?.qrDefault ?? 'output_name',
      pattern: labelConfig?.qrPattern ?? '',
    });
  const active = spec.mode ?? 'output_name';
  const pattern = spec.pattern ?? '';
  const controlsDisabled = disabled || inactive;
  const activeOption = options.find((opt) => opt.value === active);

  function select(value) {
    if (isText) {
      onChange({ labelText: { mode: value, pattern: spec.pattern ?? '' }, textDefault: value });
    } else {
      onChange({ qrContent: { mode: value, pattern: spec.pattern ?? '' }, qrDefault: value });
    }
  }

  function onPatternChange(value) {
    if (isText) {
      onChange({ labelText: { mode: active, pattern: value }, textDefault: active });
    } else {
      onChange({
        qrContent: { mode: active, pattern: value },
        qrDefault: active,
        qrPattern: value,
      });
    }
  }

  const handlePatternInsert = useCallback((token) => {
    onPatternChange(`${pattern}${token}`);
  }, [pattern]);

  return (
    <div className={inactive ? 'cfg-labeled-row--inactive' : undefined}>
      <ConfigChoiceChips
        name={`label-default-${kind}-v2`}
        value={active}
        options={chipOptions}
        disabled={controlsDisabled}
        ariaLabel={isText ? 'Label text default' : 'QR content default'}
        onChange={select}
      />
      <ConfigDetailPanel aria-live="polite">
        {active === 'pattern' ? (
          <>
            <ConfigHelperText>Pattern</ConfigHelperText>
            {isText ? (
              <textarea
                className="__input-text cfg-label-pattern-textarea"
                disabled={controlsDisabled}
                aria-label="Label text pattern"
                placeholder={
                  options.find((o) => o.value === 'pattern')?.patternPlaceholder ?? '{outputName}'
                }
                value={pattern}
                rows={3}
                onChange={(e) => onPatternChange(e.target.value)}
              />
            ) : (
              <ConfigField
                size="fill"
                omitLabel
                disabled={controlsDisabled}
                ariaLabel="QR content pattern"
                placeholder={
                  options.find((o) => o.value === 'pattern')?.patternPlaceholder ?? '{outputName}'
                }
                value={pattern}
                onChange={onPatternChange}
              />
            )}
            <div className="computed-field-editor">
              <PlaceholderChips
                catalog={placeholderCatalog}
                hasLoadedFiles={hasLoadedFiles}
                disabled={controlsDisabled}
                onInsert={handlePatternInsert}
              />
            </div>
          </>
        ) : (
          <ConfigHelperText>{activeOption?.helper}</ConfigHelperText>
        )}
      </ConfigDetailPanel>
      {isText ? (
        <LabelFontSizeEditor
          labelConfig={labelConfig}
          disabled={disabled}
          inactive={inactive}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
}
