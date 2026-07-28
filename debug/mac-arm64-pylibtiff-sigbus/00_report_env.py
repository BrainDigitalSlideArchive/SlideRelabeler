#!/usr/bin/env python3
"""Report Python and library versions (no slide required)."""
from __future__ import annotations

import importlib.metadata
import platform
import sys

from repro_common import step_ok, step_start

STEP = "00_report_env"


def pkg_version(name: str) -> str:
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return "NOT INSTALLED"


def main() -> None:
    step_start(STEP)
    print(f"python={sys.version.split()[0]} platform={platform.platform()} machine={platform.machine()}")

    for pkg in ("pylibtiff", "large-image", "large-image-source-tiff", "tifftools", "openslide-python"):
        print(f"{pkg}={pkg_version(pkg)}")

    try:
        import tifftools
        print(f"tifftools_file={tifftools.__file__}")
    except ImportError as exc:
        print(f"tifftools_import_error={exc}")

    try:
        import large_image_source_tiff
        print(f"large_image_source_tiff_file={large_image_source_tiff.__file__}")
    except ImportError as exc:
        print(f"large_image_source_tiff_import_error={exc}")

    try:
        from libtiff import libtiff_ctypes as lc
        print(f"libtiff_ctypes_file={lc.__file__}")
        print(f"TIFFGetField_argtypes_before_tiff_reader={lc.libtiff.TIFFGetField.argtypes}")
    except ImportError as exc:
        print(f"libtiff_import_error={exc}")

    step_ok(STEP)


if __name__ == "__main__":
    main()
