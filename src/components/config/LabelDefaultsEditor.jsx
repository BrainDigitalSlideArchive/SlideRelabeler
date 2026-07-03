import React, { useCallback } from 'react';
import InputText from '../controls/input/InputText';
import { PlaceholderChips } from './ComputedFieldEditor';

const TEXT_OPTIONS = [
  {
    value: 'output_name',
    label: 'Use Output name',
    helper: 'When Label is empty, fill from each row\'s Output name.',
  },
  {
    value: 'none',
    label: 'Leave blank',
    helper: 'When Label is empty, leave it blank. Enter text in the table when needed.',
  },
  {
    value: 'pattern',
    label: 'Custom pattern',
    helper: 'Build label text from placeholders and column values.',
    patternPlaceholder: '{outputName}',
  },
];

const QR_OPTIONS = [
  {
    value: 'output_name',
    label: 'Use Output name',
    helper: 'When QR is empty, encode each row\'s Output name.',
  },
  {
    value: 'label_text',
    label: 'Use Label',
    helper: 'When QR is empty, encode each row\'s Label value.',
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

export default function LabelDefaultsEditor({
  kind,
  labelConfig,
  disabled = false,
  inactive = false,
  onChange,
  placeholderCatalog = [],
}) {
  const isText = kind === 'text';
  const options = isText ? TEXT_OPTIONS : QR_OPTIONS;
  const spec = isText
    ? (labelConfig?.labelText ?? { mode: labelConfig?.textDefault ?? 'output_name', pattern: '' })
    : (labelConfig?.qrContent ?? { mode: labelConfig?.qrDefault ?? 'output_name', pattern: labelConfig?.qrPattern ?? '' });
  const active = spec.mode ?? 'output_name';
  const pattern = spec.pattern ?? '';
  const controlsDisabled = disabled || inactive;
  const activeOption = options.find((opt) => opt.value === active);
  const modesClass = isText
    ? 'config-filename-style__modes config-filename-style__modes--compact'
    : 'config-filename-style__modes config-filename-style__modes--compact config-filename-style__modes--compact-four';

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
      onChange({ qrContent: { mode: active, pattern: value }, qrDefault: active, qrPattern: value });
    }
  }

  const handlePatternInsert = useCallback((token) => {
    onPatternChange(`${pattern}${token}`);
  }, [pattern, onPatternChange]);

  return (
    <div
      className={[
        'config-filename-style',
        'config-filename-style--compact',
        'label-defaults-editor',
        'label-defaults-editor--compact',
        inactive ? 'label-defaults-editor--inactive' : '',
      ].filter(Boolean).join(' ')}
      aria-disabled={inactive || undefined}
    >
      <div
        className={modesClass}
        role="radiogroup"
        aria-label={isText ? 'Label text default' : 'QR content default'}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className="config-filename-style__option"
            title={opt.helper}
          >
            <input
              type="radio"
              name={`label-default-${kind}`}
              disabled={controlsDisabled}
              checked={active === opt.value}
              onChange={() => select(opt.value)}
            />
            <span className="config-filename-style__label">{opt.label}</span>
            <span className="config-filename-style__helper config-filename-style__helper--sr-only">
              {opt.helper}
            </span>
          </label>
        ))}
      </div>

      <div className="label-defaults-editor__detail" aria-live="polite">
        {active === 'pattern' ? (
          <>
            <div className="config-filename-field">
              <span className="config-filename-field__label">Pattern</span>
              <InputText
                disabled={controlsDisabled}
                omitLabel
                variant="onLight"
                ariaLabel={isText ? 'Label text pattern' : 'QR content pattern'}
                placeholder={options.find((o) => o.value === 'pattern')?.patternPlaceholder ?? '{outputName}'}
                value={pattern}
                onChange={onPatternChange}
              />
            </div>
            <div className="computed-field-editor">
              <PlaceholderChips
                catalog={placeholderCatalog}
                disabled={controlsDisabled}
                onInsert={handlePatternInsert}
              />
            </div>
          </>
        ) : (
          <p className="label-defaults-editor__detail-text">
            {activeOption?.helper}
          </p>
        )}
      </div>
    </div>
  );
}
