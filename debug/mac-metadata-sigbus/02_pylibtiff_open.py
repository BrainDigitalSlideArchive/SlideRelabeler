#!/usr/bin/env python3
"""TiledTiffDirectory via large_image (patchLibtiff already applied)."""
from __future__ import annotations

from large_image_source_tiff.tiff_reader import TiledTiffDirectory

from repro_common import load_svs_path, step_ok, step_start

STEP = "02_pylibtiff_open"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    TiledTiffDirectory(filePath=path, directoryNum=0, mustBeTiled=None, validate=True)
    step_ok(STEP, path=path)


if __name__ == "__main__":
    main()
