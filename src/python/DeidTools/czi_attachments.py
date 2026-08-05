"""Associated images from Zeiss CZI attachments via czifile (not OpenSlide)."""

from __future__ import annotations

import io
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image

# OpenSlide-style names the Viewer / label:// macro:// thumbnail:// protocols expect.
ATTACHMENT_NAME_MAP: Dict[str, str] = {
    'Label': 'label',
    'SlidePreview': 'macro',
    'Thumbnail': 'thumbnail',
}

# Reverse lookup (UI name → CZI attachment name). First match wins if duplicates.
UI_TO_ATTACHMENT: Dict[str, str] = {v: k for k, v in ATTACHMENT_NAME_MAP.items()}


def map_attachment_name(czi_name: str) -> Optional[str]:
    """Map a CZI attachment name to the UI / OpenSlide associated-image name."""
    if not czi_name:
        return None
    return ATTACHMENT_NAME_MAP.get(czi_name) or ATTACHMENT_NAME_MAP.get(str(czi_name).strip())


def list_associated_image_names(path: str) -> List[str]:
    """Return OpenSlide-style associated image names present on the file."""
    from czifile import CziFile

    names: List[str] = []
    seen = set()
    with CziFile(path) as czi:
        for attachment in czi.attachments():
            ui_name = map_attachment_name(attachment.attachment_entry.name)
            if ui_name and ui_name not in seen:
                seen.add(ui_name)
                names.append(ui_name)
    return names


def _ndarray_to_image_bytes(arr: np.ndarray, bgr: bool = False) -> Tuple[bytes, str]:
    """Encode an attachment ndarray as JPEG (or PNG if needed)."""
    arr = np.squeeze(arr)
    # Nested CZI attachments commonly include singleton S/T/C/Z dimensions.
    # Keep the first plane until only image dimensions remain.
    while arr.ndim > 3:
        arr = arr[0]
    if arr.ndim == 2:
        mode = 'L'
        data = arr
    elif arr.ndim == 3 and arr.shape[2] >= 3:
        data = arr[:, :, :3]
        if bgr:
            data = data[:, :, ::-1]
        mode = 'RGB'
    else:
        raise ValueError(f'Unsupported attachment array shape: {arr.shape}')

    if data.dtype != np.uint8:
        info = np.iinfo(data.dtype) if np.issubdtype(data.dtype, np.integer) else None
        if info is not None and info.max > 255:
            data = (data.astype(np.float32) * (255.0 / info.max)).astype(np.uint8)
        else:
            data = np.clip(data, 0, 255).astype(np.uint8)

    img = Image.fromarray(data, mode=mode)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=90)
    return buf.getvalue(), 'image/jpeg'


def _encode_attachment_payload(payload, bgr: bool = False) -> Tuple[bytes, str]:
    if isinstance(payload, (bytes, bytearray, memoryview)):
        raw = bytes(payload)
        # JPEG magic
        if raw[:2] == b'\xff\xd8':
            return raw, 'image/jpeg'
        # Try decode as image bytes via PIL
        try:
            img = Image.open(io.BytesIO(raw))
            img = img.convert('RGB')
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=90)
            return buf.getvalue(), 'image/jpeg'
        except Exception as exc:
            raise ValueError('Attachment bytes are not a decodable image') from exc

    if isinstance(payload, np.ndarray):
        return _ndarray_to_image_bytes(payload, bgr=bgr)

    # Nested CziFile from older/alternate decode paths
    if hasattr(payload, 'asarray'):
        arr = payload.asarray()
        if hasattr(payload, 'close'):
            try:
                payload.close()
            except Exception:
                pass
        return _ndarray_to_image_bytes(np.asarray(arr), bgr=bgr)

    raise ValueError(f'Unsupported attachment payload type: {type(payload)!r}')


def get_associated_image_bytes(path: str, ui_name: str) -> Optional[Tuple[bytes, str]]:
    """
    Load an associated image by OpenSlide-style name.

    Returns (bytes, mime) or None if not found.
    """
    from czifile import CziFile

    target = (ui_name or '').lower().strip()
    wanted_czi = UI_TO_ATTACHMENT.get(target)
    if not wanted_czi:
        return None

    with CziFile(path) as czi:
        for attachment in czi.attachments():
            entry = attachment.attachment_entry
            if entry.name != wanted_czi:
                continue
            # Prefer raw JPEG for Thumbnail; otherwise decoded content (ndarray / nested).
            content_type = str(getattr(entry.content_file_type, 'value', entry.content_file_type) or '')
            if content_type.upper() == 'JPG' or wanted_czi == 'Thumbnail':
                try:
                    raw = attachment.data(raw=True)
                    if isinstance(raw, (bytes, bytearray, memoryview)) and bytes(raw)[:2] == b'\xff\xd8':
                        return bytes(raw), 'image/jpeg'
                except Exception:
                    pass
            payload = attachment.data(raw=False)
            return _encode_attachment_payload(
                payload,
                bgr=content_type.upper() in {'CZI', 'ZISRAW'},
            )

    return None
