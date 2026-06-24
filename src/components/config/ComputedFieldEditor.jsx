import React, { useCallback } from 'react';
import InputText from '../controls/input/InputText';
import HelpIconPopover from '../controls/HelpIconPopover';

const CURRENT_COLUMNS_HELP = 'These are columns from your currently loaded file list. Click a chip to insert it into the pattern. Any column name - even those not currently visible here - can be wrapped in curly braces (e.g. {blockId}). This is especially useful when loading data from CSV or an API, where column names come from your imported data.';

export function PlaceholderChips({
  catalog,
  catalogLabel = 'Current columns',
  helpText = CURRENT_COLUMNS_HELP,
  disabled,
  onInsert,
}) {
  return (
    <div className="computed-field-editor__catalog">
      <div className="computed-field-editor__catalog-header">
        <span className="computed-field-editor__catalog-label">{catalogLabel}</span>
        <HelpIconPopover helpLabel={`${catalogLabel} help`} variant="onLight">
          {helpText}
        </HelpIconPopover>
      </div>
      {catalog?.length > 0 && (
        <div className="computed-field-editor__placeholders" aria-label={`${catalogLabel} placeholders`}>
          {catalog.map((item) => (
            <button
              key={item.token}
              type="button"
              className="computed-field-editor__chip"
              disabled={disabled}
              title={
                item.hint
                || (item.altInsertValue ? `${item.insertValue} or ${item.altInsertValue}` : item.insertValue)
              }
              onClick={() => onInsert(item.insertValue)}
            >
              {item.insertValue}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OptionGroup({
  name,
  options,
  active,
  disabled,
  onSelect,
  patternValue,
  onPatternChange,
  catalog,
  previewValue,
}) {
  const handleInsert = useCallback((token) => {
    onPatternChange(`${patternValue ?? ''}${token}`);
  }, [onPatternChange, patternValue]);

  return (
    <div className="computed-field-editor__options label-defaults-editor__options" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const isActive = active === opt.value;
        const showPattern = isActive && opt.hasPatternField;
        return (
          <label
            key={opt.value}
            className={[
              'computed-field-editor__option label-defaults-editor__option',
              showPattern ? '_with-field' : '',
            ].filter(Boolean).join(' ')}
          >
            <input
              type="radio"
              name={name}
              disabled={disabled}
              checked={isActive}
              onChange={() => onSelect(opt.value)}
            />
            <span className="computed-field-editor__option-label label-defaults-editor__option-label">{opt.label}</span>
            {isActive && opt.helper && (
              <span className="computed-field-editor__option-helper label-defaults-editor__option-helper">{opt.helper}</span>
            )}
            {showPattern && (
              <div className="computed-field-editor__option-pattern label-defaults-editor__option-pattern">
                <InputText
                  disabled={disabled}
                  omitLabel
                  variant="onLight"
                  ariaLabel="Custom pattern"
                  placeholder={opt.patternPlaceholder ?? '{outputName}_{blockId}'}
                  value={patternValue ?? ''}
                  onChange={onPatternChange}
                />
                <PlaceholderChips catalog={catalog} disabled={disabled} onInsert={handleInsert} />
                {previewValue != null && String(previewValue).trim() && (
                  <div className="computed-field-editor__preview">
                    Preview: {previewValue}
                  </div>
                )}
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}

export default function ComputedFieldEditor({
  lead,
  name,
  options,
  active,
  disabled,
  onSelect,
  patternValue,
  onPatternChange,
  catalog = [],
  previewValue,
}) {
  return (
    <div className="computed-field-editor label-defaults-editor">
      {lead && <div className="computed-field-editor__lead label-defaults-editor__lead">{lead}</div>}
      <OptionGroup
        name={name}
        options={options}
        active={active}
        disabled={disabled}
        onSelect={onSelect}
        patternValue={patternValue}
        onPatternChange={onPatternChange}
        catalog={catalog}
        previewValue={previewValue}
      />
    </div>
  );
}
