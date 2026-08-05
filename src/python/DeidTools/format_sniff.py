"""Detect the vendor format of a slide from file content, not its extension.

``determine_format`` reads metadata from an opened tile source, so it only sees a
vendor when large_image happened to pick the matching reader.  A file extension
drives that choice (``.tiff`` prefers the plain tiff reader over OpenSlide), so a
vendor slide with an unexpected extension looks like an unknown format.  These
helpers read the TIFF header directly and answer the same question.
"""

from __future__ import annotations

import os
from typing import Optional

import tifftools

# Formats with a redact_format_<name> handler in DeidTools.
SUPPORTED_DEID_FORMATS = frozenset(
    {'aperio', 'hamamatsu', 'philips', 'ometiff', 'czi'}
)

# Readers worth retrying when the sniff finds a vendor the opened reader missed.
# Redaction plans read reader-specific metadata (``metadata['openslide']``,
# ``metadata['omeinfo']``), so the format is only usable with a matching reader.
# Philips and CZI are absent on purpose: the readers that serve them are already
# chosen by the tiff reader and the CZI branch respectively.
READER_CANDIDATES_FOR_FORMAT = {
    'aperio': ('openslide',),
    'hamamatsu': ('openslide',),
    'ometiff': ('ometiff',),
}

_CZI_MAGIC = b'ZISRAWFILE'

# Hamamatsu NDPI private tags (NDPI_FORMAT_FLAG / NDPI_SOURCELENS).
_NDPI_TAGS = (65420, 65421)


def _tag_text(tags, tag) -> str:
    data = (tags.get(tag.value) or {}).get('data')
    if data is None:
        return ''
    if isinstance(data, bytes):
        try:
            return data.decode('utf8', 'replace')
        except Exception:
            return ''
    return str(data)


def is_czi_file(path: Optional[str]) -> bool:
    """CZI by extension, or by the ZISRAW segment header when renamed."""
    if not path:
        return False
    if str(path).lower().endswith('.czi'):
        return True
    try:
        with open(path, 'rb') as handle:
            return handle.read(len(_CZI_MAGIC)) == _CZI_MAGIC
    except Exception:
        return False


def sniff_wsi_format(path: Optional[str]) -> Optional[str]:
    """
    Vendor format from file content, or None when nothing identifies it.

    Reads TIFF directory headers only — no tiles and no tile source, so this is
    safe and cheap enough for name prediction and file-list validation.
    """
    if not path or not os.path.isfile(path):
        return None

    if is_czi_file(path):
        return 'czi'

    try:
        ifds = tifftools.read_tiff(path)['ifds']
    except Exception:
        return None
    if not ifds:
        return None

    tags = ifds[0].get('tags') or {}
    description = _tag_text(tags, tifftools.Tag.ImageDescription)
    make = _tag_text(tags, tifftools.Tag.Make).strip().lower()
    software = _tag_text(tags, tifftools.Tag.Software)

    if description.startswith('Aperio') or 'Aperio Image Library' in description:
        return 'aperio'
    if make == 'hamamatsu' or any(tag in tags for tag in _NDPI_TAGS):
        return 'hamamatsu'
    if 'PIM_DP_' in description or 'PIIM_DP_' in description or make == 'philips':
        return 'philips'
    if make == 'zeiss':
        return 'czi'
    if '<OME' in description:
        return 'ometiff'
    if 'philips' in software.lower():
        return 'philips'
    return None


def is_supported_deid_format(format_name: Optional[str]) -> bool:
    return format_name in SUPPORTED_DEID_FORMATS
