import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import LabelSchematicPanel from '../../../config/LabelSchematicPanel';
import ConfigFeatureBlock from '../../primitives/ConfigFeatureBlock';
import LabelDefaultsEditor from './LabelDefaultsEditor';
import LabelImageFileRow from './LabelImageFileRow';

const FEATURES = [
  {
    key: 'text',
    label: 'Label Text',
    hint: 'Printed at the top of the label.',
  },
  {
    key: 'qr',
    label: 'QR Encoding',
    hint: 'Encode a QR code on the label.',
  },
  {
    key: 'icon',
    label: 'Image/Icon',
    hint: 'Display an image (logo) on the label.',
  },
];

/**
 * Feature blocks + schematic/rendered preview (config-v2).
 */
export default function LabelComposer({
  disabled,
  labelConfig,
  config,
  previewRow,
  previewFilePath,
  previewWarnings = [],
  schematicPreview,
  onRecompute,
  placeholderCatalogs = {},
  addText,
  addQr,
  addIcon,
  onToggleText,
  onToggleQr,
  onToggleIcon,
  iconPath,
}) {
  const dispatch = useDispatch();

  const issueByFeature = useMemo(() => {
    const map = {};
    for (const issue of schematicPreview.issues ?? []) {
      map[issue.feature] = issue;
    }
    return map;
  }, [schematicPreview.issues]);

  function setLabelDefaults(partial) {
    dispatch({ type: config_actions.SET_LABEL_DEFAULTS, payload: partial });
    if (onRecompute) onRecompute();
  }

  const toggles = {
    text: onToggleText,
    qr: onToggleQr,
    icon: onToggleIcon,
  };

  const checkedByKey = {
    text: addText,
    qr: addQr,
    icon: addIcon,
  };

  function renderFeatureBody(key) {
    const inactive = !checkedByKey[key];

    if (key === 'text') {
      return (
        <LabelDefaultsEditor
          kind="text"
          labelConfig={labelConfig}
          disabled={disabled}
          inactive={inactive}
          onChange={setLabelDefaults}
          placeholderCatalog={placeholderCatalogs.labelText ?? []}
        />
      );
    }

    if (key === 'qr') {
      return (
        <LabelDefaultsEditor
          kind="qr"
          labelConfig={labelConfig}
          disabled={disabled}
          inactive={inactive}
          onChange={setLabelDefaults}
          placeholderCatalog={placeholderCatalogs.qrContent ?? []}
        />
      );
    }

    if (key === 'icon') {
      return (
        <LabelImageFileRow
          iconPath={iconPath}
          disabled={disabled}
          inactive={inactive}
          issueMessage={issueByFeature.icon?.message}
          onSelectFile={() => dispatch({ type: config_actions.SELECT_ICON_FILE })}
          onClear={() => dispatch({ type: config_actions.CHANGE_ICON_FILE, payload: null })}
        />
      );
    }

    return null;
  }

  return (
    <div className="cfg-label-layout label-composer">
      <div className="cfg-label-features label-composer__features">
        {FEATURES.map((f) => {
          const checked = checkedByKey[f.key];
          const issue = issueByFeature[f.key];
          return (
            <ConfigFeatureBlock
              key={f.key}
              titleId={`label-feature-${f.key}-v2-title`}
              title={f.label}
              hint={f.hint}
              checked={checked}
              disabled={disabled}
              inactive={!checked}
              incomplete={f.key !== 'icon' && Boolean(issue) && checked}
              issueMessage={f.key === 'icon' ? undefined : issue?.message}
              onChange={() => toggles[f.key]?.()}
            >
              {renderFeatureBody(f.key)}
            </ConfigFeatureBlock>
          );
        })}
      </div>

      <LabelSchematicPanel
        addText={addText}
        addQr={addQr}
        addIcon={addIcon}
        labelConfig={labelConfig}
        iconPath={iconPath}
        config={config}
        previewRow={previewRow}
        previewFilePath={previewFilePath}
        previewWarnings={previewWarnings}
      />
    </div>
  );
}
