"""Import-hook guard for large_image tiff_reader — ARM64 pylibtiff #189 compatibility."""
from __future__ import annotations

import importlib.abc
import importlib.util
import sys
from pathlib import Path

# Fix 1: patchLibtiff() — preserve pylibtiff #189 argtypes (UPSTREAM_BRIEF.md).
_PATCHLIBTIFF_CLEAR_ARGTYPES = "    libtiff_ctypes.libtiff.TIFFGetField.argtypes = None"
_PATCHLIBTIFF_OPTION_A = """    _existing = libtiff_ctypes.libtiff.TIFFGetField.argtypes
    if not (_existing and len(_existing) == 2):
        libtiff_ctypes.libtiff.TIFFGetField.argtypes = None"""

# Fix 2: _getJpegTables() — do not extend argtypes for variadic output pointers.
_GET_JPEG_TABLES_ARGTYPES_EXTEND = """        if libtiff_ctypes.libtiff.TIFFGetField.argtypes:
            libtiff_ctypes.libtiff.TIFFGetField.argtypes = \\
                libtiff_ctypes.libtiff.TIFFGetField.argtypes[:2] + \\
                [ctypes.POINTER(ctypes.c_uint32), ctypes.POINTER(ctypes.c_void_p)]
        if libtiff_ctypes.libtiff.TIFFGetField("""
_GET_JPEG_TABLES_NO_EXTEND = """        if libtiff_ctypes.libtiff.TIFFGetField("""

# Fix 3: _getJpegFrameSize() — same pattern for TIFFTAG_TILEBYTECOUNTS tile reads.
_GET_JPEG_FRAME_SIZE_ARGTYPES_EXTEND = """        if libtiff_ctypes.libtiff.TIFFGetField.argtypes:
            libtiff_ctypes.libtiff.TIFFGetField.argtypes = \\
                libtiff_ctypes.libtiff.TIFFGetField.argtypes[:2] + \\
                [ctypes.POINTER(ctypes.POINTER(rawTileSizesType))]
        if libtiff_ctypes.libtiff.TIFFGetField("""
_GET_JPEG_FRAME_SIZE_NO_EXTEND = """        if libtiff_ctypes.libtiff.TIFFGetField("""

_GUARD_INSTALLED = False
_GUARD_EXECUTED = False


def apply_tiff_reader_patches(source: str, path: Path | str = "tiff_reader.py") -> str:
    """Return tiff_reader source with patchLibtiff + variadic argtypes fixes applied."""
    return _apply_tiff_reader_patches(source, Path(path))


def _apply_tiff_reader_patches(source: str, path: Path) -> str:
    if _PATCHLIBTIFF_CLEAR_ARGTYPES not in source:
        raise RuntimeError(
            f"patchLibtiff guard: expected patchLibtiff line not found in {path}; "
            "large_image_source_tiff version may have changed"
        )
    modified = source.replace(_PATCHLIBTIFF_CLEAR_ARGTYPES, _PATCHLIBTIFF_OPTION_A)
    if _GET_JPEG_TABLES_ARGTYPES_EXTEND not in modified:
        raise RuntimeError(
            f"patchLibtiff guard: expected _getJpegTables block not found in {path}; "
            "large_image_source_tiff version may have changed"
        )
    modified = modified.replace(_GET_JPEG_TABLES_ARGTYPES_EXTEND, _GET_JPEG_TABLES_NO_EXTEND)
    if _GET_JPEG_FRAME_SIZE_ARGTYPES_EXTEND in modified:
        modified = modified.replace(
            _GET_JPEG_FRAME_SIZE_ARGTYPES_EXTEND,
            _GET_JPEG_FRAME_SIZE_NO_EXTEND,
        )
    return modified


class _TiffReaderGuardFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if fullname != "large_image_source_tiff.tiff_reader":
            return None
        for finder in sys.meta_path[1:]:
            if hasattr(finder, "find_spec"):
                spec = finder.find_spec(fullname, path, target)
                if spec is not None:
                    return importlib.util.spec_from_loader(fullname, _TiffReaderGuardLoader(spec))
        return None


class _TiffReaderGuardLoader(importlib.abc.Loader):
    def __init__(self, orig_spec):
        self._orig_spec = orig_spec

    def create_module(self, spec):
        return None

    def exec_module(self, module):
        global _GUARD_EXECUTED
        path = Path(self._orig_spec.origin)
        modified = _apply_tiff_reader_patches(path.read_text(), path)
        module.__file__ = str(path)
        module.__package__ = "large_image_source_tiff"
        exec(compile(modified, str(path), "exec"), module.__dict__)
        _GUARD_EXECUTED = True


def install_patchlibtiff_guard() -> None:
    """Register import hook before any large_image_source_tiff.tiff_reader import."""
    global _GUARD_INSTALLED
    if _GUARD_INSTALLED:
        return
    if "large_image_source_tiff.tiff_reader" in sys.modules:
        raise RuntimeError(
            "patchLibtiff guard must be installed before large_image_source_tiff.tiff_reader "
            "is imported"
        )
    sys.meta_path.insert(0, _TiffReaderGuardFinder())
    _GUARD_INSTALLED = True


def is_guard_active() -> bool:
    """True if the import hook ran and exec'd patched tiff_reader source."""
    return _GUARD_EXECUTED


def get_tiff_getfield_argtypes():
    from libtiff import libtiff_ctypes as lc

    return lc.libtiff.TIFFGetField.argtypes
