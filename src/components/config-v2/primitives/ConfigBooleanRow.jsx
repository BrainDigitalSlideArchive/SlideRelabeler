import React from 'react';

import Checkbox from '../../controls/checkbox/Checkbox';

/**
 * Compact boolean setting with kit row-label typography.
 * Wraps shared Checkbox; styles live under `.config-v2 .cfg-boolean-row`.
 */
export default function ConfigBooleanRow({
  label,
  checked = false,
  onClick,
  disabled = false,
  tooltip,
  helpVariant = 'onLight',
  className = '',
}) {
  return (
    <div className={`cfg-boolean-row${className ? ` ${className}` : ''}`}>
      <Checkbox
        compact
        label={label}
        checked={checked}
        onClick={onClick}
        disabled={disabled}
        tooltip={tooltip}
        helpVariant={helpVariant}
      />
    </div>
  );
}
