"""PyInstaller runtime hook: prefer bundled native libs before any app imports."""
from __future__ import annotations

import sys

try:
    from frozen_dylib_prefer import prefer_bundled_dylibs

    prefer_bundled_dylibs()
except Exception as err:  # pragma: no cover - best-effort boot
    print(f"[runtime_hook] prefer_bundled_dylibs failed: {err}", file=sys.stderr, flush=True)
