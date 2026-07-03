"""Re-export libtiff_guard from src/python for repro-kit scripts."""
from __future__ import annotations

import sys
from pathlib import Path

_REPO_SRC_PYTHON = Path(__file__).resolve().parent.parent.parent / "src" / "python"
if str(_REPO_SRC_PYTHON) not in sys.path:
    sys.path.insert(0, str(_REPO_SRC_PYTHON))

from libtiff_guard import (  # noqa: E402
    get_tiff_getfield_argtypes,
    install_patchlibtiff_guard,
    is_guard_active,
)

__all__ = [
    "get_tiff_getfield_argtypes",
    "install_patchlibtiff_guard",
    "is_guard_active",
]
