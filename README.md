# SlideRelabeler

A desktop application for de-identifying whole slide images, built with Electron. [View the project homepage](https://braindigitalslidearchive.github.io/SlideRelabeler/) for more information and to download installers.

The project is modeled on https://github.com/pearcetm/svs-deidentifier and incorporates modified code from https://github.com/DigitalSlideArchive/DSA-WSI-DeID.

## Architecture

| Layer | Role |
|-------|------|
| **Electron main** (`src/main.js`, `src/handlers.js`) | Windows, dialogs, IPC, persistence; launches the Python engine |
| **Renderer** (React / Redux / Redux-Saga) | Main UI: file list, Settings (`config-v2`), delivery, Help; Viewer window uses OpenSeadragon |
| **Python engine** (`src/python/`, gRPC bridge) | WSI metadata/label work via DeidTools / large_image; packaged with PyInstaller for distributables |
| **Integrations** | Local save; optional upload to Digital Slide Archive (Girder) and Globus |

Development runs the engine as a live Python process from the `sliderelabeler` conda env. Packaged builds ship a PyInstaller `engine` binary as an Electron extra resource.

## Getting started

1. Clone: `git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git` then `cd SlideRelabeler`
2. Create the conda env:
   - macOS: `conda env create -f environment-macos.yml`
   - Windows: `conda env create -f environment-windows.yml`
3. Activate: `conda activate sliderelabeler`
4. Install JS deps: `npm install`
5. Launch: `npm run dev`

`npm run dev` resolves the `sliderelabeler` env, sets `PYTHON` / `CONDA_PREFIX`, and puts that env’s `bin` first on `PATH` (avoids pyenv / Homebrew shims). Use bare `npm start` only if your shell already points `python` at the correct interpreter.

If the Python backend fails to start:

```bash
conda run -n sliderelabeler python -c "import grpc; import large_image"
```

### macOS Apple Silicon

On arm64, `large_image_source_tiff.tiff_reader` clears/extends pylibtiff’s `TIFFGetField.argtypes` in ways that break the Mac variadic ABI (SIGBUS/SIGSEGV when opening Aperio `.svs` via `TiffFileTileSource`). The engine auto-installs a compatibility guard (`src/python/libtiff_guard.py`) at startup. Plain `npm run dev` is enough for Aperio slides. To force the guard on or off: `SLIDERELABELER_PATCH_LIBTIFF=1` or `=0`, or `./scripts/dev-patch-libtiff.sh` (force on).

> Note: on some Apple Silicon setups, `pip install large-image[common]` failed because `rawpy` was missing on PyPI for that architecture. Cloning/installing `rawpy` after `brew install cmake` unblocked `large-image` — see [rawpy#171](https://github.com/letmaik/rawpy/issues/171#issuecomment-1489973513).

## Building a distributable

- **`npm run package`** / **`npm run make`** — conda-wrapped Electron Forge. Prefer these so `pyinstaller` comes from the env, not a system shim. Output is under `out/`.
- Do not run bare `electron-forge package` / `make` unless the env is activated and `which pyinstaller` points at conda.
- **`npm run startpib`** — rebuild the PyInstaller engine and start Electron using that binary (good for packaging smoke tests).
- **`npm run startpi`** — start with an already-built PyInstaller engine (skips rebuild).

More detail: [build_readme/macosx/README.md](build_readme/macosx/README.md), [BUILD_WINDOWS.md](BUILD_WINDOWS.md).

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/index.html](docs/index.html) | Project homepage (GitHub Pages) |
| [docs/config-ui-reference.md](docs/config-ui-reference.md) | Settings UI behavior (sections, actions, side effects) |
| [docs/config-ui-v2-style-spec.md](docs/config-ui-v2-style-spec.md) | Configuration visual kit / tokens |
| [src/components/config-v2/README.md](src/components/config-v2/README.md) | Short pointer for the Settings kit |

## `debug/mac-arm64-pylibtiff-sigbus/`

Standalone Python repro kit for the Apple Silicon **pylibtiff / `large_image` ctypes crash**. Root cause: `large_image_source_tiff.tiff_reader.patchLibtiff()` clears [pylibtiff #189](https://github.com/pearu/pylibtiff/pull/189) `TIFFGetField.argtypes`, then related call sites re-extend them incorrectly for variadic args → **SIGBUS/SIGSEGV** on normal Aperio `.svs` via `TiffFileTileSource`. Scripts run outside Electron/gRPC for layer-by-layer isolation; share [`UPSTREAM_BRIEF.md`](debug/mac-arm64-pylibtiff-sigbus/UPSTREAM_BRIEF.md) with maintainers. App mitigation: `src/python/libtiff_guard.py`. Details: [debug/mac-arm64-pylibtiff-sigbus/README.md](debug/mac-arm64-pylibtiff-sigbus/README.md).

## Useful links

- Electron + Python packaging: [Stack Overflow](https://stackoverflow.com/questions/67146654/how-to-compile-python-electron-js-into-desktop-app-exe), Simon Willison [TIL](https://til.simonwillison.net/electron/python-inside-electron) (and [signing/notarizing](https://til.simonwillison.net/electron/sign-notarize-electron-macos))
- [Electron](https://www.electronjs.org/docs/latest/) / [Electron Forge](https://www.electronforge.io/)
