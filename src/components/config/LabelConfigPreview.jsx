import React from 'react';
import Dropdown from '../controls/dropdown/Dropdown';

const ROW_SOURCE_OPTIONS = [
  { label: 'Sample row', value: 'sample' },
  { label: 'First loaded file', value: 'first' },
];

export default function LabelConfigPreview({
  addText,
  addQr,
  labelText,
  qrPayload,
  warnings = [],
  rowSource,
  onRowSourceChange,
  hasLoadedFiles,
  emptyFilesBanner,
}) {
  const rowSourceOptions = hasLoadedFiles
    ? ROW_SOURCE_OPTIONS
    : ROW_SOURCE_OPTIONS.filter((o) => o.value === 'sample');

  if (!addText && !addQr) return null;

  const selectedSource = rowSourceOptions.filter((o) => o.value === rowSource);
  const display = (val) => (val && String(val).trim() ? val : '(empty)');

  return (
    <div className="__config-control-subsection label-config-preview">
      <div className="__config-control-subsection-title">Resolved content</div>
      {emptyFilesBanner && (
        <div className="label-config-preview__banner">{emptyFilesBanner}</div>
      )}
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={!hasLoadedFiles}
          label="Preview row"
          placeholder="Select row"
          items={rowSourceOptions}
          selectedItems={selectedSource}
          onSelect={(item) => onRowSourceChange(item.value)}
        />
      </div>
      {addText && (
        <div className="label-config-preview__row">
          <span className="label-config-preview__label">Label text:</span>
          <span className="label-config-preview__value">{display(labelText)}</span>
        </div>
      )}
      {addQr && (
        <div className="label-config-preview__row">
          <span className="label-config-preview__label">QR content:</span>
          <span className="label-config-preview__value">{display(qrPayload)}</span>
        </div>
      )}
      {warnings.length > 0 && (
        <ul className="label-config-preview__warnings">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
