import { useEffect, useMemo, useState } from 'react';

import {
  getLabelIconPath,
  needsLabelIconFile,
} from '../../helpers/label_icon_batch.js';

/**
 * Load label-icon bytes for preview (same IPC as Process preflight).
 * @returns {{
 *   status: 'not_needed'|'loading'|'ok'|'unreadable',
 *   bytesBase64: string|null,
 *   iconReadable: boolean|null,
 * }}
 */
export default function useLabelIconForPreview(config) {
  const required = needsLabelIconFile(config);
  const iconPath = getLabelIconPath(config);

  const [state, setState] = useState(() => (
    required
      ? { status: 'loading', bytesBase64: null }
      : { status: 'not_needed', bytesBase64: null }
  ));

  useEffect(() => {
    if (!required) {
      setState({ status: 'not_needed', bytesBase64: null });
      return undefined;
    }

    let cancelled = false;
    setState({ status: 'loading', bytesBase64: null });

    const api = typeof window !== 'undefined' ? window.electronAPI : null;
    if (!api?.readLabelIconBytes) {
      setState({ status: 'unreadable', bytesBase64: null });
      return undefined;
    }

    api.readLabelIconBytes(iconPath)
      .then((result) => {
        if (cancelled) return;
        if (result?.ok && result.base64) {
          setState({ status: 'ok', bytesBase64: String(result.base64) });
        } else {
          setState({ status: 'unreadable', bytesBase64: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unreadable', bytesBase64: null });
      });

    return () => {
      cancelled = true;
    };
  }, [required, iconPath]);

  return useMemo(() => {
    let iconReadable = null;
    if (state.status === 'ok') iconReadable = true;
    else if (state.status === 'unreadable') iconReadable = false;

    return {
      status: state.status,
      bytesBase64: state.bytesBase64,
      iconReadable,
    };
  }, [state.status, state.bytesBase64]);
}
