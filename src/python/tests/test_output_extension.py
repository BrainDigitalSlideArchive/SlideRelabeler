"""Unit tests for output extension policy (normalize vs preserve)."""

from src.python.DeidTools.output_extension import (
    CANONICAL_OUTPUT_EXTENSIONS,
    normalize_extension,
    resolve_output_extension,
)


def test_normalize_extension_adds_leading_dot():
    assert normalize_extension('tif') == '.tif'
    assert normalize_extension('.TIF') == '.TIF'
    assert normalize_extension('') == ''
    assert normalize_extension(None) == ''


def test_resolve_normalize_defaults_by_format():
    assert resolve_output_extension('philips', '.tif', False) == '.tiff'
    assert resolve_output_extension('aperio', '.svs', False) == '.svs'
    assert resolve_output_extension('hamamatsu', '.ndpi', False) == '.ndpi'
    assert resolve_output_extension('ometiff', '.ome.tiff', False) == '.ome.tif'
    assert resolve_output_extension('czi', '.czi', False) == '.czi'


def test_resolve_preserve_keeps_source_exactly():
    assert resolve_output_extension('philips', '.tif', True) == '.tif'
    assert resolve_output_extension('philips', '.TIF', True) == '.TIF'
    assert resolve_output_extension('aperio', '.SVS', True) == '.SVS'
    assert resolve_output_extension('czi', '.CZI', True) == '.CZI'


def test_resolve_preserve_empty_source_falls_back_to_canonical():
    assert resolve_output_extension('philips', '', True) == '.tiff'
    assert resolve_output_extension('philips', None, True) == '.tiff'
    assert resolve_output_extension('aperio', '', True) == '.svs'


def test_resolve_unknown_format_uses_source_or_tiff():
    assert resolve_output_extension(None, '.tif', False) == '.tif'
    assert resolve_output_extension('unknown', '', False) == '.tiff'


def test_canonical_map_matches_writers():
    assert CANONICAL_OUTPUT_EXTENSIONS == {
        'aperio': '.svs',
        'hamamatsu': '.ndpi',
        'philips': '.tiff',
        'ometiff': '.ome.tif',
        'czi': '.czi',
    }


def test_get_rename_normalizes_philips_tif_by_default():
    from src.python.DeidTools import DeidTools

    tools = DeidTools()
    tools._detect_format_for_extension_policy = lambda path: 'philips'
    output_dict = {
        'config': {
            'filename': {
                'source': 'uuid',
                'use_uuid': True,
                'preserve_source_extension': False,
            },
        },
        '__reserved': {
            'uuid': 'abc-123',
            'source': {
                'path': '/tmp/missing-slide.tif',
                'filename': 'missing-slide.tif',
                'parsed': {'ext': '.tif'},
            },
            'destinationDirectory': '/tmp/out',
        },
    }
    assert tools.get_rename(output_dict) == 'abc-123.tiff'


def test_get_rename_preserves_source_ext_when_enabled():
    from src.python.DeidTools import DeidTools

    tools = DeidTools()
    tools._detect_format_for_extension_policy = lambda path: 'philips'
    output_dict = {
        'config': {
            'filename': {
                'source': 'uuid',
                'use_uuid': True,
                'preserve_source_extension': True,
            },
        },
        '__reserved': {
            'uuid': 'abc-123',
            'source': {
                'path': '/tmp/missing-slide.tif',
                'filename': 'missing-slide.tif',
                'parsed': {'ext': '.tif'},
            },
            'destinationDirectory': '/tmp/out',
        },
    }
    assert tools.get_rename(output_dict) == 'abc-123.tif'
