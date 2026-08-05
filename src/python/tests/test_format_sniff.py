"""Unit tests for content-based vendor format detection."""

import PIL.Image

from src.python.DeidTools.format_sniff import (
    READER_CANDIDATES_FOR_FORMAT,
    is_czi_file,
    is_supported_deid_format,
    sniff_wsi_format,
)

TAG_IMAGE_DESCRIPTION = 270
TAG_MAKE = 271


def _write_tiff(path, tags=None):
    """Small real TIFF carrying the given ASCII tags."""
    image = PIL.Image.new('RGB', (8, 8), 'white')
    image.save(str(path), format='TIFF', tiffinfo=dict(tags or {}))
    return str(path)


def test_sniff_aperio_from_image_description(tmp_path):
    path = _write_tiff(
        tmp_path / 'renamed.tiff',
        {
            TAG_IMAGE_DESCRIPTION: (
                'Aperio Image Library v10.0.51\n'
                '46920x33014 [0,100 46000x32914] JPEG/RGB Q=30'
            ),
        },
    )
    assert sniff_wsi_format(path) == 'aperio'


def test_sniff_philips_from_pim_dp_description(tmp_path):
    path = _write_tiff(
        tmp_path / 'philips.tif',
        {TAG_IMAGE_DESCRIPTION: '<DataObject><Attribute Name="PIM_DP_UFS_BARCODE"/>'},
    )
    assert sniff_wsi_format(path) == 'philips'


def test_sniff_hamamatsu_from_make(tmp_path):
    path = _write_tiff(tmp_path / 'slide.tif', {TAG_MAKE: 'Hamamatsu'})
    assert sniff_wsi_format(path) == 'hamamatsu'


def test_sniff_ometiff_from_ome_xml(tmp_path):
    path = _write_tiff(
        tmp_path / 'plate.tif',
        {
            TAG_IMAGE_DESCRIPTION: (
                '<?xml version="1.0"?><OME xmlns="http://www.openmicroscopy.org"'
            ),
        },
    )
    assert sniff_wsi_format(path) == 'ometiff'


def test_plain_pyramidal_tiff_has_no_vendor(tmp_path):
    """The reported bug: converted slide, valid TIFF, nothing to de-identify."""
    path = _write_tiff(tmp_path / 'converted.tiff')
    assert sniff_wsi_format(path) is None


def test_sniff_missing_and_non_tiff_paths(tmp_path):
    assert sniff_wsi_format(None) is None
    assert sniff_wsi_format(str(tmp_path / 'nope.tiff')) is None
    junk = tmp_path / 'junk.tiff'
    junk.write_bytes(b'not a tiff at all')
    assert sniff_wsi_format(str(junk)) is None


def test_sniff_czi_by_extension_and_magic(tmp_path):
    named = tmp_path / 'slide.czi'
    named.write_bytes(b'\x00' * 32)
    assert sniff_wsi_format(str(named)) == 'czi'

    renamed = tmp_path / 'slide.tiff'
    renamed.write_bytes(b'ZISRAWFILE' + b'\x00' * 32)
    assert is_czi_file(str(renamed))
    assert sniff_wsi_format(str(renamed)) == 'czi'


def test_is_supported_deid_format():
    for name in ('aperio', 'hamamatsu', 'philips', 'ometiff', 'czi'):
        assert is_supported_deid_format(name)
    assert not is_supported_deid_format(None)
    assert not is_supported_deid_format('')
    assert not is_supported_deid_format('geotiff')


def test_reader_candidates_only_for_rescuable_formats():
    assert READER_CANDIDATES_FOR_FORMAT['aperio'] == ('openslide',)
    assert READER_CANDIDATES_FOR_FORMAT['hamamatsu'] == ('openslide',)
    assert READER_CANDIDATES_FOR_FORMAT['ometiff'] == ('ometiff',)
    assert READER_CANDIDATES_FOR_FORMAT.get('philips') is None
    assert READER_CANDIDATES_FOR_FORMAT.get(None) is None
