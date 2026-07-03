import React, { useEffect, useMemo, useState } from 'react';
import { encodeURLParameters } from '../../helpers/url_helpers';
import { resolveLabelPreviewFilePath } from '../../helpers/config_preview_row.js';

const DEBOUNCE_MS = 300;

export default function LabelThumbnailPreview({
  config,
  fileRow,
  filePath,
  enabled,
  compact = false,
}) {
  const [debouncedUrl, setDebouncedUrl] = useState(null);

  const resolvedPath = filePath ?? resolveLabelPreviewFilePath(fileRow);
  const composeOnly = !resolvedPath;

  const previewUrl = useMemo(() => {
    if (!enabled || !fileRow) return null;

    const source = fileRow.__reserved?.source || {};
    const filename = resolvedPath
      ? resolvedPath.split(/[/\\]/).pop()
      : (source.filename || 'preview.tiff');

    const outputDict = {
      ...fileRow,
      config,
      __reserved: {
        ...(fileRow.__reserved || {}),
        source: {
          ...source,
          path: resolvedPath || '',
          filename,
        },
        associatedImages: composeOnly ? [] : ['label', 'thumbnail'],
      },
    };

    if (composeOnly) {
      outputDict.__configPreview = { composeOnly: true };
    }

    const params = encodeURLParameters(outputDict);
    return `preview-label://preview?${params}`;
  }, [config, fileRow, resolvedPath, composeOnly, enabled]);

  useEffect(() => {
    if (!previewUrl) {
      setDebouncedUrl(null);
      return undefined;
    }
    const timer = setTimeout(() => setDebouncedUrl(previewUrl), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [previewUrl]);

  if (!enabled) return null;

  const rootClass = compact
    ? 'label-thumbnail-preview label-thumbnail-preview--compact'
    : 'label-thumbnail-preview';

  return (
    <div className={rootClass}>
      {!compact && <div className="__config-control-subsection-title">Rendered label</div>}
      {debouncedUrl ? (
        <img
          className="label-thumbnail-preview__image"
          alt="Rendered label preview"
          src={debouncedUrl}
        />
      ) : (
        <div className="label-thumbnail-preview__placeholder">Generating preview…</div>
      )}
    </div>
  );
}
