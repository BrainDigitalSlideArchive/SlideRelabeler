"""Smoke tests for CZI nested-attachment encode + libCZI replace."""

from __future__ import annotations

import os
import struct

import pytest
from PIL import Image

from src.python.DeidTools.czi_attachment_write import (
    encode_image_as_nested_czi_bytes,
    list_czi_attachment_names_via_czifile,
    replace_label_and_macro_attachments,
    verify_czi_attachments_intact,
)


pytest.importorskip('pylibCZIrw')
pytest.importorskip('sliderelabeler_czi_rw')
pytest.importorskip('czifile')


def test_encode_image_as_nested_czi_bytes_nonempty():
    img = Image.new('RGB', (32, 24), color=(200, 10, 10))
    blob = encode_image_as_nested_czi_bytes(img)
    assert isinstance(blob, (bytes, bytearray))
    assert len(blob) > 100
    # ZISRAW files start with a ZISRAWFILE directory segment magic near the start.
    assert b'ZISRAW' in blob[:256] or blob[:2] == b'ZI'


def _read_file_header_positions(path: str):
    with open(path, 'rb') as handle:
        handle.seek(32)
        data = handle.read(80)
    (
        _major,
        _minor,
        _r1,
        _r2,
        _pguid,
        _fguid,
        _fpart,
        directory_position,
        metadata_position,
        _update_pending,
        attachment_directory_position,
    ) = struct.unpack('<iiii16s16siqqiq', data)
    return metadata_position, directory_position, attachment_directory_position


def _read_attdir_sizes(path: str, attdir_pos: int):
    with open(path, 'rb') as handle:
        handle.seek(attdir_pos)
        sid, allocated, used = struct.unpack('<16sqq', handle.read(32))
    return sid.rstrip(b'\x00'), allocated, used


def enlarge_attdir_allocation(path: str, new_allocated: int = 10016) -> None:
    """
    Grow a trailing ZISRAWATTDIR segment's AllocatedSize (and pad with zeroes).

    This recreates the Zeiss-style oversized ATTDIR reservation that triggers
    libCZI's reuse+zero-pad path on ReplaceAttachment.
    """
    _meta, _directory, attdir_pos = _read_file_header_positions(path)
    assert attdir_pos > 0, 'CZI has no attachment directory'
    sid, allocated, used = _read_attdir_sizes(path, attdir_pos)
    assert sid == b'ZISRAWATTDIR', sid
    if allocated >= new_allocated:
        return
    end = attdir_pos + 32 + allocated
    size = os.path.getsize(path)
    assert size == end, (
        f'ATTDIR must be the last segment to enlarge in-place '
        f'(size={size} expected_end={end})'
    )
    with open(path, 'r+b') as handle:
        handle.seek(0, os.SEEK_END)
        handle.write(b'\x00' * (new_allocated - allocated))
        handle.seek(attdir_pos + 16)
        handle.write(struct.pack('<q', new_allocated))
    sid, allocated, used = _read_attdir_sizes(path, attdir_pos)
    assert allocated == new_allocated
    assert used <= allocated


def _build_czi_with_attachments(path: str) -> list[str]:
    from pylibCZIrw import czi as pyczi
    from sliderelabeler_czi_rw import replace_or_add_attachment
    import numpy as np

    arr = np.zeros((16, 16, 3), dtype=np.uint8)
    arr[:] = (0, 128, 255)
    with pyczi.create_czi(path, exist_ok=True) as writer:
        writer.write(arr)
        writer.write_metadata(document_name='Base')

    label = Image.new('RGB', (40, 20), color=(255, 255, 0))
    macro = Image.new('RGB', (40, 20), color=(0, 0, 0))
    replace_label_and_macro_attachments(path, label, macro)
    replace_or_add_attachment(
        path,
        'Thumbnail',
        'JPG',
        b'\xff\xd8' + b'\x00' * 200 + b'\xff\xd9',
    )
    replace_or_add_attachment(
        path,
        'Profile',
        'CZI',
        encode_image_as_nested_czi_bytes(Image.new('RGB', (8, 8), (9, 9, 9))),
    )
    names = list_czi_attachment_names_via_czifile(path)
    assert set(names) >= {'Label', 'SlidePreview', 'Thumbnail', 'Profile'}
    return names


def test_replace_label_attachment_on_minimal_czi(tmp_path):
    from sliderelabeler_czi_rw import list_attachment_names

    path = str(tmp_path / 'base.czi')
    _build_czi_with_attachments(path)

    names = list_attachment_names(path)
    assert 'Label' in names
    assert 'SlidePreview' in names
    assert os.path.getsize(path) > 0


def test_replace_preserves_attachments_with_oversized_attdir(tmp_path):
    """Regression: reused oversized ATTDIR must not wipe directory entries."""
    path = str(tmp_path / 'oversized_attdir.czi')
    before = _build_czi_with_attachments(path)
    enlarge_attdir_allocation(path, new_allocated=10016)

    _meta, _directory, attdir_pos = _read_file_header_positions(path)
    _sid, allocated, used = _read_attdir_sizes(path, attdir_pos)
    assert allocated >= 10016
    assert allocated > used

    label = Image.new('RGB', (64, 32), color=(10, 20, 30))
    macro = Image.new('RGB', (64, 32), color=(0, 0, 0))
    replace_label_and_macro_attachments(path, label, macro)

    after = list_czi_attachment_names_via_czifile(path)
    assert set(before).issubset(set(after))
    assert 'Label' in after
    assert 'SlidePreview' in after
    assert 'Thumbnail' in after
    assert 'Profile' in after
    verify_czi_attachments_intact(
        path,
        required_names=before,
        expected_present=['Label', 'SlidePreview'],
    )


def test_verify_czi_attachments_intact_raises_on_missing(tmp_path):
    path = str(tmp_path / 'verify.czi')
    _build_czi_with_attachments(path)
    with pytest.raises(RuntimeError, match='integrity check failed'):
        verify_czi_attachments_intact(
            path,
            required_names=['Label', 'DoesNotExist'],
            expected_present=['Label'],
        )
