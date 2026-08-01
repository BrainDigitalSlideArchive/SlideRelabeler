"""Prefer bundled native libraries over host paths in frozen (PyInstaller) builds.

pylibtiff uses ctypes.util.find_library('tiff'), which on macOS often resolves to
/usr/local/lib/libtiff.dylib (Intel Homebrew) before the arm64 copy shipped in
_MEIPASS. Patch find_library (and optionally preload) so frozen engines stay
architecture-correct regardless of the host dyld search path.

pyvips ABI mode calls cffi ``dlopen('libvips.42.dylib')`` by bare filename (not
find_library), so we also prepend ``_MEIPASS`` to DYLD_* and preload key dylibs.
"""
from __future__ import annotations

import ctypes
import ctypes.util
import os
import sys
from typing import Dict, List, Optional, Tuple

_APPLIED = False

# ctypes.util.find_library name -> candidate basenames under _MEIPASS
_BUNDLE_CANDIDATES: Dict[str, Tuple[str, ...]] = {
    "tiff": ("libtiff.dylib", "libtiff.6.dylib", "libtiff.6.2.0.dylib", "libtiff.so", "libtiff.dll"),
    "openslide": ("libopenslide.1.dylib", "libopenslide.dylib", "libopenslide.so", "libopenslide-1.dll"),
    # pyvips looks up several of these names via ctypes / cffi.
    "vips": ("libvips.42.dylib", "libvips.dylib", "libvips.so.42", "libvips.so"),
    "libvips.42": ("libvips.42.dylib", "libvips.dylib"),
}

# Preload order matters for RTLD_GLOBAL resolution of @rpath deps.
_PRELOAD_BASENAMES: Tuple[str, ...] = (
    "libiconv.2.dylib",
    "libintl.8.dylib",
    "libglib-2.0.0.dylib",
    "libgobject-2.0.0.dylib",
    "libgmodule-2.0.0.dylib",
    "libgio-2.0.0.dylib",
    "libvips.42.dylib",
    "libtiff.dylib",
    "libopenslide.1.dylib",
)


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False)) or hasattr(sys, "_MEIPASS")


def meipass_dir() -> Optional[str]:
    path = getattr(sys, "_MEIPASS", None)
    return path if isinstance(path, str) and path else None


def resolve_bundled_library(find_name: str, root: Optional[str] = None) -> Optional[str]:
    """Return absolute path to a bundled dylib/dll for a find_library name, if present."""
    base = root if root is not None else meipass_dir()
    if not base:
        return None
    for basename in _BUNDLE_CANDIDATES.get(find_name, ()):
        candidate = os.path.join(base, basename)
        if os.path.isfile(candidate):
            return candidate
    return None


def _prepend_dyld_path(env_key: str, directory: str) -> None:
    """Ensure ``directory`` is the first entry of a DYLD search path env var."""
    if not directory:
        return
    current = os.environ.get(env_key, "")
    parts = [p for p in current.split(":") if p and p != directory]
    os.environ[env_key] = ":".join([directory, *parts]) if parts else directory


def _patch_find_library(overrides: Dict[str, str]) -> None:
    if not overrides:
        return
    original = ctypes.util.find_library
    by_basename = {os.path.basename(path): path for path in overrides.values()}

    def find_library(name: str):  # type: ignore[no-untyped-def]
        if not name:
            return original(name)
        if name in overrides:
            return overrides[name]
        if name in by_basename:
            return by_basename[name]
        bare = name[3:] if name.startswith("lib") else name
        if bare in overrides:
            return overrides[bare]
        for basename, path in by_basename.items():
            stem = basename
            for suffix in (".dylib", ".so", ".dll"):
                if stem.endswith(suffix):
                    stem = stem[: -len(suffix)]
                    break
            aliases = {basename, stem}
            if stem.startswith("lib"):
                aliases.add(stem[3:])
            if name in aliases:
                return path
        return original(name)

    ctypes.util.find_library = find_library  # type: ignore[assignment]


def _preload(path: str) -> None:
    # RTLD_GLOBAL so subsequent relative loads can bind against it when needed.
    mode = getattr(ctypes, "RTLD_GLOBAL", 0)
    if mode:
        ctypes.CDLL(path, mode=mode)
    else:
        ctypes.CDLL(path)


def prefer_bundled_dylibs(*, root: Optional[str] = None, preload: bool = True) -> Dict[str, str]:
    """Install find_library overrides for bundled libs. Idempotent.

    Returns the mapping of find_library names to absolute paths that were applied.
    No-ops (returns {}) when not frozen, unless ``root`` is explicitly provided
    (useful for unit tests).

    ``find_library`` returns basenames (not absolute MEIPASS paths) when frozen so
    PyInstaller's ctypes hook resolves them inside ``_MEIPASS``. Absolute paths are
    still used for CDLL preload and DYLD_* so cffi bare-name dlopen works.
    """
    global _APPLIED
    if _APPLIED and root is None:
        return {}

    if root is None and not is_frozen():
        return {}

    base = root if root is not None else meipass_dir()
    if base:
        # Stop libvips from loading Homebrew Cellar vips-modules-* plugins, which
        # re-pull host GLib/Vips and collide with the bundled copies.
        os.environ.setdefault("VIPSHOME", base)
        # pyvips ABI mode: cffi.dlopen('libvips.42.dylib') ignores find_library.
        if root is None:
            _prepend_dyld_path("DYLD_LIBRARY_PATH", base)
            _prepend_dyld_path("DYLD_FALLBACK_LIBRARY_PATH", base)

    resolved: Dict[str, str] = {}
    for find_name in _BUNDLE_CANDIDATES:
        path = resolve_bundled_library(find_name, root=root)
        if path:
            resolved[find_name] = path

    if not resolved and not base:
        return {}

    # PyInstaller ctypes hook maps freeze-time paths; absolute runtime MEIPASS
    # paths often fail with "not found when the application was frozen".
    # Prefer basenames so LoadLibrary searches _MEIPASS.
    find_overrides = {
        name: (os.path.basename(path) if root is None else path)
        for name, path in resolved.items()
    }
    _patch_find_library(find_overrides)

    if preload and base and root is None:
        for basename in _PRELOAD_BASENAMES:
            abs_path = os.path.join(base, basename)
            if not os.path.isfile(abs_path):
                continue
            # PyInstaller's ctypes hook rejects absolute runtime MEIPASS paths;
            # load by basename so the hook resolves inside _MEIPASS.
            try:
                _preload(basename)
            except OSError as err:
                print(
                    f"[frozen_dylib_prefer] preload failed for {basename}: {err}",
                    file=sys.stderr,
                    flush=True,
                )

    if root is None:
        _APPLIED = True

    if resolved:
        print(
            "[frozen_dylib_prefer] using bundled: "
            + ", ".join(f"{k}={v}" for k, v in sorted(resolved.items())),
            file=sys.stderr,
            flush=True,
        )
    return resolved


def reset_for_tests() -> None:
    """Test helper: allow prefer_bundled_dylibs to run again."""
    global _APPLIED
    _APPLIED = False
