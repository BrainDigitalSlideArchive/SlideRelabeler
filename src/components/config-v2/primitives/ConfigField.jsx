import React from 'react';

import InputText from '../../controls/input/InputText';

const SIZE_CLASS = {
  xs: 'cfg-field--xs',
  sm: 'cfg-field--sm',
  md: 'cfg-field--md',
  fill: 'cfg-field--fill',
};

/**
 * InputText wrapper with kit size contract (xs|sm|md|fill).
 * Shared InputText defaults to light chrome; does not use InputText compact (avoids v1 width wars).
 */
export default function ConfigField({
  size = 'md',
  className = '',
  ...rest
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const rootClass = ['cfg-field', sizeClass, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <InputText {...rest} />
    </div>
  );
}
