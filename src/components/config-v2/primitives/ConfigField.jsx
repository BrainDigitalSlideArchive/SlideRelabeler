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
 * Always onLight inside config-v2. Does not use InputText compact (avoids v1 width wars).
 */
export default function ConfigField({
  size = 'md',
  className = '',
  variant = 'onLight',
  ...rest
}) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
  const rootClass = ['cfg-field', sizeClass, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <InputText variant={variant} {...rest} />
    </div>
  );
}
