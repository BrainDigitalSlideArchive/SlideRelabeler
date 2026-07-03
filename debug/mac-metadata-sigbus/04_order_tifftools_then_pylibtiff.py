#!/usr/bin/env python3
"""tifftools.read_tiff then TiledTiffDirectory (DeidTools order)."""
from __future__ import annotations

import tifftools
from large_image_source_tiff.tiff_reader import TiledTiffDirectory

from repro_common import load_svs_path, step_ok, step_start

STEP = "04_order_tifftools_then_pylibtiff"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    tiffinfo = tifftools.read_tiff(path)
    print(f"tifftools_ifds={len(tiffinfo['ifds'])}")
    TiledTiffDirectory(filePath=path, directoryNum=0, mustBeTiled=None, validate=True)
    step_ok(STEP, path=path)


if __name__ == "__main__":
    main()
