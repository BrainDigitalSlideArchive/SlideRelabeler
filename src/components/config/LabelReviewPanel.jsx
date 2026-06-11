import React from 'react';
import Dropdown from '../controls/dropdown/Dropdown';
import LabelThumbnailPreview from './LabelThumbnailPreview';

const ROW_SOURCE_OPTIONS = [
  { label: 'Sample row', value: 'sample' },
  { label: 'First loaded file', value: 'first' },
];

export default function LabelReviewPanel({
  addText,
  addQr,
  addIcon,
  labelText,
  qrPayload,
  assembledName,
  deidToken,
  warnings = [],
  rowSource,
  onRowSourceChange,
  hasLoadedFiles,
  emptyFilesBanner,
  config,
  fileRow,
  filePath,
  iconPath,
}) {
  const rowSourceOptions = hasLoadedFiles
    ? ROW_SOURCE_OPTIONS
    : ROW_SOURCE_OPTIONS.filter((o) => o.value === 'sample');

  if (!addText && !addQr && !addIcon) return null;

  const selectedSource = rowSourceOptions.filter((o) => o.value === rowSource);
  const display = (val) => (val && String(val).trim() ? val : '(none)');

  const labelDiffersFromAssembled =
    addText &&
    assembledName &&
    labelText &&
    String(labelText).trim() !== String(assembledName).trim();

  return (
    <div className="config-guided-step label-review-panel config-guided-section">
      <div className="config-step-header">Review your label</div>

      {emptyFilesBanner && (
        <div className="label-config-preview__banner">{emptyFilesBanner}</div>
      )}

      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={!hasLoadedFiles}
          label="Preview slide"
          placeholder="Select row"
          items={rowSourceOptions}
          selectedItems={selectedSource}
          onSelect={(item) => onRowSourceChange(item.value)}
        />
      </div>

      <table className="label-review-panel__table">
        <tbody>
          {addText && (
            <tr>
              <th>Readable text</th>
              <td>{display(labelText)}</td>
            </tr>
          )}
          {addText && labelDiffersFromAssembled && (
            <tr>
              <th>Assembled name</th>
              <td>{display(assembledName)}</td>
            </tr>
          )}
          {addQr && (
            <tr>
              <th>QR content</th>
              <td>{display(qrPayload)}</td>
            </tr>
          )}
          {deidToken && (
            <tr>
              <th>Specimen ID</th>
              <td>{display(deidToken)}</td>
            </tr>
          )}
          {addIcon && (
            <tr>
              <th>Overlay</th>
              <td>{iconPath ? iconPath.split(/[/\\]/).pop() : '(none)'}</td>
            </tr>
          )}
        </tbody>
      </table>

      {warnings.length > 0 && (
        <ul className="label-config-preview__warnings">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <LabelThumbnailPreview
        config={config}
        fileRow={fileRow}
        filePath={filePath}
        enabled={addText || addQr || addIcon}
      />
    </div>
  );
}
