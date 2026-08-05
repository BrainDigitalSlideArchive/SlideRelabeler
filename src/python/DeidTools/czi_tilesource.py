"""large_image CZI source via pylibCZIrw, with attachments from czifile."""

from __future__ import annotations

import io
import logging
import os
import threading
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
from large_image.constants import SourcePriority, TILE_FORMAT_PIL
from large_image.tilesource import (
    AvailableTileSources,
    FileTileSource,
    TileSourceError,
    loadTileSources,
)
from pylibCZIrw.czi import CziReader

from .czi_attachments import (
    get_associated_image_bytes,
    list_associated_image_names,
)

logger = logging.getLogger(__name__)

TILE_SIZE = 256
MAX_LEVELS = 20
SUPPORTED_PIXEL_TYPE = 'Bgr24'


def compute_levels(size_x: int, size_y: int, tile_size: int = TILE_SIZE) -> int:
    """Number of pyramid levels (level 0 = lowest res, levels-1 = full)."""
    longest = max(int(size_x), int(size_y))
    levels = 1
    while longest > tile_size and levels < MAX_LEVELS:
        longest = (longest + 1) // 2
        levels += 1
    return levels


def level_zoom(level: int, levels: int) -> float:
    """pylibCZIrw zoom for an OSD / large_image pyramid level."""
    return 1.0 / (2 ** (levels - 1 - int(level)))


def tile_roi_level0(
    x: int,
    y: int,
    level: int,
    levels: int,
    origin_x: int,
    origin_y: int,
    size_x: int,
    size_y: int,
    tile_size: int = TILE_SIZE,
) -> Tuple[Optional[Tuple[int, int, int, int]], float]:
    """
    Map OSD tile (level, x, y) to a level-0 ROI in file coordinates.

    Returns (roi_or_None, zoom). roi is (x, y, w, h); None if fully outside.
    """
    zoom = level_zoom(level, levels)
    scale = 2 ** (levels - 1 - int(level))
    roi_x = int(origin_x) + int(x) * tile_size * scale
    roi_y = int(origin_y) + int(y) * tile_size * scale
    roi_w = tile_size * scale
    roi_h = tile_size * scale

    max_x = int(origin_x) + int(size_x)
    max_y = int(origin_y) + int(size_y)
    x0 = max(roi_x, int(origin_x))
    y0 = max(roi_y, int(origin_y))
    x1 = min(roi_x + roi_w, max_x)
    y1 = min(roi_y + roi_h, max_y)
    if x1 <= x0 or y1 <= y0:
        return None, zoom
    return (x0, y0, x1 - x0, y1 - y0), zoom


def _rect_xywh(rect: Any) -> Tuple[int, int, int, int]:
    if hasattr(rect, 'x'):
        return int(rect.x), int(rect.y), int(rect.w), int(rect.h)
    return int(rect[0]), int(rect[1]), int(rect[2]), int(rect[3])


def _rgb_image(rgb: np.ndarray) -> Image.Image:
    if rgb.dtype != np.uint8:
        rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    return Image.fromarray(rgb, mode='RGB')


def _bgr_to_rgb(arr: np.ndarray) -> np.ndarray:
    if arr.ndim != 3 or arr.shape[2] < 3:
        raise ValueError(f'Expected HxWx3 BGR array, got shape {arr.shape}')
    return arr[:, :, :3][:, :, ::-1].copy()


