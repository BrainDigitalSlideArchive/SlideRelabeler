# SlideRelabeler Linux Build Instructions

## Prerequisites

1. **Miniconda or Anaconda** — [Miniconda](https://docs.conda.io/en/latest/miniconda.html) for Linux (x86_64 or aarch64).
2. **Node.js and npm** — current LTS from [nodejs.org](https://nodejs.org/) or your distro packages.
3. Optional system libraries if conda wheels are incomplete on your distro (often not needed when using `environment-linux.yml`): OpenSlide / libvips. Prefer fixing via conda first.

After installing Miniconda:

```bash
conda init bash   # or zsh
source ~/.bashrc
```

## Getting started (parity with macOS / Windows)

```bash
git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git
cd SlideRelabeler
conda env create -f environment-linux.yml
conda activate sliderelabeler
npm install
npm run dev
```

`npm run dev` is conda-wrapped (same as other OSes): it sets `PYTHON` / `CONDA_PREFIX` and puts the env `bin` first on `PATH`.

## Packaging

```bash
npm run package   # app directory under out/
npm run make      # also builds .deb / .rpm via Electron Forge
```

These scripts use the same conda wrapper so `pyinstaller` comes from the env. Artifacts:

- Unpackaged app: `out/SlideRelabeler-linux-*`
- Deb/rpm: under `out/make/` (maker-deb / maker-rpm)

PyInstaller produces `dist/engine` and `dist/globus_cli` (same layout as Windows). Forge copies them into the app `resources` folder.

## Verification checklist (on a Linux host)

1. `conda run -n sliderelabeler python -c "import grpc; import large_image"`
2. `npm run dev` — engine starts; open a sample WSI
3. `npm run package` — confirm `resources/engine` and `resources/globus_cli` exist and Globus/DSA flows work as needed
4. If imports or native libs fail, update `environment-linux.yml` or note distro packages here

## See also

- Root [README.md](../../README.md)
- [build_readme/macosx/README.md](../macosx/README.md)
- [BUILD_WINDOWS.md](../../BUILD_WINDOWS.md)
