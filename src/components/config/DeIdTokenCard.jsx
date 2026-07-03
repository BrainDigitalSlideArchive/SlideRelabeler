import React from 'react';
import InputText from '../controls/input/InputText';
import Dropdown from '../controls/dropdown/Dropdown';

const ACCESSION_MODE_OPTIONS = [
  { label: 'Original accession (from metadata)', value: 'original' },
  { label: 'Manual de-ID token', value: 'manual' },
  { label: 'Auto token from ImageId', value: 'auto' },
];

export default function DeIdTokenCard({
  disabled,
  namingConfig,
  columnOptions = [],
  onNamingChange,
  onRecompute,
  previewToken = '',
}) {
  const accessionMode = namingConfig?.accessionMode || 'original';
  const selectedMode = ACCESSION_MODE_OPTIONS.filter((o) => o.value === accessionMode);
  const tokenColumn = (namingConfig?.tokenIdColumn ?? '').trim();
  const tokenColumnItem = tokenColumn
    ? columnOptions.find((o) => o.value === tokenColumn) || { label: tokenColumn, value: tokenColumn }
    : null;

  function setNaming(partial) {
    onNamingChange(partial);
    if (onRecompute) onRecompute();
  }

  return (
    <div className="__config-control-subsection de-id-token-card">
      <div className="__config-control-subsection-title">De-ID token</div>
      <div className="__config-control-subsection-description">
        Used when you include De-ID token in label text, QR, or DSA metadata. Optional if you use only stain/block columns.
      </div>
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="De-ID token source"
          placeholder="Select source"
          items={ACCESSION_MODE_OPTIONS}
          selectedItems={selectedMode}
          onSelect={(item) => setNaming({ accessionMode: item.value })}
        />
      </div>
      {accessionMode === 'manual' && (
        <InputText
          disabled={disabled}
          label="Manual token (fallback)"
          value={namingConfig?.accessionToken || ''}
          onChange={(v) => setNaming({ accessionToken: v })}
        />
      )}
      <div className="__config-control-subsection-row">
        <Dropdown
          disabled={disabled}
          label="CSV column for per-row token (optional)"
          placeholder="Select column or type below"
          items={columnOptions}
          multiSelect={false}
          selectedItems={tokenColumnItem ? [tokenColumnItem] : []}
          onSelect={(item) => setNaming({ tokenIdColumn: item?.value ?? '' })}
        />
      </div>
      <InputText
        disabled={disabled}
        label="Or enter column name manually"
        value={namingConfig?.tokenIdColumn || ''}
        onChange={(v) => setNaming({ tokenIdColumn: v })}
      />
      <div className="__config-control-subsection-note-description">
        Preview token for selected row:{' '}
        <strong>{previewToken && String(previewToken).trim() ? previewToken : '(empty)'}</strong>
      </div>
    </div>
  );
}
