# SlideRelabeler macOS Build Instructions

## Overview

SlideRelabeler is an application that allows users to de-identify whole slide images on their computers and share those files with others. The intended flow of the application is as follows:

1. Select an input directory of files to be de-identified containing whole slide images.
2. Open a CSV file containing a table of files to be de-identified. The most critical column of the table is the filename, which will allow the application to match the files in the input directory with the files in the CSV file.
3. Select an output directory where the de-identified files will be saved.
4. Select "Process Files" and wait for the application to finish.
5. Click on the image thumbnail after processing to view the whole slide image and verify it was de-identified.
6. To test the output, you can open the output directory and use your choice of program.

## Prerequisites

Before building SlideRelabeler on macOS, you need to install the following:

### 1. Homebrew (Package Manager)

If you don't have Homebrew installed, install it from [https://brew.sh](https://brew.sh):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Miniconda or Anaconda

Install Miniconda (recommended) or Anaconda:

**For Apple Silicon (M1/M2/M3):**
```bash
# Using Homebrew
brew install miniconda

# Or download directly
curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
bash Miniconda3-latest-MacOSX-arm64.sh
```

**For Intel Macs:**
```bash
# Using Homebrew
brew install miniconda

# Or download directly
curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
bash Miniconda3-latest-MacOSX-x86_64.sh
```

After installation, initialize conda for your shell:

```bash
conda init bash  # Use 'zsh' if you're using zsh
source ~/.bashrc  # Use ~/.zshrc if you're using zsh
```

### 3. Node.js and npm

Install Node.js (which includes npm):

```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/en/download/
```

Verify installation:
```bash
node --version
npm --version
```

## Packaging note (conda only)

The frozen Python engine is built **only** from the `sliderelabeler` conda environment (`environment-macos.yml`) — the same packages CI installs. That includes conda-forge `libvips` and `openslide` (plus pip `openslide-python`). Do **not** rely on Homebrew or `DeidTools/mac-bin` for OpenSlide/libvips: those link system iconv (`_iconv`) and break when conda `libiconv` (`_libiconv`) is on `DYLD_*` for the bundled glib stack. Prefer `npm run package` / `npm run make` (or `node scripts/run-with-conda.mjs …`) with the conda env available.


## Building the Application

You have two options for building the application:

### Option A: Automated Build Script (Recommended)

The easiest way to build SlideRelabeler is to use the automated build script:

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git
   cd SlideRelabeler
   ```

2. Make the build script executable (if needed):
   ```bash
   chmod +x build_macos.sh
   ```

3. Run the build script:
   ```bash
   ./build_macos.sh
   ```

The script will:
- Check for required dependencies (conda, npm)
- Create the conda environment if it doesn't exist
- Install npm dependencies
- Build the application using PyInstaller and Electron Forge
- Validate the build output

### Option B: Manual Build Steps

If you prefer to build manually or need more control over the process:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git
   cd SlideRelabeler
   ```

2. **Create the conda environment:**
   ```bash
   conda env create -f environment-macos.yml
   ```

   **Note:** If you encounter errors related to `rawpy` or `large-image[common]` installation, see the Troubleshooting section below.

3. **Activate the conda environment:**
   ```bash
   conda activate sliderelabeler
   ```

4. **Install npm dependencies:**
   ```bash
   npm install
   ```

5. **Build the application** (with the conda env activated, or via the npm scripts that wrap conda):
   ```bash
   npm run package
   # or full distributable:
   npm run make
   ```

   This command will:
   - Run PyInstaller to freeze the Python engine from the conda env into `dist/engine.app` (no Homebrew libs)
   - Run Electron Forge to create the final application bundle
   - The output will be in the `out/` directory

## Verifying the Build

After a successful build, you can find the application at:

**For Apple Silicon (M1/M2/M3):**
```
out/make/zip/darwin/arm64/SlideRelabeler-darwin-arm64-<version>.zip
```

**For Intel Macs:**
```
out/make/zip/darwin/x64/SlideRelabeler-darwin-x64-<version>.zip
```

To use the application:

1. Extract the zip file (double-click it or use `unzip` command)
2. Open `SlideRelabeler.app` from the extracted folder
3. If macOS shows a security warning, you may need to:
   - Right-click the app and select "Open"
   - Or go to System Settings > Privacy & Security and allow the app to run

