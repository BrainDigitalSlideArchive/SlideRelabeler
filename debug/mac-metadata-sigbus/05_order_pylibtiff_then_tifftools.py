#!/usr/bin/env python3
"""TiledTiffDirectory then tifftools.read_tiff (reverse order)."""
from __future__ import annotations

import tifftools
from large_image_source_tiff.tiff_reader import TiledTiffDirectory

from repro_common import load_svs_path, step_ok, step_start

STEP = "05_order_pylibtiff_then_tifftools"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    TiledTiffDirectory(filePath=path, directoryNum=0, mustBeTiled=None, validate=True)
    tiffinfo = tifftools.read_tiff(path)
    step_ok(STEP, ifd_count=len(tiffinfo["ifds"]), path=path)


if __name__ == "__main__":
    main()
