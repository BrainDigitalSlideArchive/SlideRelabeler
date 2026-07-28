# macOS ARM64: `TiffFileTileSource` crashes — three `TIFFGetField` ctypes fixes

Bug report for large_image maintainers. Copy-paste repro scripts below; no other files required.

**Environment tested:** macOS Apple Silicon, Python 3.12, pylibtiff 0.7.0 (`import libtiff; libtiff.__version__`; conda package metadata may report 0.0.0), large-image-source-tiff 1.34.2, tifftools 1.7.0. Test slide: Aperio `.svs` (JPEG-compressed tiles). Linux CI may not reproduce.

**Context:** [large_image #1992](https://github.com/girder/large_image/pull/1992) added `TIFFGetField.argtypes = None` to work around pylibtiff 0.7.0 on other platforms; that undoes the Mac ARM64 fix in [pylibtiff #189](https://github.com/pearu/pylibtiff/pull/189).

---

## Summary

On **macOS Apple Silicon**, `TiffFileTileSource(path)` for a normal Aperio `.svs` terminates the process with **SIGBUS** (exit 138). If pylibtiff #189 `argtypes` are preserved, **SIGSEGV** (exit 139) can occur during JPEG validation in `_getJpegTables()` or during tile reads in `_getJpegFrameSize()`.

`tifftools.read_tiff(path)` on the same file succeeds. The fault is in `large_image_source_tiff/tiff_reader.py` ctypes usage.

pylibtiff #189 sets `TIFFGetField.argtypes = [TIFF, c_uint32]` — only the two fixed parameters. Variadic arguments must be passed at call time **without** clearing or extending `argtypes`. See [pearu/pylibtiff#178](https://github.com/pearu/pylibtiff/issues/178).

**Root cause:** large_image clears #189 `argtypes` at import ([#1992](https://github.com/girder/large_image/pull/1992)), then re-extends them at two call sites for variadic output pointers — all break the Mac ARM64 variadic ABI.

---

## Repro 1 — `patchLibtiff()` clears pylibtiff #189 fix

Save as `repro_argtypes.py` and run: `python repro_argtypes.py`

```python
"""Shows patchLibtiff() clears TIFFGetField.argtypes on import."""
from libtiff import libtiff_ctypes as lc

before = lc.libtiff.TIFFGetField.argtypes
print("before:", before)

import large_image_source_tiff.tiff_reader  # triggers patchLibtiff()

after = lc.libtiff.TIFFGetField.argtypes
print("after:", after)

if before and len(before) == 2 and after is None:
    print("FAIL: pylibtiff #189 argtypes cleared by patchLibtiff()")
else:
    print("argtypes unchanged or already patched")
```

**Expected on stock large-image-source-tiff 1.34.2:**

```
before: [<class 'libtiff.libtiff_ctypes.TIFF'>, <class 'ctypes.c_uint'>]
after: None
FAIL: pylibtiff #189 argtypes cleared by patchLibtiff()
```

---

## Repro 2 — stock package crashes opening SVS

Save as `repro_crash.py`. Set `SVS_PATH` to any JPEG-compressed Aperio `.svs`.

```python
"""Stock TiffFileTileSource — expect SIGBUS on Mac ARM64."""
import sys

SVS_PATH = "/path/to/sample.svs"  # <-- set this

from large_image_source_tiff import TiffFileTileSource

TiffFileTileSource(SVS_PATH)
print("unexpected: survived")
```

**Expected:** process dies with SIGBUS (exit 138) before printing.

---

## Repro 3 — second failure after fix 1 only

Apply **Required change 1** below to `tiff_reader.py`, then save and run:

```python
"""After fix 1 only — expect SIGSEGV during validate=True on JPEG SVS."""
import sys

SVS_PATH = "/path/to/sample.svs"  # <-- set this

from large_image_source_tiff.tiff_reader import TiledTiffDirectory

TiledTiffDirectory(
    filePath=SVS_PATH,
    directoryNum=0,
    mustBeTiled=None,
    validate=True,
)
print("unexpected: survived")
```

**Expected:** SIGSEGV (exit 139) in `_getJpegTables()` during `_validate()`.

---

## Required change 1 — `patchLibtiff()` (`tiff_reader.py` ~line 85)

**Problem:** unconditionally sets `TIFFGetField.argtypes = None`, undoing pylibtiff #189 (added in [large_image #1992](https://github.com/girder/large_image/pull/1992)).

**Replace:**

```python
    libtiff_ctypes.libtiff.TIFFGetField.argtypes = None
```

**With:**

```python
    existing = libtiff_ctypes.libtiff.TIFFGetField.argtypes
    if not (existing and len(existing) == 2):
        libtiff_ctypes.libtiff.TIFFGetField.argtypes = None
```

---

## Required change 2 — `_getJpegTables()` (`tiff_reader.py` ~lines 368–371)

**Problem:** extends `argtypes` with variadic output pointer types before calling `TIFFGetField` for `TIFFTAG_JPEGTABLES` → SIGSEGV on Mac ARM64 during `_validate()`.

**Delete this block entirely:**

```python
        if libtiff_ctypes.libtiff.TIFFGetField.argtypes:
            libtiff_ctypes.libtiff.TIFFGetField.argtypes = \
                libtiff_ctypes.libtiff.TIFFGetField.argtypes[:2] + \
                [ctypes.POINTER(ctypes.c_uint32), ctypes.POINTER(ctypes.c_void_p)]
```

**Keep the existing call** (correct with #189 two-arg `argtypes`):

```python
        if libtiff_ctypes.libtiff.TIFFGetField(
                self._tiffFile,
                libtiff_ctypes.TIFFTAG_JPEGTABLES,
                ctypes.byref(tableSize),
                ctypes.byref(tableBuffer)) != 1:
```

pylibtiff high-level `GetField('JPEGTABLES')` is not available (`TIFFTAG_JPEGTABLES` is not in pylibtiff's `tifftags` dict). The low-level call above with preserved two-arg `argtypes` is correct.

---

## Required change 3 — `_getJpegFrameSize()` (`tiff_reader.py` ~lines 493–496)

**Problem:** same argtypes-extension pattern as change 2, for `TIFFTAG_TILEBYTECOUNTS` when reading encoded JPEG tile sizes. Not hit during `TiffFileTileSource` open/validate alone, but **SIGSEGV on Mac ARM64 when reading tiles** (e.g. `getTile()` → `_getJpegFrame()` → `_getJpegFrameSize()`).

**Delete this block entirely:**

```python
        if libtiff_ctypes.libtiff.TIFFGetField.argtypes:
            libtiff_ctypes.libtiff.TIFFGetField.argtypes = \
                libtiff_ctypes.libtiff.TIFFGetField.argtypes[:2] + \
                [ctypes.POINTER(ctypes.POINTER(rawTileSizesType))]
```

**Keep the existing call** (correct with #189 two-arg `argtypes`):

```python
        if libtiff_ctypes.libtiff.TIFFGetField(
                self._tiffFile,
                libtiff_ctypes.TIFFTAG_TILEBYTECOUNTS,
                ctypes.byref(rawTileSizes)) != 1:
```

---

## Verify fixes 1 + 2 (open and validate)

Apply **changes 1 and 2** to `tiff_reader.py`, restart Python, then save and run:

```python
"""After fix 1 + 2 — TiffFileTileSource open/validate should complete."""
import sys

SVS_PATH = "/path/to/sample.svs"  # <-- set this

from large_image_source_tiff.tiff_reader import TiledTiffDirectory
from large_image_source_tiff import TiffFileTileSource

TiledTiffDirectory(
    filePath=SVS_PATH,
    directoryNum=0,
    mustBeTiled=None,
    validate=True,
)
src = TiffFileTileSource(SVS_PATH)
print("OK open", len(src._tiffDirectories), "directories")
```

**Expected:** prints `OK open` with directory count; no crash.

---

## Verify all three fixes (tile read)

Apply **changes 1, 2, and 3**, restart Python, then save and run:

```python
"""After fix 1 + 2 + 3 — reading a tile should not crash."""
SVS_PATH = "/path/to/sample.svs"  # <-- set this

from large_image_source_tiff import TiffFileTileSource

src = TiffFileTileSource(SVS_PATH)
# level 0, tile (0, 0) — adjust if needed for your slide
tile = src.getTile(0, 0, src.levels - 1)
print("OK tile", len(tile) if isinstance(tile, bytes) else type(tile))
```

**Expected:** prints `OK tile` without SIGSEGV.

---

## Verification summary

| Configuration | `_loadMetadata` | `_validate` / `_getJpegTables` | `TiffFileTileSource` open | Tile read (`_getJpegFrameSize`) |
|---------------|-----------------|--------------------------------|---------------------------|--------------------------------|
| Stock | SIGBUS | — | crash | — |
| Fix 1 only | OK | SIGSEGV | crash | — |
| Fix 1 + 2 | OK | OK | OK | SIGSEGV (if tiles read) |
| Fix 1 + 2 + 3 | OK | OK | OK | OK |

Changes 1 and 2 are required for `TiffFileTileSource` with `validate=True` on Mac ARM64 JPEG slides. Change 3 is required for tile serving via the pylibtiff path on Mac ARM64.

---

## Root cause (one sentence)

large_image clears pylibtiff #189 `argtypes` at import ([#1992](https://github.com/girder/large_image/pull/1992)), then re-extends them at `_getJpegTables` and `_getJpegFrameSize` — all incompatible with the Mac ARM64 variadic ABI fixed in pylibtiff 0.7.0.