## Troubleshooting

### Conda Environment Issues

**Problem:** `conda: command not found`

**Solution:** 
- Make sure conda is installed and initialized for your shell
- Run `conda init bash` (or `conda init zsh` for zsh) and restart your terminal
- Or add conda to your PATH manually

**Problem:** Conda environment creation fails

**Solution:**
- Make sure you have accepted conda's terms of service: `conda tos accept`
- Check that you have enough disk space
- Try updating conda: `conda update conda`

### rawpy / large-image Installation Issues (M1 Macs)

**Problem:** Installation fails with errors related to `rawpy` or `large-image[common]`

**Note:** This is a known historical issue with M1 Macs. The current build process should handle this automatically, but if you encounter issues:

1. The error typically occurs during `conda env create -f environment-macos.yml`
2. If `large-image[common]` fails to install due to rawpy, you may need to manually build rawpy:
   ```bash
   # Install cmake if not already installed
   brew install cmake
   
   # Clone and build rawpy
   git clone https://github.com/letmaik/rawpy.git
   cd rawpy
   pip install .
   cd ..
   
   # Then try installing large-image again
   pip install large-image[common]
   ```

3. For more information, see: https://github.com/letmaik/rawpy/issues/171

**Important:** This issue should be tested during the build process. If you encounter it, please document the specific error message and Python/conda versions for future reference.

### npm Installation Issues

**Problem:** `npm: command not found`

**Solution:**
- Install Node.js from [nodejs.org](https://nodejs.org) or via Homebrew: `brew install node`
- Make sure Node.js is in your PATH

**Problem:** `npm install` fails

**Solution:**
- Make sure you're in the project root directory
- Try clearing npm cache: `npm cache clean --force`
- Try deleting `node_modules` and `package-lock.json` and running `npm install` again

### Build Failures

**Problem:** `npm run make` fails

**Solution:**
- Make sure the conda environment is activated: `conda activate sliderelabeler`
- Confirm conda-forge natives are present (`libvips`, `openslide`) and that PyInstaller is run via `npm run package` / `node scripts/run-with-conda.mjs`
- Verify that all dependencies in `environment-macos.yml` installed correctly
- Check the error messages for specific missing dependencies

**Problem:** Build succeeds but app won't launch

**Solution:**
- Make sure you extracted the zip file completely
- Check macOS security settings (System Settings > Privacy & Security)
- Try right-clicking the app and selecting "Open" to bypass Gatekeeper
- Check Console.app for error messages

### Architecture-Specific Issues

**Problem:** Build script detects wrong architecture

**Solution:**
- The script auto-detects architecture using `uname -m`
- For Apple Silicon, it should show `arm64`
- For Intel, it should show `x86_64`
- If detection is wrong, you can manually check: `uname -m`

## Development Mode

If you want to run the application in development mode (without building a distributable):

```bash
npm run dev
```

This launches Electron and sets `PYTHON` to the absolute path of the `sliderelabeler` conda interpreter (bypassing pyenv or other shims on PATH). You do not need `conda activate` for this command.

If the backend fails with `ModuleNotFoundError` (for example, missing `grpc`), confirm the conda env has the required packages:

```bash
conda run -n sliderelabeler python -c "import grpc; import large_image"
```

`npm start` is still available but uses whatever `python` resolves to in your shell.

To test the PyInstaller build without creating the full Electron bundle:

```bash
conda activate sliderelabeler
npm run startpib  # Builds PyInstaller and launches app
```

Or use a pre-built PyInstaller executable:

```bash
conda activate sliderelabeler
npm run startpi  # Uses existing PyInstaller build
```

## Providing Feedback

If you encounter any issues or have any suggestions for SlideRelabeler, please:

1. Create an issue on the project GitHub page: [https://github.com/BrainDigitalSlideArchive/SlideRelabeler](https://github.com/BrainDigitalSlideArchive/SlideRelabeler)
2. Contact the developers:
   - Thomas Pearce: tmpearce@gmail.com
   - Aaron Rosado: arosad2@protonmail.ch

When reporting issues, please include:
- Your macOS version
- Your Mac architecture (Apple Silicon or Intel)
- The exact error messages you encountered
- Steps to reproduce the issue
