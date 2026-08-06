import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import * as config_actions from '../../../../actions/config';
import {
  LABEL_WIDTH_DEFAULT,
  LABEL_WIDTH_MAX,
  LABEL_WIDTH_MIN,
  normalizeLabelWidthValue,
} from '../../../../helpers/computed_field_config';
import {
  LABEL_ICON_UNREADABLE_SUMMARY,
  configForLabelPreview,
} from '../../../../helpers/label_icon_batch.js';
import LabelSchematicPanel from '../../../config/LabelSchematicPanel';
import useLabelIconForPreview from '../../../config/useLabelIconForPreview.js';
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
    label: 'QR Code',
    hint: 'Default content to embed into the QR code. Note: If the qr column specifies a value, it will be used instead.',
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
  hasLoadedFiles = false,
  addText,
  addQr,
  addIcon,
  onToggleText,
  onToggleQr,
  onToggleIcon,
  iconPath,
}) {
  const dispatch = useDispatch();
  const customizeWidth = Boolean(labelConfig?.customizeLabelWidth);
  const storedWidth = normalizeLabelWidthValue(labelConfig ?? {});
  const [draftWidth, setDraftWidth] = useState(null);
  const widthInputId = 'label-width-px-v2';

  const { bytesBase64, iconReadable } = useLabelIconForPreview(config);
  const previewConfig = useMemo(
    () => configForLabelPreview(config, bytesBase64),
    [config, bytesBase64],
  );

  const issueByFeature = useMemo(() => {
    const map = {};
    for (const issue of schematicPreview.issues ?? []) {
      map[issue.feature] = issue;
    }
    if (iconReadable === false) {
      map.icon = { feature: 'icon', message: LABEL_ICON_UNREADABLE_SUMMARY };
    }
    return map;
  }, [schematicPreview.issues, iconReadable]);

  const mergedPreviewWarnings = useMemo(() => {
    const next = [...previewWarnings];
    if (iconReadable === false && !next.includes(LABEL_ICON_UNREADABLE_SUMMARY)) {
      next.unshift(LABEL_ICON_UNREADABLE_SUMMARY);
    }
    return next;
  }, [previewWarnings, iconReadable]);

  function setLabelDefaults(partial) {
    dispatch({ type: config_actions.SET_LABEL_DEFAULTS, payload: partial });
    if (onRecompute) onRecompute();
  }

  function commitLabelWidth(raw) {
    setDraftWidth(null);
    const next = normalizeLabelWidthValue({
      labelWidth: raw === '' || raw == null ? LABEL_WIDTH_DEFAULT : raw,
    });
    setLabelDefaults({ labelWidth: next, customizeLabelWidth: true });
  }

  function toggleCustomizeWidth(nextChecked) {
    setDraftWidth(null);
    setLabelDefaults({
      customizeLabelWidth: nextChecked,
      labelWidth: nextChecked ? storedWidth : LABEL_WIDTH_DEFAULT,
    });
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
          hasLoadedFiles={hasLoadedFiles}
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
          hasLoadedFiles={hasLoadedFiles}
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

  const widthDisabled = disabled || !customizeWidth;
  const displayWidth = customizeWidth
    ? (draftWidth != null ? draftWidth : String(storedWidth))
    : String(LABEL_WIDTH_DEFAULT);

  return (
    <div className="cfg-label-layout label-composer">
      <div className="cfg-label-features label-composer__features">
        <ConfigFeatureBlock
          titleId="label-feature-width-v2-title"
          title="Customize width"
          hint="Default: 750 px"
          checked={customizeWidth}
          disabled={disabled}
          inactive={!customizeWidth}
          onChange={toggleCustomizeWidth}
        >
          <div className={customizeWidth ? undefined : 'cfg-labeled-row--inactive'}>
            <div className="cfg-label-width-row__controls">
              <input
                id={widthInputId}
                type="number"
                className="__input-text cfg-label-width-row__input"
                min={LABEL_WIDTH_MIN}
                max={LABEL_WIDTH_MAX}
                step={1}
                disabled={widthDisabled}
                value={displayWidth}
                aria-label="Label width in pixels"
                onChange={(e) => setDraftWidth(e.target.value)}
                onBlur={() => {
                  if (!customizeWidth) return;
                  commitLabelWidth(draftWidth != null ? draftWidth : storedWidth);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
              <span className="cfg-label-width-row__unit" aria-hidden="true">px</span>
            </div>
          </div>
        </ConfigFeatureBlock>
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
              incomplete={Boolean(issue) && checked}
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
        iconUnreadable={iconReadable === false}
        config={previewConfig}
        previewRow={previewRow}
        previewFilePath={previewFilePath}
        previewWarnings={mergedPreviewWarnings}
      />
    </div>
  );
}
