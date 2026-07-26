"""Unit tests for DeidTools.determine_format null-safe Make handling."""

from src.python.DeidTools import DeidTools


class _FakeTileSource:
    def __init__(self, metadata):
        self._metadata = metadata

    def getInternalMetadata(self):
        return self._metadata


def test_determine_format_empty_metadata():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource({})) is None


def test_determine_format_none_metadata():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource(None)) is None


def test_determine_format_make_none():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource({'Make': None})) is None


def test_determine_format_aperio():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource({'Make': 'Aperio'})) == 'aperio'


def test_determine_format_hamamatsu():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource({'Make': 'Hamamatsu'})) == 'hamamatsu'


def test_determine_format_philips():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource({'Make': 'Philips'})) == 'philips'


def test_determine_format_unknown_make():
    tools = DeidTools()
    assert tools.determine_format(_FakeTileSource({'Make': 'Canon'})) is None
