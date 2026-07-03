# SlideRelabeler
A desktop application for de-identifying whole slide images built with electron. [View the project homepage](https://braindigitalslidearchive.github.io/SlideRelabeler/) for more information and to download the application installer.

## Design
The app has a modern and powerful frontend (React/Redux/Redux-Saga). The back-end server invokes python code to interact with the WSI files. It is packaged into a stand-alone application for easy installation and use.

The project is modeled on https://github.com/pearcetm/svs-deidentifier and 
incorporates modified code from https://github.com/DigitalSlideArchive/DSA-WSI-DeID.


## Getting started
1) Clone the repo: `git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git`.
2) Switch to the new directory: `cd SlideRelabeler`.
3) Create a working anaconda environment:
   - macOS: `conda env create -f environment-macos.yml`
   - Windows: `conda env create -f environment-windows.yml`
4) Activate the conda environment: `conda activate sliderelabeler`.
5) Install npm dependencies: `npm install`;
6) Launch the dev app: `npm run dev`;

`npm run dev` resolves the `sliderelabeler` conda environment and sets `PYTHON` to that env’s interpreter directly (bypassing pyenv or other shims on PATH). Use `npm start` only if your shell already points `python` at the correct interpreter.

On **macOS Apple Silicon**, the Python engine auto-enables a `libtiff` / `tiff_reader` compatibility guard at startup (ARM64 variadic ctypes fix; see `debug/mac-metadata-sigbus/README.md`). Plain `npm run dev` is sufficient for processing Aperio slides. To force the guard on or off explicitly: `SLIDERELABELER_PATCH_LIBTIFF=1` or `=0`, or use `./scripts/dev-patch-libtiff.sh` (force on). The old `dev-mac-metadata.sh` name is deprecated and forwards to `dev-patch-libtiff.sh`.

If the Python backend fails to start, verify dependencies in the conda env:

```bash
conda run -n sliderelabeler python -c "import grpc; import large_image"
```

> Note about `pip install large-image[common]`: on Macbook Pro MacOS Ventura 13.3 Apple M1 Max, `large-image` failed to install due to `rawpy` not being found on `pypi` - this is because of the M1 architecture. See https://github.com/letmaik/rawpy/issues/171#issuecomment-1489973513 and the rest of the thread for info. I ended up being able to clone the `rawpy` repo and install directly (after `brew install cmake`), and then `large-image` could be installed.

## Building the distributable application
Running `npm run dev` (or `npm start`) will open up the app, but won't create a bundle for distribution - no `SlideRelabeler.app` or `SlideRelabeler.exe` file will be generated. Development mode uses your local Python installation to run the backend script in a shell; prefer `npm run dev` so the conda env is used reliably.

Running `npm run startpib` (start **P**y**I**nstaller **B**uild) will package your python code into a stand-alone application using `pyinstaller`, and will launch the application
with a flag to use this python app rather than the system python. This is useful for testing the `pyinstaller` process.

Running `npm run startpi` (start **P**y**I**installer) will use a pre-built `pyinstaller` executable, but won't build it to save startup time. You can use this if you haven't changed your python code since the last build.

To build a stand-alone electron application, run `npm run make`. This will run `pyinstaller` followed by `electron-forge` to create the application. The app can be found in the `out/` directory.


Initial templating was done by:
```
npm init electron-app@latest . -- --template=vite
```
within the root directory, so `package.json` etc. were all installed in the root project directory (replace the `.` with `dir-name` would install in a new subdirectory).


## Useful info:
Useful [stackoverflow](https://stackoverflow.com/questions/67146654/how-to-compile-python-electron-js-into-desktop-app-exe) question and answer.

Blog posts by Simon Willison [here](https://til.simonwillison.net/electron/python-inside-electron) and perhaps the linked one [here](https://til.simonwillison.net/electron/sign-notarize-electron-macos) if signing and notarizing is needed for the bundled Mac app.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier.

The architecture is based on [Electron](https://www.electronjs.org/docs/latest/) - see [electronforge.io](https://www.electronforge.io/) for details about how to quickly run the app during development, build into a distributable application, etc.
