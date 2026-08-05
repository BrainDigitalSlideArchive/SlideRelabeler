"""Unit tests for CZI tile math, attachment name mapping, and OpenSlide-free deid setup."""

import os
import importlib
from unittest import mock

import large_image
from large_image.tilesource import AvailableTileSources, FileTileSource
import numpy as np
import pytest

from src.python.DeidTools.czi_attachments import (
    ATTACHMENT_NAME_MAP,
    map_attachment_name,
)
from src.python.DeidTools.czi_tilesource import (
    TILE_SIZE,
    CziFileTileSource,
    compute_levels,
    level_zoom,
    register_czi_tile_source,
    tile_roi_level0,
)
from src.python.DeidTools import DeidTools


def test_compute_levels_small_image_is_one():
    assert compute_levels(100, 80, tile_size=256) == 1


def test_compute_levels_grows_until_tile_size():
    # 4096 → 2048 → 1024 → 512 → 256 → stop when longest <= 256 after halvings
    levels = compute_levels(4096, 2000, tile_size=256)
    assert levels >= 5
    assert levels <= 20


def test_level_zoom_full_res_is_one():
    levels = 5
    assert level_zoom(levels - 1, levels) == 1.0
    assert level_zoom(0, levels) == pytest.approx(1.0 / 16)


def test_tile_roi_level0_full_res_origin_zero():
    levels = 3  # scale at full res = 1
    roi, zoom = tile_roi_level0(
        x=2, y=1, level=2, levels=levels,
        origin_x=0, origin_y=0, size_x=2000, size_y=1000, tile_size=256,
    )
    assert zoom == 1.0
    assert roi == (512, 256, 256, 256)


def test_tile_roi_level0_lower_level_scales():
    levels = 3
    # level 1 → scale 2; tile (0,0) covers 512x512 at level-0
    roi, zoom = tile_roi_level0(
        x=0, y=0, level=1, levels=levels,
        origin_x=0, origin_y=0, size_x=2000, size_y=1000, tile_size=256,
    )
    assert zoom == pytest.approx(0.5)
    assert roi == (0, 0, 512, 512)


def test_tile_roi_level0_clips_to_image_bounds():
    levels = 1
    roi, zoom = tile_roi_level0(
        x=0, y=0, level=0, levels=levels,
        origin_x=10, origin_y=20, size_x=100, size_y=50, tile_size=256,
    )
    assert zoom == 1.0
    assert roi == (10, 20, 100, 50)


def test_tile_roi_level0_outside_returns_none():
    levels = 1
    roi, zoom = tile_roi_level0(
        x=5, y=5, level=0, levels=levels,
        origin_x=0, origin_y=0, size_x=100, size_y=100, tile_size=256,
    )
    assert roi is None
    assert zoom == 1.0


def test_map_attachment_name_label_macro_thumbnail():
    assert map_attachment_name('Label') == 'label'
    assert map_attachment_name('SlidePreview') == 'macro'
    assert map_attachment_name('Thumbnail') == 'thumbnail'
    assert map_attachment_name('Unknown') is None
    assert ATTACHMENT_NAME_MAP['Label'] == 'label'


class _FakeRect:
    x = 0
    y = 0
    w = 1024
    h = 512


class _FakeCziReader:
    total_bounding_rectangle = _FakeRect()

    def __init__(self, path):
        self.path = path
        self.closed = False
        self.read_calls = []

    def get_channel_pixel_type(self, channel):
        return 'Bgr24'

    def read(self, roi, zoom):
        self.read_calls.append((roi, zoom))
        width = max(1, round(roi[2] * zoom))
        height = max(1, round(roi[3] * zoom))
        return np.zeros((height, width, 3), dtype=np.uint8)

    def close(self):
        self.closed = True


def test_czi_source_is_real_large_image_source(tmp_path, monkeypatch):
    czi_path = tmp_path / 'slide.czi'
    czi_path.write_bytes(b'fake-czi')
    module = importlib.import_module('src.python.DeidTools.czi_tilesource')
    monkeypatch.setattr(module, 'CziReader', _FakeCziReader)

    source = CziFileTileSource(str(czi_path))
    try:
        assert isinstance(source, FileTileSource)
        assert source.getMetadata()['sizeX'] == 1024
        tile = source.getTile(0, 0, source.levels - 1)
        assert bytes(tile)[:2] == b'\xff\xd8'
    finally:
        source.close()


