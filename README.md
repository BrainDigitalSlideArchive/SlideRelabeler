# SlideRelabeler

A desktop application for de-identifying whole slide images, built with Electron. [View the project homepage](https://braindigitalslidearchive.github.io/SlideRelabeler/) for more information and to download installers.

The project is modeled on https://github.com/pearcetm/svs-deidentifier and incorporates modified code from https://github.com/DigitalSlideArchive/DSA-WSI-DeID.

## Architecture

| Layer | Role |
|-------|------|
| **Electron main** (`src/main.js`, `src/handlers.js`) | Windows, dialogs, IPC, persistence; launches the Python engine |
| **Renderer** (React / Redux / Redux-Saga) | Main UI: file list, Settings (`config-v2`), delivery, Help; Viewer window uses OpenSeadragon |
| **Python engine** (`src/python/`, gRPC bridge) | WSI metadata/label work via DeidTools / large_image; packaged with PyInstaller for distributables |
| **Integrations** | Local save; optional DSA / Globus upload; optional eSlide Manager input (see [Integrations](#integrations)) |

Development runs the engine as a live Python process from the `sliderelabeler` conda env. Packaged builds ship the Python engine (and Globus tools — see below) inside the app.

## Getting started

1. Clone: `git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git` then `cd SlideRelabeler`
2. Create the conda env:
   - macOS: `conda env create -f environment-macos.yml`
   - Windows: `conda env create -f environment-windows.yml`
   - Linux: `conda env create -f environment-linux.yml`
3. Activate: `conda activate sliderelabeler`
4. Install JS deps: `npm install`
5. **Develop:** `npm run dev` — launches Electron with live Python from the conda env (conda-wrapped so `PYTHON` / `PATH` bypass pyenv and Homebrew shims). Prefer this over bare `npm start`.
6. **Package:** when you want a distributable, run `npm run package` (app only) or `npm run make` (installer / zip / deb / rpm). These use the same conda wrapper so `pyinstaller` comes from the env. Output is under `out/`.

Platform-specific packaging notes: [build_readme/macosx/README.md](build_readme/macosx/README.md), [build_readme/linux/README.md](build_readme/linux/README.md), [BUILD_WINDOWS.md](BUILD_WINDOWS.md).

## Integrations

SlideRelabeler can save de-identified files locally and optionally talk to a few external systems. Turn each one on in **Configuration** when you need it.

### Upload / output

| Integration | What it does | What you need |
|-------------|--------------|---------------|
| **Digital Slide Archive (DSA)** | Upload finished slides to a DSA / Girder server | Server URL, username, and password |
| **Globus** | Transfer finished slides to a Globus collection | Globus account login, a destination collection, and this computer set up as a Globus endpoint (see below) |

### Input / data loading

| Integration | What it does | What you need |
|-------------|--------------|---------------|
| **eSlide Manager** | Pull slide / case data from an eSlide Manager API | API endpoint URL and credentials |

DSA and eSlide Manager are straightforward: point at a server and sign in. Globus is a bit different because transfers go through Globus’s own tools and network.

### Globus specifics

**Endpoint.** To be used as a source of Globus file transfers, your computer must be configured as a Globus endpoint. Install and run [Globus Connect Personal](https://docs.globus.org/globus-connect-personal/) on the machine that runs SlideRelabeler so files can be read from here during upload. In the app, set that local endpoint ID under Configuration → Output delivery (Auto-detect will try to find it). Platform install guides: [Mac](https://docs.globus.org/globus-connect-personal/install/mac/), [Windows](https://docs.globus.org/globus-connect-personal/install/windows/), [Linux](https://docs.globus.org/globus-connect-personal/install/linux/).

**Packaged app users.** Installers built with `npm run package` / `npm run make` already include the Globus CLI. End users do not install it separately.

**Developers and builders.** `globus-cli` is part of the `sliderelabeler` conda environment (`environment-macos.yml` / `environment-windows.yml` / `environment-linux.yml`). Creating or updating the env as in Getting started is enough for Globus CLI inclusion in `npm run dev` and for packaging. Confirm with `globus --version` or `python -c "import globus_cli"`. Further reading: [Globus CLI](https://docs.globus.org/cli/). If an existing env was created before this dependency was listed, refresh it once with `conda env update -f environment-<platform>.yml`. *Important*: If you want to test Globus uploads with `npm run dev` or the built package, you still need to configure your machine as an endpoint (see above). If you are just building the app but not wanting to actually use Globus, this is not needed.

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/index.html](docs/index.html) | Project homepage (GitHub Pages) |
| [src/components/config-v2/README.md](src/components/config-v2/README.md) | Settings (Configuration) UI kit |

## Troubleshooting

### Python backend won’t start

`npm run dev` / `package` / `make` refuse to launch if the `sliderelabeler` env can’t import required packages. Confirm outside npm:

```bash
conda run -n sliderelabeler python -c "import grpc; import large_image"
```

Failure means that env is incomplete or broken (not an npm issue). Recreate or update from `environment-macos.yml` / `environment-windows.yml` / `environment-linux.yml`. On some Apple Silicon machines, installing `large-image` failed because `rawpy` lacked a wheel — cloning/installing `rawpy` after `brew install cmake` unblocked it ([rawpy#171](https://github.com/letmaik/rawpy/issues/171#issuecomment-1489973513)).

Do not run bare `electron-forge package` / `make` unless the env is activated and `which pyinstaller` points at conda.

### PyInstaller packaging of the Python engine

Freezing Python with PyInstaller is often a sticking point in Electron+Python apps. To verify the standalone engine without a full installer build (conda-wrapped):

- `npm run startpib` — rebuild the engine with PyInstaller, then launch the app using it
- `npm run startpi` — launch using an engine you already built (skips rebuild)

### Apple Silicon (libtiff / large_image)

On arm64, the engine **auto-installs** a compatibility guard (`src/python/libtiff_guard.py`) so Aperio `.svs` opens don’t SIGBUS via `TiffFileTileSource`. You normally don’t need to set anything. Overrides: `SLIDERELABELER_PATCH_LIBTIFF=1` or `=0`, or `./scripts/dev-patch-libtiff.sh` (force on).

Repro kit and upstream brief: [debug/mac-arm64-pylibtiff-sigbus/](debug/mac-arm64-pylibtiff-sigbus/) ([README](debug/mac-arm64-pylibtiff-sigbus/README.md), [UPSTREAM_BRIEF.md](debug/mac-arm64-pylibtiff-sigbus/UPSTREAM_BRIEF.md)).

## Useful links

- Electron + Python packaging: [Stack Overflow](https://stackoverflow.com/questions/67146654/how-to-compile-python-electron-js-into-desktop-app-exe), Simon Willison [TIL](https://til.simonwillison.net/electron/python-inside-electron) (and [signing/notarizing](https://til.simonwillison.net/electron/sign-notarize-electron-macos))
- [Electron](https://www.electronjs.org/docs/latest/) / [Electron Forge](https://www.electronforge.io/)
