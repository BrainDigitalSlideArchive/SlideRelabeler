#!/usr/bin/env python3
"""Probe TIFFGetField.argtypes before/after large_image tiff_reader import."""
from __future__ import annotations

from repro_common import step_ok, step_start

STEP = "00b_argtypes_probe"


def main() -> None:
    step_start(STEP)

    from libtiff import libtiff_ctypes as lc

    before = lc.libtiff.TIFFGetField.argtypes
    print(f"before_tiff_reader_import={before}")

    import large_image_source_tiff.tiff_reader  # noqa: F401 — triggers patchLibtiff()

    after = lc.libtiff.TIFFGetField.argtypes
    print(f"after_tiff_reader_import={after}")

    if before and len(before) == 2 and after is None:
        print("regression_detected=pylibtiff_189_fix_cleared_by_patchLibtiff")

    step_ok(STEP, before=before, after=after)


if __name__ == "__main__":
    main()
