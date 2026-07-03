#!/usr/bin/env python3
"""Unit tests for libtiff_guard patch application (no large_image install required)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from libtiff_guard import apply_tiff_reader_patches  # noqa: E402

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


if __name__ == "__main__":
    unittest.main()
