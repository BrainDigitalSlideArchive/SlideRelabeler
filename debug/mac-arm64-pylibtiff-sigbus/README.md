# macOS Apple Silicon: pylibtiff / large_image SIGBUS — repro kit

Minimal Python scripts that reproduce a **native crash when opening Aperio `.svs` via `large_image_source_tiff` / pylibtiff** on Apple Silicon — **outside Electron/gRPC**. Each script isolates one layer of the stack.

**Root cause (summary):** On arm64, pylibtiff [#189](https://github.com/pearu/pylibtiff/pull/189) sets `TIFFGetField.argtypes` to the two fixed parameters only. `large_image_source_tiff.tiff_reader.patchLibtiff()` ([large_image #1992](https://github.com/girder/large_image/pull/1992)) clears those argtypes; related call sites then extend them for variadic output pointers. That breaks the Mac ARM64 variadic ABI → **SIGBUS** (or **SIGSEGV** after partial fixes). `tifftools.read_tiff()` on the same file succeeds. Any path that constructs `TiffFileTileSource` (or hits the broken `TIFFGetField` ctypes usage) can crash.

See also:

- Upstream-facing brief (standalone, send as-is): [`UPSTREAM_BRIEF.md`](UPSTREAM_BRIEF.md) — inline repro scripts, no repo files required. Local scripts `00b` / `10` automate the same checks.
- Production guard used by the app: [`src/python/libtiff_guard.py`](../../src/python/libtiff_guard.py)

## Quick start

1. Activate the app conda env (or set `PYTHON` to its interpreter):

   ```bash
   conda activate sliderelabeler
   ```

2. Copy config and set your test slide:

   ```bash
   cp config.example.env config.local.env
   # edit SVS_PATH=/path/to/sample.svs
   ```

3. Run all steps:

   ```bash
   chmod +x run_all.sh
   ./run_all.sh
   ```

Logs are written to `results/YYYY-MM-DD_HHMMSS.log` (gitignored).

## Scripts

| Script | What it tests |
|--------|----------------|
| `00_report_env.py` | Python/platform and package versions (no slide) |
| `00b_argtypes_probe.py` | `TIFFGetField.argtypes` before/after `tiff_reader` import |
| `01_tifftools_read.py` | `tifftools.read_tiff()` only |
| `02_pylibtiff_open.py` | `TiledTiffDirectory` / pylibtiff open |
| `03_tiff_file_tile_source.py` | `TiffFileTileSource` constructor |
| `04_order_tifftools_then_pylibtiff.py` | tifftools first, then pylibtiff |
| `05_order_pylibtiff_then_tifftools.py` | pylibtiff first, then tifftools |
| `06_large_image_open.py` | `large_image.open()` (OpenSlide path) |
| `07_deidtools_minimal.py` | `DeidTools.preview_metadata()` (app path that opens tile source) |
| `08_deidtools_redact_only.py` | `redact_format_aperio(..., preview_metadata=True)` |
| `09_after_openslide.py` | OpenSlide tile source, then `TiledTiffDirectory` |
| `10_patchlibtiff_guard.py` | Guard on; `validate=True`, `TiffFileTileSource`, DeidTools helper |

Supporting module: [`patchlibtiff_guard.py`](patchlibtiff_guard.py) re-exports [`src/python/libtiff_guard.py`](../../src/python/libtiff_guard.py).

Run a single step:

```bash
python 01_tifftools_read.py
```

Steps 07–08 need `PYTHONPATH` via `repro_common.ensure_deidtools_path()` (repo `src/python`).

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | OK |
| 138 | SIGBUS (128 + 10) — typical Mac crash in pylibtiff path |
| 139 | SIGSEGV (128 + 11) |

`run_all.sh` continues after crashes and prints a summary table.

## Expected pattern (CMU-2-backup.svs, Apple Silicon)

| Step | Expected |
|------|----------|
| 00, 00b | OK — 00b shows argtypes cleared after `tiff_reader` import |
| 01 | OK — 7 IFDs |
| 02, 03 | SIGBUS |
| 04, 05 | Usually same as 02 (tifftools order rarely changes outcome) |
| 06 | OK — OpenSlide path works |
| 07, 08 | SIGBUS (DeidTools paths that open `TiffFileTileSource` — same native fault) |
| 09 | SIGBUS |
| 10 | OK — guard applied; `validate=True`, `TiffFileTileSource`, and DeidTools preview helpers pass |

If 01 passes but 02/03 fail, the fault is in **pylibtiff ctypes usage inside `large_image_source_tiff`**, not tifftools or Electron.

## tiff_reader patches (local testing / Mac app)

[`src/python/libtiff_guard.py`](../../src/python/libtiff_guard.py) applies all three upstream fixes via an import hook (must run before `large_image_source_tiff.tiff_reader` loads):

1. **`patchLibtiff()`** — preserve pylibtiff #189 two-arg `TIFFGetField.argtypes`
2. **`_getJpegTables()`** — remove argtypes extension; pass output pointers as variadic args
3. **`_getJpegFrameSize()`** — same for tile byte-count reads (`getTile()` path)

See [`UPSTREAM_BRIEF.md`](UPSTREAM_BRIEF.md) for exact diffs to send large_image maintainers.

```python
from libtiff_guard import install_patchlibtiff_guard

install_patchlibtiff_guard()
import large_image_source_tiff.tiff_reader  # patched load
```

End-to-end app testing:

```bash
chmod +x scripts/dev-patch-libtiff.sh
./scripts/dev-patch-libtiff.sh   # force guard on (optional on macOS arm64)
# or: npm run dev                # auto-enables guard on darwin/arm64
# or: SLIDERELABELER_PATCH_LIBTIFF=0 ./scripts/dev.sh   # reproduce crash
```

On **macOS arm64**, [`engine.py`](../../src/python/engine.py) auto-installs the guard when `SLIDERELABELER_PATCH_LIBTIFF` is unset. With engine `debug = True`, stderr shows `libtiff guard auto-enabled`. **Windows / Intel Mac:** leave the flag unset; guard stays off.

## Phase 2: narrowing steps

Run these after the kit confirms the failing step.

### A. Confirm the exact failing native call

| Experiment | Pass criterion | If it fails |
|------------|----------------|-------------|
| 02 alone | pylibtiff opens IFD 0 | Fault in `TIFF.open` / libtiff on Mac |
| 02 with `validate=False` | Skip tile validation reads | Crash in validation vs open |
| 02 with `directoryNum=1..6` | Which IFD triggers SIGBUS | Corrupt/specific directory |
| 03 vs 02 | 03 fails only if 02 fails | Confirms fault is in `getTiffDir`, not later DeidTools |

### B. Double-open / ordering

| Experiment | Question |
|------------|----------|
| 04 vs 05 vs 02 | Does prior `tifftools.read_tiff` change behavior? |
| 02, then close, then 02 again | libtiff handle leak vs one-shot |
| 09 | Does OpenSlide lock/mmap interact with pylibtiff? (mirrors `setup_deid` before redact) |

### C. Environment / library skew

| Check | Command / action |
|-------|------------------|
| Conda libtiff vs Homebrew | `otool -L $(python -c "import libtiff.libtiff_ctypes as l; print(l.__file__)")` |
| Compare Mac vs Windows | Run `run_all.sh` on both; diff `00_report_env` output |
| pylibtiff `patchLibtiff()` | See `00b` and [`UPSTREAM_BRIEF.md`](UPSTREAM_BRIEF.md) |
| Version pin experiment | Temporarily pin/downgrade packages in a throwaway conda env |

### D. Slide specificity

- Run against **CMU-2-backup.svs**, **1661893.svs**, and other local SVS files
- Record IFD count and which step first fails
- If only some slides fail → TIFF structure edge case, not global Mac breakage

### E. Native stack trace (lldb)

```bash
lldb -- python 02_pylibtiff_open.py
# (lldb) run
# after SIGBUS: bt
```

Or try `PYTHONFAULTHANDLER=1` (helps Python exceptions; less useful for SIGBUS).

### F. pylibtiff #189 vs `patchLibtiff()` (high priority)

| Experiment | Expected if hypothesis correct |
|------------|-------------------------------|
| `00b_argtypes_probe` | argtypes `[TIFF, c_uint]` before import, `None` after |
| `02` without large_image import (custom script) | May **pass** on Mac |
| Same after `import large_image_source_tiff.tiff_reader` | **SIGBUS** |
| Locally comment out `patchLibtiff()` line 85 in site-packages | May open SVS without the app guard |

### G. Product-side confirmation (after root cause)

If 02/03 fail but 01 passes, a DeidTools workaround candidate is to **skip `TiffFileTileSource` where only IFD indices are needed** (e.g. preview helpers) and derive Aperio directory indices from tifftools `ifds`. Prefer fixing `tiff_reader` upstream (or the app guard) so all tile-source paths stay safe. Validate on Windows before merging.

## Environment

Uses the same conda env as the app (`sliderelabeler`). `run_all.sh` auto-detects `$CONDA_PREFIX` or honors `PYTHON=/path/to/python`.

Optional: inspect linked libraries:

```bash
otool -L "$(python -c "import libtiff.libtiff_ctypes as l; print(l.__file__)")"
```
