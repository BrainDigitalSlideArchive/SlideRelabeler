"""Write / replace CZI Label and SlidePreview attachments.

Nested CZI blobs are authored with pylibCZIrw; injection uses the app-local
libCZI binding ``sliderelabeler_czi_rw`` (ReplaceAttachment / SyncAddAttachment).
"""

from __future__ import annotations

import os
import tempfile
from typing import Any, List, Optional

import numpy as np

from .czi_attachments import UI_TO_ATTACHMENT


def _pil_to_rgb_array(image) -> np.ndarray:
    """Return HxWx3 uint8 RGB array from a PIL image."""
    from PIL import Image

    if not isinstance(image, Image.Image):
        raise TypeError(f'Expected PIL Image, got {type(image)!r}')
    rgb = image.convert('RGB')
    return np.asarray(rgb, dtype=np.uint8)


def encode_image_as_nested_czi_bytes(image) -> bytes:
    """
    Encode a PIL image as a standalone nested CZI document (bytes).

    Label / SlidePreview attachments are typically nested CZI blobs.
    """
    from pylibCZIrw import czi as pyczi

    arr = _pil_to_rgb_array(image)
    # pylibCZIrw RGB write expects shape (m, n, 3).
    fd, path = tempfile.mkstemp(suffix='.czi')
    os.close(fd)
    try:
        with pyczi.create_czi(path, exist_ok=True) as writer:
            writer.write(arr)
            writer.write_metadata(document_name='Attachment')
        with open(path, 'rb') as handle:
            return handle.read()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _native_replace_or_add_attachments(path: str, items: List[dict]) -> None:
    try:
        from sliderelabeler_czi_rw import replace_or_add_attachments
    except ImportError as exc:
        raise RuntimeError(
            'Native module sliderelabeler_czi_rw is required to replace CZI '
            'attachments. Build native/czi_rw (pip install ./native/czi_rw) '
            'into the sliderelabeler conda env.'
        ) from exc
    replace_or_add_attachments(path, items)


def list_czi_attachment_names_via_czifile(path: str) -> List[str]:
    """Return attachment names using czifile (raises if ATTDIR is corrupt)."""
    from czifile import CziFile

    names: List[str] = []
    with CziFile(path) as czi:
        for attachment in czi.attachments():
            names.append(attachment.attachment_entry.name)
    return names


def verify_czi_attachments_intact(
    path: str,
    required_names: Optional[List[str]] = None,
    expected_present: Optional[List[str]] = None,
) -> None:
    """
    Fail loudly if the attachment directory is unreadable or names were dropped.

    ``required_names`` must all still appear (typically the pre-write snapshot).
    ``expected_present`` must appear (e.g. Label / SlidePreview we just wrote).
    """
    try:
        names = list_czi_attachment_names_via_czifile(path)
    except Exception as exc:
        raise RuntimeError(
            f'CZI attachment directory is unreadable after write: {path} ({exc})'
        ) from exc

    name_set = set(names)
    missing_required = [
        n for n in (required_names or []) if n not in name_set
    ]
    missing_expected = [
        n for n in (expected_present or []) if n not in name_set
    ]
    if missing_required or missing_expected:
        raise RuntimeError(
            'CZI attachment integrity check failed for {}: '
            'missing_required={!r} missing_expected={!r} present={!r}'.format(
                path, missing_required, missing_expected, names
            )
        )


def replace_label_and_macro_attachments(
    czi_path: str,
    label_image: Optional[Any] = None,
    macro_image: Optional[Any] = None,
) -> None:
    """
    Replace Label and/or SlidePreview attachments on an existing CZI file.

    Missing attachments are added. Pass None to leave that attachment unchanged.
    Both replacements share one libCZI open/close so ATTDIR is rewritten once.
    """
    if label_image is None and macro_image is None:
        return

    items: List[dict] = []
    mapping = [
        ('label', label_image),
        ('macro', macro_image),
    ]
    for ui_name, image in mapping:
        if image is None:
            continue
        czi_name = UI_TO_ATTACHMENT.get(ui_name)
        if not czi_name:
            continue
        items.append({
            'name': czi_name,
            'content_file_type': 'CZI',
            'data': encode_image_as_nested_czi_bytes(image),
        })
    if items:
        _native_replace_or_add_attachments(czi_path, items)
