#!/usr/bin/env python3
"""Unit tests for patch_libtiff_platform auto-detect."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from patch_libtiff_platform import patch_libtiff_mode, should_patch_libtiff  # noqa: E402


class PatchLibtiffPlatformTest(unittest.TestCase):
    def test_forced_on_any_platform(self) -> None:
        self.assertTrue(should_patch_libtiff("1", system="Windows", machine="AMD64"))
        self.assertEqual(patch_libtiff_mode("1", system="Windows", machine="AMD64"), "forced")

    def test_forced_off_darwin_arm64(self) -> None:
        self.assertFalse(should_patch_libtiff("0", system="Darwin", machine="arm64"))
        self.assertIsNone(patch_libtiff_mode("0", system="Darwin", machine="arm64"))

    def test_auto_darwin_arm64(self) -> None:
        self.assertTrue(should_patch_libtiff("", system="Darwin", machine="arm64"))
        self.assertTrue(should_patch_libtiff("", system="Darwin", machine="aarch64"))
        self.assertEqual(patch_libtiff_mode("", system="Darwin", machine="arm64"), "auto")

    def test_no_auto_windows(self) -> None:
        self.assertFalse(should_patch_libtiff("", system="Windows", machine="AMD64"))
        self.assertFalse(should_patch_libtiff("", system="Windows", machine="x86_64"))

    def test_no_auto_darwin_intel(self) -> None:
        self.assertFalse(should_patch_libtiff("", system="Darwin", machine="x86_64"))

    def test_no_auto_linux_arm64_without_env(self) -> None:
        self.assertFalse(should_patch_libtiff("", system="Linux", machine="aarch64"))


if __name__ == "__main__":
    unittest.main()
