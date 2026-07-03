#!/usr/bin/env python3
"""DeidTools.preview_metadata with minimal output_dict."""
from __future__ import annotations

import uuid

from repro_common import ensure_deidtools_path, load_svs_path, step_ok, step_start

ensure_deidtools_path()

from DeidTools import DeidTools  # noqa: E402

STEP = "07_deidtools_minimal"


def minimal_output_dict(path: str, add_text: bool = False) -> dict:
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
                "add_text": add_text,
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
    dt = DeidTools()
    out = dt.preview_metadata(minimal_output_dict(path, add_text=False))
    prior_len = len(out[0]) if out and out[0] else 0
    new_len = len(out[1]) if out and len(out) > 1 and out[1] else 0
    step_ok(STEP, prior_len=prior_len, new_len=new_len, path=path)


if __name__ == "__main__":
    main()
