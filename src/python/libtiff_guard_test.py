#!/usr/bin/env python3
"""Unit tests for libtiff_guard patch application (no large_image install required)."""
from __future__ import annotations

import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from libtiff_guard import (  # noqa: E402
    apply_tiff_reader_patches,
    resolve_tiff_reader_source,
)

SAMPLE_SOURCE = """
def patchLibtiff():
    libtiff_ctypes.libtiff.TIFFGetField.argtypes = None

def _getJpegTables(self):
        if libtiff_ctypes.libtiff.TIFFGetField.argtypes:
            libtiff_ctypes.libtiff.TIFFGetField.argtypes = \\
                libtiff_ctypes.libtiff.TIFFGetField.argtypes[:2] + \\
                [ctypes.POINTER(ctypes.c_uint32), ctypes.POINTER(ctypes.c_void_p)]
        if libtiff_ctypes.libtiff.TIFFGetField(
            self._tiffFile, tag, a, b) != 1:
            pass

def _getJpegFrameSize(self):
        if libtiff_ctypes.libtiff.TIFFGetField.argtypes:
            libtiff_ctypes.libtiff.TIFFGetField.argtypes = \\
                libtiff_ctypes.libtiff.TIFFGetField.argtypes[:2] + \\
                [ctypes.POINTER(ctypes.POINTER(rawTileSizesType))]
        if libtiff_ctypes.libtiff.TIFFGetField(
            self._tiffFile, tag, raw) != 1:
            pass
"""


class LibtiffGuardPatchTest(unittest.TestCase):
    def test_apply_removes_all_three_argtypes_extensions(self) -> None:
        patched = apply_tiff_reader_patches(SAMPLE_SOURCE, "mock.py")
        self.assertIn("_existing = libtiff_ctypes", patched)
        self.assertNotIn("argtypes[:2] +", patched)
        self.assertEqual(patched.count("if libtiff_ctypes.libtiff.TIFFGetField("), 2)

    def test_resolve_from_real_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "tiff_reader.py"
            path.write_text(SAMPLE_SOURCE, encoding="utf-8")
            spec = types.SimpleNamespace(
                origin=str(path),
                loader=None,
                name="large_image_source_tiff.tiff_reader",
            )
            source, filename = resolve_tiff_reader_source(spec)
            self.assertEqual(source, SAMPLE_SOURCE)
            self.assertEqual(filename, str(path))

    def test_resolve_from_loader_get_source_when_file_missing(self) -> None:
        loader = mock.Mock()
        loader.get_source.return_value = SAMPLE_SOURCE
        missing = "/nonexistent/_internal/large_image_source_tiff/tiff_reader.py"
        spec = types.SimpleNamespace(
            origin=missing,
            loader=loader,
            name="large_image_source_tiff.tiff_reader",
        )
        source, filename = resolve_tiff_reader_source(spec)
        self.assertEqual(source, SAMPLE_SOURCE)
        self.assertEqual(filename, missing)
        loader.get_source.assert_called_once()

    def test_resolve_returns_none_when_unavailable(self) -> None:
        loader = mock.Mock()
        loader.get_source.side_effect = OSError("no source")
        loader.get_data.side_effect = OSError("no data")
        missing = "/nonexistent/_internal/large_image_source_tiff/tiff_reader.py"
        spec = types.SimpleNamespace(
            origin=missing,
            loader=loader,
            name="large_image_source_tiff.tiff_reader",
        )
        source, filename = resolve_tiff_reader_source(spec)
        self.assertIsNone(source)
        self.assertEqual(filename, missing)


if __name__ == "__main__":
    unittest.main()
