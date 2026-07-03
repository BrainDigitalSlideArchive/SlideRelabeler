#!/usr/bin/env python3
"""TiffFileTileSource constructor."""
from __future__ import annotations

from large_image_source_tiff import TiffFileTileSource

from repro_common import load_svs_path, step_ok, step_start

STEP = "03_tiff_file_tile_source"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    src = TiffFileTileSource(path)
    dir_count = len(src._tiffDirectories)
    step_ok(STEP, tiff_directories=dir_count, path=path)


if __name__ == "__main__":
    main()
