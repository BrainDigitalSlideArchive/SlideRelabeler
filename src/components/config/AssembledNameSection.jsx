import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../actions/config';
import Checkbox from '../controls/checkbox/Checkbox';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';
import Button from '../controls/button/Button';
import { buildAssembledName } from '../../helpers/assembly_routing';

const SPECIMEN_SOURCE_OPTIONS = [
  { label: 'From metadata (accession)', value: 'from_metadata' },
  { label: 'Fixed value', value: 'fixed' },
  { label: 'Auto from ImageId', value: 'generated' },
  { label: 'From CSV column', value: 'from_column' },
];

const FIELD_ITEMS = [
  { label: 'Specimen ID', value: 'specimenId' },
  { label: 'Block', value: 'BlockId' },
  { label: 'Stain', value: 'StainId' },
  { label: 'Slide #', value: 'SlideNum' },
];

const DUPLICATE_OPTIONS = [
  { label: 'Add number suffix', value: 'suffix-index' },
  { label: 'Skip duplicate', value: 'skip-duplicates' },
];

export default function AssembledNameSection({
  assembly,
  routing,
  disabled = false,
  columnOptions = [],
  sampleRow = null,
  onScrollToLabel,
}) {
  const dispatch = useDispatch();

  const fieldsOrder = Array.isArray(assembly?.fieldsOrder) ? assembly.fieldsOrder : [];
  const specimenId = assembly?.specimenId ?? {};
  const colName = assembly?.columnName || 'AssembledName';

  const preview = useMemo(() => {
    if (!sampleRow) return '';
    return buildAssembledName(sampleRow, assembly);
  }, [sampleRow, assembly]);

  const selectedSource = SPECIMEN_SOURCE_OPTIONS.filter((o) => o.value === (specimenId.source || 'from_metadata'));
  const selectedDup = DUPLICATE_OPTIONS.filter((o) => o.value === (assembly?.duplicateStrategy || 'suffix-index'));
  const tokenColumnItem = specimenId.column
    ? columnOptions.find((o) => o.value === specimenId.column) || { label: specimenId.column, value: specimenId.column }
    : null;

  function setAssembly(partial) {
    dispatch({ type: config_actions.SET_ASSEMBLY_CONFIG, payload: partial });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  function setRouting(partial) {
    dispatch({ type: config_actions.SET_ROUTING_CONFIG, payload: partial });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
  }

  function toggleField(value) {
    const exists = fieldsOrder.includes(value);
    const next = exists ? fieldsOrder.filter((x) => x !== value) : [...fieldsOrder, value];
    setAssembly({ fieldsOrder: next });
  }

  function useAssembledNameForLabel() {
    dispatch({ type: config_actions.USE_ASSEMBLED_NAME_FOR_LABEL });
    dispatch({ type: config_actions.RECOMPUTE_ALL_NAMING });
    if (onScrollToLabel) onScrollToLabel();
  }

  return (
    <div className="__config-control-section assembled-name-section" id="config-assembled-name">
      <div className="__config-control-section-title">Assembled name</div>
      <div className="__config-control-section-description">
        Build one human-readable name from slide metadata. It appears as a column in the file table. You can also use it
        for filenames, labels, exports, or catalog uploads—configure that below.
      </div>

      <div className="__config-control-subsection">
        <div className="__config-control-subsection-title">Build the name</div>
        <div className="__config-control-subsection-description">Include these parts (order matters):</div>
        <div className="assembled-name-section__field-checks" role="group" aria-label="Include these parts">
          {FIELD_ITEMS.map((item) => (
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
          onChange={(v) => setAssembly({ separator: v })}
        />
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            label="Specimen ID comes from"
            placeholder="Select source"
            items={SPECIMEN_SOURCE_OPTIONS}
            selectedItems={selectedSource}
            onSelect={(item) => setAssembly({ specimenId: { ...specimenId, source: item.value } })}
          />
        </div>
        {specimenId.source === 'fixed' && (
          <InputText
            disabled={disabled}
            label="Fixed specimen ID"
            value={specimenId.fixedValue || ''}
            onChange={(v) => setAssembly({ specimenId: { ...specimenId, fixedValue: v } })}
          />
        )}
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            label="Column with per-slide ID (optional)"
            placeholder="Select column"
            items={columnOptions}
            selectedItems={tokenColumnItem ? [tokenColumnItem] : []}
            onSelect={(item) => setAssembly({ specimenId: { ...specimenId, column: item?.value ?? '' } })}
          />
        </div>
        <InputText
          disabled={disabled}
          label="Or enter column name manually"
          value={specimenId.column || ''}
          onChange={(v) => setAssembly({ specimenId: { ...specimenId, column: v } })}
        />
        <div className="__config-control-subsection-row">
          <Dropdown
            disabled={disabled}
            label="If two slides get the same name"
            items={DUPLICATE_OPTIONS}
            selectedItems={selectedDup}
            onSelect={(item) => setAssembly({ duplicateStrategy: item.value })}
          />
        </div>
        <div className="__config-control-subsection-note-description">
          Example assembled name: <strong>{preview || '(empty)'}</strong>
        </div>
      </div>

      <div className="__config-control-subsection">
        <div className="__config-control-subsection-title">Column in file table</div>
        <div className="__config-control-subsection-description">
          Table column: <strong>Assembled name</strong> ({colName}). Every slide in the list shows this value in the grid.
        </div>
      </div>

      <div className="__config-control-subsection">
        <div className="__config-control-subsection-title">Use this name elsewhere</div>
        <Checkbox
          disabled={disabled}
          label="Use for output filename"
          checked={!!routing?.outputFilename?.enabled}
          onClick={() => setRouting({ outputFilename: { enabled: !routing?.outputFilename?.enabled } })}
        />
        <div className="__config-control-subsection-note-description">
          When you choose a readable filename (Output filename section), this is the base name.
        </div>
        <Checkbox
          disabled={disabled}
          label="Use for label text"
          checked={!!routing?.labelText?.enabled}
          onClick={() => setRouting({ labelText: { enabled: !routing?.labelText?.enabled, column: colName } })}
        />
        <Checkbox
          disabled={disabled}
          label="Use for DSA catalog title"
          checked={!!routing?.dsaItemName?.enabled}
          onClick={() => setRouting({ dsaItemName: { enabled: !routing?.dsaItemName?.enabled } })}
        />
        <Checkbox
          disabled={disabled}
          label="Include in exported CSV"
          checked={!!routing?.exportCsv?.enabled}
          onClick={() => setRouting({ exportCsv: { enabled: !routing?.exportCsv?.enabled, columnHeader: colName } })}
        />
        <Checkbox
          disabled={disabled}
          label="Also encode in QR (same string)"
          checked={routing?.qr?.enabled && routing?.qr?.mode === 'same_column'}
          onClick={() => {
            const on = !(routing?.qr?.enabled && routing?.qr?.mode === 'same_column');
            setRouting({ qr: { enabled: on, mode: on ? 'same_column' : 'off' } });
          }}
        />
        <div className="__config-control-section-group _top-margin">
          <Button
            disabled={disabled}
            text="Use assembled name for label text"
            onClick={useAssembledNameForLabel}
            tooltip="Sets Slide label → readable text → column Assembled name. You can change it later in Slide label."
          />
        </div>
      </div>
    </div>
  );
}
