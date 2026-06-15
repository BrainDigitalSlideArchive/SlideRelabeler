#!/usr/bin/env python3
"""tifftools.read_tiff only."""
from __future__ import annotations

import tifftools

from repro_common import load_svs_path, step_ok, step_start

STEP = "01_tifftools_read"


def main() -> None:
    step_start(STEP)
    path = load_svs_path()
    tiffinfo = tifftools.read_tiff(path)
    ifd_count = len(tiffinfo["ifds"])
    step_ok(STEP, ifd_count=ifd_count, path=path)


if __name__ == "__main__":
    main()
