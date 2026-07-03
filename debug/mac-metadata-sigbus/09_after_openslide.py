#!/usr/bin/env python3
"""OpenSlide/large_image tileSource then TiledTiffDirectory (DeidTools-like order)."""
from __future__ import annotations

import large_image
from large_image_source_tiff.tiff_reader import TiledTiffDirectory

from repro_common import load_svs_path, step_ok, step_start

STEP = "09_after_openslide"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    ts = large_image.open(path)
    assoc = ts.getAssociatedImagesList()
    print(f"associated_images={assoc}")
    TiledTiffDirectory(filePath=path, directoryNum=0, mustBeTiled=None, validate=True)
    step_ok(STEP, path=path)


if __name__ == "__main__":
    main()
