#!/usr/bin/env python3
"""Test both tiff_reader patches (patchLibtiff + _getJpegTables) with validate=True."""
from __future__ import annotations

import uuid

from patchlibtiff_guard import (
    get_tiff_getfield_argtypes,
    install_patchlibtiff_guard,
    is_guard_active,
)
from repro_common import ensure_deidtools_path, load_svs_path, step_ok, step_start

STEP = "10_patchlibtiff_guard"


def _minimal_output_dict(path: str) -> dict:
    return {
        "config": {
            "filename": {
                "use_uuid": True,
                "use_prefix": False,
                "use_suffix": False,
                "prefix": "",
                "suffix": "",
            },
            "label": {
                "add_text": False,
                "add_icon": False,
                "add_qr": False,
                "text_column_field": {"value": "uuid"},
            },
            "wsi": {"save_macro_image": False},
            "copy": {"enable_copy_mode": False},
        },
        "__reserved": {
            "source": {
                "path": path,
                "filename": path.rsplit("/", 1)[-1],
                "parsed": {"ext": ".svs"},
            },
            "destinationDirectory": None,
            "rename": "test",
            "uuid": str(uuid.uuid4()),
            "processed": 0,
        },
    }


def main() -> None:
    step_start(STEP)
    path = load_svs_path()

    install_patchlibtiff_guard()

    before = get_tiff_getfield_argtypes()
    print(f"before_tiff_reader_import={before}", flush=True)

    import large_image_source_tiff.tiff_reader as tr

    after = get_tiff_getfield_argtypes()
    print(f"after_tiff_reader_import={after}", flush=True)
    print(f"guard_executed={is_guard_active()}", flush=True)

    if not (after and len(after) == 2):
        raise SystemExit("Fix 1 failed: TIFFGetField.argtypes not preserved")

    tr.TiledTiffDirectory(
        filePath=path,
        directoryNum=0,
        mustBeTiled=None,
        validate=True,
    )
    print("TiledTiffDirectory_validate_true_ok", flush=True)

    from large_image_source_tiff import TiffFileTileSource

    src = TiffFileTileSource(path)
    dir_count = len(src._tiffDirectories)
    print(f"TiffFileTileSource_ok dir_count={dir_count}", flush=True)

    ensure_deidtools_path()
    from DeidTools import DeidTools  # noqa: E402

    out = DeidTools().preview_metadata(_minimal_output_dict(path))
    prior_len = len(out[0]) if out and out[0] else 0
    new_len = len(out[1]) if out and len(out) > 1 and out[1] else 0
    print(f"preview_metadata_ok prior_len={prior_len} new_len={new_len}", flush=True)

    step_ok(
        STEP,
        guard_active=is_guard_active(),
        dir_count=dir_count,
        prior_len=prior_len,
        new_len=new_len,
        path=path,
    )


if __name__ == "__main__":
    main()
