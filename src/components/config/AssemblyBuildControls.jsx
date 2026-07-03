import React, { useMemo } from 'react';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';
import { buildAssembledName } from '../../helpers/assembly_routing';

const SPECIMEN_SOURCE_OPTIONS = [
  { label: 'From metadata (accession)', value: 'from_metadata' },
  { label: 'Fixed value', value: 'fixed' },
  { label: 'Auto from ImageId', value: 'generated' },
  { label: 'From CSV column', value: 'from_column' },
];

export const ASSEMBLY_FIELD_ITEMS = [
  { label: 'Specimen ID', value: 'specimenId' },
  { label: 'Block', value: 'BlockId' },
  { label: 'Stain', value: 'StainId' },
  { label: 'Slide #', value: 'SlideNum' },
];

const DUPLICATE_OPTIONS = [
  { label: 'Add number suffix', value: 'suffix-index' },
  { label: 'Skip duplicate', value: 'skip-duplicates' },
];

/**
 * Shared assembly build controls (used in Output filename inline + Assembled name section).
 */
export default function AssemblyBuildControls({
  assembly,
  disabled = false,
  columnOptions = [],
  sampleRow = null,
  onAssemblyChange,
  showDuplicateStrategy = true,
  compact = false,
}) {
  const fieldsOrder = Array.isArray(assembly?.fieldsOrder) ? assembly.fieldsOrder : [];
  const specimenId = assembly?.specimenId ?? {};

  const preview = useMemo(() => {
    if (!sampleRow) return '';
    return buildAssembledName(sampleRow, assembly);
  }, [sampleRow, assembly]);

  const selectedSource = SPECIMEN_SOURCE_OPTIONS.filter((o) => o.value === (specimenId.source || 'from_metadata'));
  const selectedDup = DUPLICATE_OPTIONS.filter((o) => o.value === (assembly?.duplicateStrategy || 'suffix-index'));
  const tokenColumnItem = specimenId.column
    ? columnOptions.find((o) => o.value === specimenId.column) || { label: specimenId.column, value: specimenId.column }
    : null;

  function patch(partial) {
    if (onAssemblyChange) onAssemblyChange(partial);
  }

  function toggleField(value) {
    const exists = fieldsOrder.includes(value);
    const next = exists ? fieldsOrder.filter((x) => x !== value) : [...fieldsOrder, value];
    patch({ fieldsOrder: next });
  }

  return (
    <div className={`assembly-build-controls${compact ? ' assembly-build-controls--compact' : ''}`}>
      {!compact && (
        <div className="__config-control-subsection-description">
          Include these parts (order matters):
        </div>
      )}
      <div className="assembled-name-section__field-checks" role="group" aria-label="Include these parts">
        {ASSEMBLY_FIELD_ITEMS.map((item) => (
          <label key={item.value} className="assembled-name-section__check">
            <input
              type="checkbox"
              checked={fieldsOrder.includes(item.value)}
              disabled={disabled}
              onChange={() => toggleField(item.value)}
            />
            {item.label}
          </label>
        ))}
      </div>
      <InputText
        disabled={disabled}
        label="Between parts"
        value={assembly?.separator ?? '_'}
        onChange={(v) => patch({ separator: v })}
      />
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="Specimen ID comes from"
          placeholder="Select source"
          items={SPECIMEN_SOURCE_OPTIONS}
          selectedItems={selectedSource}
          onSelect={(item) => patch({ specimenId: { ...specimenId, source: item.value } })}
        />
      </div>
      {specimenId.source === 'fixed' && (
        <InputText
          disabled={disabled}
          label="Fixed specimen ID"
          value={specimenId.fixedValue || ''}
          onChange={(v) => patch({ specimenId: { ...specimenId, fixedValue: v } })}
        />
      )}
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="Column with per-slide ID (optional)"
          placeholder="Select column"
          items={columnOptions}
          selectedItems={tokenColumnItem ? [tokenColumnItem] : []}
          onSelect={(item) => patch({ specimenId: { ...specimenId, column: item?.value ?? '' } })}
        />
      </div>
      {!compact && (
        <InputText
          disabled={disabled}
          label="Or enter column name manually"
          value={specimenId.column || ''}
          onChange={(v) => patch({ specimenId: { ...specimenId, column: v } })}
        />
      )}
      {showDuplicateStrategy && (
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            label="If two slides get the same name"
            items={DUPLICATE_OPTIONS}
            selectedItems={selectedDup}
            onSelect={(item) => patch({ duplicateStrategy: item.value })}
          />
        </div>
      )}
      <div className="__config-control-subsection-note-description">
        Example assembled name: <strong>{preview || '(empty)'}</strong>
      </div>
    </div>
  );
}
