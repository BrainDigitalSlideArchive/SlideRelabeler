#!/usr/bin/env python3
"""Call redact_format_aperio(..., preview_metadata=True) after setup_deid."""
from __future__ import annotations

import uuid

from repro_common import ensure_deidtools_path, load_svs_path, step_ok, step_start

ensure_deidtools_path()

from DeidTools import DeidTools  # noqa: E402

STEP = "08_deidtools_redact_only"


def minimal_output_dict(path: str) -> dict:
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
    dt = DeidTools()
    output_dict = minimal_output_dict(path)
    curItem, output_dir, tileSource, redactList, newTitle, labelImage, macroImage, func = dt.setup_deid(
        output_dict
    )
    prior_ifds, new_ifds = func(
        curItem, output_dir, redactList, newTitle, labelImage, macroImage, preview_metadata=True
    )
    step_ok(STEP, prior_len=len(prior_ifds), new_len=len(new_ifds), path=path)


if __name__ == "__main__":
    main()
