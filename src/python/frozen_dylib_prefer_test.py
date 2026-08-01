#!/usr/bin/env python3
"""Unit tests for frozen_dylib_prefer."""
from __future__ import annotations

import ctypes.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import frozen_dylib_prefer as fdp  # noqa: E402


class FrozenDylibPreferTests(unittest.TestCase):
    def tearDown(self) -> None:
        fdp.reset_for_tests()

    def test_resolve_bundled_library_finds_libtiff(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "libtiff.dylib").write_bytes(b"fake")
            path = fdp.resolve_bundled_library("tiff", root=str(root))
            self.assertEqual(path, str(root / "libtiff.dylib"))

    def test_prefer_patches_find_library(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = root / "libtiff.dylib"
            target.write_bytes(b"fake")
            (root / "libvips.42.dylib").write_bytes(b"fake")
            original = ctypes.util.find_library
            try:
                with mock.patch.object(fdp, "_preload", lambda path: None):
                    mapping = fdp.prefer_bundled_dylibs(root=str(root), preload=True)
                self.assertEqual(mapping.get("tiff"), str(target))
                self.assertEqual(ctypes.util.find_library("tiff"), str(target))
                self.assertEqual(
                    ctypes.util.find_library("libvips.42.dylib"),
                    str(root / "libvips.42.dylib"),
                )
            finally:
                ctypes.util.find_library = original
                fdp.reset_for_tests()

    def test_noop_when_not_frozen_and_no_root(self) -> None:
        with mock.patch.object(fdp, "is_frozen", return_value=False):
            self.assertEqual(fdp.prefer_bundled_dylibs(), {})


if __name__ == "__main__":
    unittest.main()
