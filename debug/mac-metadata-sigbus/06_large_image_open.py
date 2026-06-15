#!/usr/bin/env python3
"""large_image.open (OpenSlide/GDAL path) — usually works when TiffFileTileSource fails."""
from __future__ import annotations

import large_image

from repro_common import load_svs_path, step_ok, step_start

STEP = "06_large_image_open"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    ts = large_image.open(path)
    meta = ts.getMetadata()
    print(f"metadata_keys={len(meta) if isinstance(meta, dict) else 'n/a'}")
    step_ok(STEP, path=path)


if __name__ == "__main__":
    main()