class CziFileTileSource(FileTileSource):
    """A registered large_image source for brightfield Bgr24 CZI slides."""

    name = 'czi_pylibczirw'
    extensions = {
        None: SourcePriority.MANUAL,
        'czi': SourcePriority.PREFERRED,
    }
    mimeTypes = {
        None: SourcePriority.MANUAL,
        'image/czi': SourcePriority.PREFERRED,
    }

    def __init__(self, path: str, **kwargs):
        if not str(path).lower().endswith('.czi'):
            raise TileSourceError('Only .czi files are supported by this source.')
        if not os.path.isfile(path):
            raise TileSourceError(f'CZI file not found: {path}')

        # JPEG is the normal large_image tile output unless the caller asks
        # for another encoding.
        kwargs.setdefault('encoding', 'JPEG')
        super().__init__(path, **kwargs)
        self.path = str(self._getLargeImagePath())
        self._lock = threading.RLock()
        try:
            self._reader = CziReader(self.path)
        except Exception as exc:
            raise TileSourceError(f'Could not open CZI via pylibCZIrw: {exc}') from exc
        try:
            pixel_type = self._reader.get_channel_pixel_type(0)
        except Exception as exc:
            self.close()
            raise TileSourceError(f'Could not read CZI pixel type: {exc}') from exc
        if pixel_type != SUPPORTED_PIXEL_TYPE:
            self.close()
            raise TileSourceError(
                f'CZI pixel type {pixel_type!r} is not supported in this build; '
                f'only {SUPPORTED_PIXEL_TYPE} is supported'
            )

        ox, oy, w, h = _rect_xywh(self._reader.total_bounding_rectangle)
        self._origin_x = ox
        self._origin_y = oy
        self.sizeX = w
        self.sizeY = h
        self.tileWidth = TILE_SIZE
        self.tileHeight = TILE_SIZE
        self.levels = compute_levels(self.sizeX, self.sizeY, TILE_SIZE)

    def close(self) -> None:
        reader = getattr(self, '_reader', None)
        if reader is not None:
            try:
                reader.close()
            except Exception:
                pass
            self._reader = None

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass

    def getMetadata(self) -> Dict[str, Any]:
        return super().getMetadata()

    def getInternalMetadata(self) -> Dict[str, Any]:
        return {}

    def getAssociatedImagesList(self) -> List[str]:
        try:
            return list_associated_image_names(self.path)
        except Exception:
            logger.warning(
                'Failed to list CZI associated images for %s',
                self.path,
                exc_info=True,
            )
            return []

    def _getAssociatedImage(self, name: str) -> Optional[Image.Image]:
        result = get_associated_image_bytes(self.path, name)
        if result is None:
            return None
        image_bytes, _mime_type = result
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
        return image

    def getTile(self, x: int, y: int, z: int, *args, **kwargs):
        self._xyzInRange(x, y, z)
        roi, zoom = tile_roi_level0(
            int(x),
            int(y),
            int(z),
            self.levels,
            self._origin_x,
            self._origin_y,
            self.sizeX,
            self.sizeY,
            TILE_SIZE,
        )
        if roi is None:
            raise TileSourceError(f'CZI tile ({x}, {y}, {z}) is outside the slide.')

        with self._lock:
            arr = self._reader.read(roi=roi, zoom=zoom)
        tile = _rgb_image(_bgr_to_rgb(arr))
        return self._outputTile(
            tile,
            TILE_FORMAT_PIL,
            x,
            y,
            z,
            kwargs.pop('pilImageAllowed', False),
            kwargs.pop('numpyAllowed', False),
            **kwargs,
        )


# Backward-compatible name for imports/tests written during the first pass.
CziTileSource = CziFileTileSource


def register_czi_tile_source() -> None:
    """Register the app-local source with large_image's normal dispatcher."""
    if not AvailableTileSources:
        loadTileSources()
    AvailableTileSources[CziFileTileSource.name] = CziFileTileSource


class CziDeidTileSource:
    """
    Path-only stub for Process / Compare.

    Avoids OpenSlide and does not open pylibCZIrw (metadata scrub uses edit_czi).
    """

    name = 'czi'

    def __init__(self, path: str):
        self.path = path

    def _getLargeImagePath(self) -> str:
        return self.path

    def getInternalMetadata(self) -> Dict[str, Any]:
        return {}

    def getAssociatedImagesList(self) -> List[str]:
        try:
            return list_associated_image_names(self.path)
        except Exception:
            logger.warning(
                'Failed to list CZI associated images for %s',
                self.path,
                exc_info=True,
            )
            return []

    def getMetadata(self) -> Dict[str, Any]:
        return {}
