import React, { useCallback } from 'react';
import InputText from '../controls/input/InputText';
import HelpIconPopover from '../controls/HelpIconPopover';

const CURRENT_COLUMNS_HELP = 'These are columns from your currently loaded file list. Click a chip to insert it into the pattern. Any column name—even those not currently visible here—can be wrapped in curly braces (e.g. {blockId}). This is especially useful with CSV import or an API integration, where column names come from your imported data.';

const DEFAULT_COLUMNS_HELP = 'These are columns that are always available, shown here because no slides are loaded yet. Click a chip to insert it into the pattern. After you load slides, columns from your file list appear here too. You can also wrap any column name in curly braces (e.g. {blockId}).';

/** Label + help for file-list pattern chips; switches with load state. */
export function getFileListPlaceholderCopy(hasLoadedFiles) {
  if (hasLoadedFiles) {
    return { catalogLabel: 'Current columns', helpText: CURRENT_COLUMNS_HELP };
  }
  return { catalogLabel: 'Default columns', helpText: DEFAULT_COLUMNS_HELP };
}

export function PlaceholderChips({
  catalog,
  hasLoadedFiles = false,
  catalogLabel,
  helpText,
  disabled,
  onInsert,
}) {
  const copy = getFileListPlaceholderCopy(hasLoadedFiles);
  const resolvedLabel = catalogLabel ?? copy.catalogLabel;
  const resolvedHelp = helpText ?? copy.helpText;

  return (
    <div className="computed-field-editor__catalog">
      <div className="computed-field-editor__catalog-header">
        <span className="computed-field-editor__catalog-label">{resolvedLabel}</span>
        <HelpIconPopover helpLabel={`${resolvedLabel} help`} variant="onLight">
          {resolvedHelp}
        </HelpIconPopover>
      </div>
      {catalog?.length > 0 && (
        <div className="computed-field-editor__placeholders" aria-label={`${resolvedLabel} placeholders`}>
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
  hasLoadedFiles = false,
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
                <PlaceholderChips
                  catalog={catalog}
                  hasLoadedFiles={hasLoadedFiles}
                  disabled={disabled}
                  onInsert={handleInsert}
                />
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
  hasLoadedFiles = false,
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
        hasLoadedFiles={hasLoadedFiles}
        previewValue={previewValue}
      />
    </div>
  );
}
