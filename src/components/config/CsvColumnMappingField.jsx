import React from 'react';
import InputText from '../controls/input/InputText';

export default function CsvColumnMappingField({
  label,
  helper,
  required = false,
  value,
  disabled = false,
  onChange,
  ariaLabel,
}) {
  return (
    <div className="csv-column-mapping">
      <div className="csv-column-mapping__header">
        <span className="csv-column-mapping__label">
          {label}
          {required && (
            <span className="csv-column-mapping__required"> (required)</span>
          )}
        </span>
        <p className="csv-column-mapping__helper">{helper}</p>
      </div>
      <InputText
        disabled={disabled}
        omitLabel
        variant="onLight"
        ariaLabel={ariaLabel || `CSV header for ${label}`}
        placeholder="Column header name"
        value={value ?? ''}
        onChange={onChange}
      />
    </div>
  );
}
