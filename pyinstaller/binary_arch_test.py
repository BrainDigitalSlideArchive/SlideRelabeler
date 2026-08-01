#!/usr/bin/env python3
"""Unit tests for pyinstaller/binary_arch.py."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
PYI = ROOT / "pyinstaller"
if str(PYI) not in sys.path:
    sys.path.insert(0, str(PYI))

import binary_arch as ba  # noqa: E402


class BinaryArchTests(unittest.TestCase):
    def test_drop_thin_x86_64_when_want_arm64(self) -> None:
        with mock.patch.object(ba, "_file_report", return_value="Mach-O 64-bit dynamically linked shared library x86_64"):
            with mock.patch.object(ba.os.path, "isfile", return_value=True):
                with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                    self.assertFalse(ba.binary_compatible_with_arch("/tmp/libfoo.dylib", "arm64"))

    def test_keep_thin_arm64(self) -> None:
        with mock.patch.object(ba, "_file_report", return_value="Mach-O 64-bit dynamically linked shared library arm64"):
            with mock.patch.object(ba.os.path, "isfile", return_value=True):
                with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                    self.assertTrue(ba.binary_compatible_with_arch("/tmp/libfoo.dylib", "arm64"))

    def test_keep_universal_with_arm64(self) -> None:
        report = "Mach-O universal binary with 2 architectures: [x86_64:...] [arm64:...]"
        with mock.patch.object(ba, "_file_report", return_value=report):
            with mock.patch.object(ba.os.path, "isfile", return_value=True):
                with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                    self.assertTrue(ba.binary_compatible_with_arch("/tmp/libfoo.dylib", "arm64"))

    def test_filter_replaces_usr_local_from_conda_only(self) -> None:
        entries = [
            ("liba.dylib", "/usr/local/lib/liba.dylib", "BINARY"),
            ("libb.dylib", "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib", "BINARY"),
        ]
        with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
            with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                with mock.patch.object(
                    ba,
                    "find_arch_compatible_replacement",
                    side_effect=lambda src, arch: "/Users/me/miniconda/envs/sliderelabeler/lib/liba.dylib"
                    if "liba" in src
                    else None,
                ):
                    kept = ba.filter_binaries(entries, arch="arm64")
        self.assertEqual(len(kept), 2)
        self.assertEqual(kept[0][1], "/Users/me/miniconda/envs/sliderelabeler/lib/liba.dylib")
        self.assertEqual(kept[1][1], "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib")

    def test_filter_drops_opt_homebrew_without_conda_replacement(self) -> None:
        entries = [
            ("liba.dylib", "/opt/homebrew/lib/liba.dylib", "BINARY"),
            ("libb.dylib", "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib", "BINARY"),
        ]
        with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
            with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                with mock.patch.object(ba, "find_arch_compatible_replacement", return_value=None):
                    kept = ba.filter_binaries(entries, arch="arm64")
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0][1], "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib")

    def test_filter_keeps_conda_libiconv(self) -> None:
        entries = [
            ("libiconv.2.dylib", "/Users/me/miniconda/envs/sliderelabeler/lib/libiconv.2.dylib", "BINARY"),
            ("libb.dylib", "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib", "BINARY"),
        ]
        with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
            with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                kept = ba.filter_binaries(entries, arch="arm64")
        self.assertEqual(len(kept), 2)
        self.assertEqual(kept[0][1], "/Users/me/miniconda/envs/sliderelabeler/lib/libiconv.2.dylib")

    def test_filter_drops_homebrew_libiconv_without_conda_match(self) -> None:
        entries = [
            ("libiconv.2.dylib", "/opt/homebrew/opt/libiconv/lib/libiconv.2.dylib", "BINARY"),
        ]
        with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
            with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                with mock.patch.object(ba, "find_arch_compatible_replacement", return_value=None):
                    kept = ba.filter_binaries(entries, arch="arm64")
        self.assertEqual(kept, [])

    def test_filter_drops_openslide_bin_without_conda(self) -> None:
        entries = [
            (
                "libopenslide.1.dylib",
                "/Users/me/miniconda/envs/sliderelabeler/lib/python3.12/site-packages/openslide_bin/libopenslide.1.dylib",
                "BINARY",
            ),
            ("libb.dylib", "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib", "BINARY"),
        ]
        with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
            with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                with mock.patch.object(ba, "find_arch_compatible_replacement", return_value=None):
                    kept = ba.filter_binaries(entries, arch="arm64")
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0][1], "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib")

    def test_filter_drops_libvips_abi3(self) -> None:
        entries = [
            (
                "_libvips.abi3.so",
                "/Users/me/miniconda/envs/sliderelabeler/lib/python3.12/site-packages/_libvips.abi3.so",
                "BINARY",
            ),
            ("libb.dylib", "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib", "BINARY"),
        ]
        with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
            with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
                kept = ba.filter_binaries(entries, arch="arm64")
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0][1], "/Users/me/miniconda/envs/sliderelabeler/lib/libb.dylib")

    def test_assert_no_foreign_host_binaries_raises(self) -> None:
        entries = [("liba.dylib", "/opt/homebrew/lib/liba.dylib", "BINARY")]
        with mock.patch.object(ba.os.path, "realpath", side_effect=lambda p: p):
            with self.assertRaises(RuntimeError):
                ba.assert_no_foreign_host_binaries(entries, context="test")

    def test_replacement_search_roots_conda_only(self) -> None:
        with mock.patch.dict(ba.os.environ, {"CONDA_PREFIX": "/tmp/conda-env"}, clear=False):
            roots = ba.replacement_search_roots()
        self.assertEqual(roots, ["/tmp/conda-env/lib"])
        self.assertTrue(all("homebrew" not in r for r in roots))

    def test_conda_binary_entries_skips_missing_and_iconv(self) -> None:
        with mock.patch.dict(ba.os.environ, {"CONDA_PREFIX": "/tmp/conda-env"}, clear=False):
            with mock.patch.object(ba.os.path, "isfile", side_effect=lambda p: p.endswith("libvips.42.dylib")):
                entries = ba.conda_binary_entries(["libvips.42.dylib", "libiconv.2.dylib", "nope.dylib"])
        self.assertEqual(entries, [("/tmp/conda-env/lib/libvips.42.dylib", ".")])

    def test_override_binaries_from_conda(self) -> None:
        entries = [
            ("libharfbuzz.0.dylib", "/tmp/PIL/.dylibs/libharfbuzz.0.dylib", "BINARY"),
            ("other.dylib", "/tmp/other.dylib", "BINARY"),
        ]
        with mock.patch.dict(ba.os.environ, {"CONDA_PREFIX": "/tmp/conda-env"}, clear=False):
            with mock.patch.object(
                ba.os.path,
                "isfile",
                side_effect=lambda p: p == "/tmp/conda-env/lib/libharfbuzz.0.dylib",
            ):
                with mock.patch.object(ba, "binary_compatible_with_arch", return_value=True):
                    kept = ba.override_binaries_from_conda(entries, basenames=["libharfbuzz.0.dylib"])
        self.assertEqual(kept[0][1], "/tmp/conda-env/lib/libharfbuzz.0.dylib")
        self.assertEqual(kept[1][1], "/tmp/other.dylib")


if __name__ == "__main__":
    unittest.main()
