import { useEffect, useState } from 'react';

/**
 * App version from Electron `app.getVersion()` (package.json).
 * Empty string until resolved or if the API is unavailable.
 */
export function useAppVersion() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    let cancelled = false;
    const api = typeof electronAPI !== 'undefined' ? electronAPI : null;
    if (typeof api?.getAppVersion !== 'function') return undefined;

    api.getAppVersion().then((v) => {
      if (!cancelled && typeof v === 'string' && v.trim()) {
        setVersion(v.trim());
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return version;
}
