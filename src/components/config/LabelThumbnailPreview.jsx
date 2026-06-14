import React, { useEffect, useMemo, useState } from 'react';
import { encodeURLParameters } from '../../helpers/url_helpers';

const DEBOUNCE_MS = 300;

export default function LabelThumbnailPreview({
  config,
  fileRow,
  filePath,
  enabled,
}) {
  const [debouncedUrl, setDebouncedUrl] = useState(null);

  const previewUrl = useMemo(() => {
    if (!enabled || !fileRow || !filePath) return null;

    const outputDict = {
      ...fileRow,
      config,
      __reserved: {
        ...(fileRow.__reserved || {}),
        source: {
          ...(fileRow.__reserved?.source || {}),
          path: filePath,
          filename: filePath.split(/[/\\]/).pop(),
        },
        associatedImages: ['label', 'thumbnail'],
      },
    };

    const params = encodeURLParameters(outputDict);
    return `preview-label://preview?${params}`;
  }, [config, fileRow, filePath, enabled]);

  useEffect(() => {
    if (!previewUrl) {
      setDebouncedUrl(null);
      return undefined;
    }
    const timer = setTimeout(() => setDebouncedUrl(previewUrl), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [previewUrl]);

  if (!enabled) return null;

  if (!filePath) {
    return (
      <div className="label-thumbnail-preview">
        <div className="__config-control-subsection-title">Rendered label</div>
        <div className="label-thumbnail-preview__placeholder">
          Load a file to see the rendered label thumbnail.
        </div>
      </div>
    );
  }

  return (
    <div className="label-thumbnail-preview">
      <div className="__config-control-subsection-title">Rendered label</div>
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
