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
_MODULE_NAME = "large_image_source_tiff.tiff_reader"


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


def resolve_tiff_reader_source(orig_spec) -> tuple[str | None, str]:
    """
    Load tiff_reader source text without assuming a real filesystem path.

    Returns (source_or_None, filename_for_compile).
    """
    origin = getattr(orig_spec, "origin", None) or "tiff_reader.py"
    filename = str(origin)

    if origin and origin not in {"<unknown>", "frozen"}:
        path = Path(origin)
        try:
            if path.is_file():
                return path.read_text(encoding="utf-8"), filename
        except OSError:
            pass

    loader = getattr(orig_spec, "loader", None)
    mod_name = getattr(orig_spec, "name", None) or _MODULE_NAME

    if loader is not None and hasattr(loader, "get_source"):
        try:
            source = loader.get_source(mod_name)
            if source:
                return source, filename
        except Exception:
            pass

    if loader is not None and hasattr(loader, "get_data") and origin:
        try:
            data = loader.get_data(origin)
            if data:
                if isinstance(data, bytes):
                    return data.decode("utf-8"), filename
                return str(data), filename
        except Exception:
            pass

    return None, filename


def _exec_original_loader(orig_spec, module) -> None:
    loader = getattr(orig_spec, "loader", None)
    if loader is not None and hasattr(loader, "exec_module"):
        loader.exec_module(module)
        return
    raise ImportError(
        f"libtiff_guard: cannot load {_MODULE_NAME}; no source and no original loader"
    )


class _TiffReaderGuardFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if fullname != _MODULE_NAME:
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
        source, filename = resolve_tiff_reader_source(self._orig_spec)
        if source is None:
            print(
                "[libtiff_guard] could not read tiff_reader source "
                f"(origin={filename!r}); loading unpatched module",
                file=sys.stderr,
                flush=True,
            )
            _exec_original_loader(self._orig_spec, module)
            return

        try:
            modified = _apply_tiff_reader_patches(source, Path(filename))
        except RuntimeError as err:
            print(
                f"[libtiff_guard] patch skipped: {err}; loading unpatched module",
                file=sys.stderr,
                flush=True,
            )
            _exec_original_loader(self._orig_spec, module)
            return

        module.__file__ = filename
        module.__package__ = "large_image_source_tiff"
        exec(compile(modified, filename, "exec"), module.__dict__)
        _GUARD_EXECUTED = True


def install_patchlibtiff_guard() -> None:
    """Register import hook before any large_image_source_tiff.tiff_reader import."""
    global _GUARD_INSTALLED
    if _GUARD_INSTALLED:
        return
    if _MODULE_NAME in sys.modules:
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