def test_czi_source_registers_with_large_image_dispatcher(tmp_path, monkeypatch):
    czi_path = tmp_path / 'slide.czi'
    czi_path.write_bytes(b'fake-czi')
    module = importlib.import_module('src.python.DeidTools.czi_tilesource')
    monkeypatch.setattr(module, 'CziReader', _FakeCziReader)

    prior = AvailableTileSources.get(CziFileTileSource.name)
    register_czi_tile_source()
    try:
        source = large_image.open(str(czi_path))
        assert isinstance(source, CziFileTileSource)
        source.close()
    finally:
        if prior is None:
            AvailableTileSources.pop(CziFileTileSource.name, None)
        else:
            AvailableTileSources[CziFileTileSource.name] = prior


def _minimal_czi_output_dict(path, dest):
    return {
        'config': {
            'filename': {'source': 'original'},
            'wsi': {'save_macro_image': True},
            'label': {
                'add_text': False,
                'add_qr': False,
                'add_icon': False,
            },
            'copy': {'enable_copy_mode': False},
        },
        '__reserved': {
            'destinationDirectory': dest,
            'source': {
                'path': path,
                'filename': os.path.basename(path),
                'parsed': {'ext': '.czi'},
            },
            'rename': 'deid-out',
        },
    }


def test_setup_deid_czi_skips_large_image_open(tmp_path):
    """CZI Process/Compare stub item must not call large_image.open / OpenSlide."""
    czi_path = tmp_path / 'slide.czi'
    czi_path.write_bytes(b'not-a-real-czi')
    dest = tmp_path / 'out'
    dest.mkdir()
    output_dict = _minimal_czi_output_dict(str(czi_path), str(dest))

    tools = DeidTools(supress_print=True, debug=False)
    fake_label = object()
    fake_macro = object()

    with mock.patch('src.python.DeidTools.DeIdImageItem.large_image.open') as open_mock:
        open_mock.side_effect = AssertionError('large_image.open should not be called for CZI stub')
        with mock.patch.object(tools, 'get_deid_label', return_value=fake_label):
            with mock.patch.object(tools, 'get_deid_macro', return_value=fake_macro):
                curItem, output_dir, tileSource, redactList, newTitle, labelImage, macroImage, func, fmt = (
                    tools.setup_deid(output_dict)
                )

    open_mock.assert_not_called()
    assert fmt == 'czi'
    assert labelImage is fake_label and macroImage is fake_macro
    assert func.__name__ == 'redact_format_czi'
    assert tileSource._getLargeImagePath() == str(czi_path)
    assert curItem.filePath == str(czi_path)
    assert 'czi;Document.Title' in redactList['metadata']
    assert 'label' in redactList['images']
    assert 'macro' in redactList['images']
    assert TILE_SIZE == 256


def test_redact_format_czi_uses_item_path_not_openslide(tmp_path, monkeypatch):
    """redact_format_czi reads source from item.filePath without ImageItem.tileSource open."""
    czi_path = tmp_path / 'in.czi'
    czi_path.write_bytes(b'placeholder')
    dest = tmp_path / 'out'
    dest.mkdir()

    tools = DeidTools(supress_print=True, debug=False)
    item = mock.Mock()
    item.filePath = str(czi_path)
    item._largeImagePath = str(czi_path)

    sample_xml = (
        b'<?xml version="1.0"?><ImageDocument><Metadata><Document>'
        b'<Title>Old</Title></Document></Metadata></ImageDocument>'
    )
    deid_module = importlib.import_module('src.python.DeidTools.DeidTools')
    monkeypatch.setattr(
        deid_module,
        'read_czi_metadata_xml',
        lambda path: sample_xml.decode('utf-8') if isinstance(sample_xml, bytes) else sample_xml,
    )
    monkeypatch.setattr(
        deid_module,
        'sanitize_czi_metadata_xml',
        lambda xml, title, redact=None: (
            xml.replace('<Title>Old</Title>', '<Title>New</Title>'),
            {'czi;Document.Title': 'Old'},
            {'czi;Document.Title': 'New'},
        ),
    )
    monkeypatch.setattr(
        deid_module,
        'flatten_czi_fields_to_fake_ifds',
        lambda prior, after: ([{'tags': {0: {'name': 'czi;Document.Title', 'data': 'Old'}}}],
                              [{'tags': {0: {'name': 'czi;Document.Title', 'data': 'New'}}}]),
    )

    prior, after, xml_metadata = tools.redact_format_czi(
        item, str(dest), {'metadata': {}, 'images': {}}, 'title', None, None, preview_metadata=True
    )
    assert prior[0]['tags'][0]['data'] == 'Old'
    assert after[0]['tags'][0]['data'] == 'New'
    assert '<Title>Old</Title>' in xml_metadata['prior_xml']
    assert '<Title>New</Title>' in xml_metadata['new_xml']
