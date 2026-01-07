#!/bin/bash

# To use this script you must install miniconda/anaconda and nodejs
# and have them available in your PATH

set -e  # Exit on error

ENV_NAME="sliderelabeler"

echo "=========================================="
echo "SlideRelabeler macOS Build Script"
echo "=========================================="
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo "Detected Apple Silicon (ARM64) architecture"
elif [ "$ARCH" = "x86_64" ]; then
    echo "Detected Intel (x86_64) architecture"
else
    echo "Warning: Unknown architecture: $ARCH"
fi
echo ""

# Check if npm/node is installed and in path
echo "Checking if npm/node is installed and in path"
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm/node must be installed to use this script"
    echo "Install Node.js from https://nodejs.org/en/download/"
    echo "Or install via Homebrew: brew install node"
    echo "Make sure that npm is in your PATH environment variable"
    exit 1
else
    echo "✓ npm is available: $(which npm)"
    echo "  Node version: $(node --version)"
    echo "  npm version: $(npm --version)"
fi
echo ""

# Check if conda is installed and in path
echo "Checking if conda is installed and in path"
if ! command -v conda &> /dev/null; then
    echo "ERROR: Conda must be installed and in the path to use this script"
    echo "Install Miniconda or Anaconda:"
    echo "  - Homebrew: brew install miniconda"
    echo "  - Or download from: https://docs.conda.io/en/latest/miniconda.html"
    echo "  - For Apple Silicon: https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh"
    echo "  - For Intel: https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh"
    echo ""
    echo "After installation, initialize conda for your shell:"
    echo "  conda init bash  # or zsh if using zsh"
    echo "  source ~/.bashrc  # or ~/.zshrc"
    exit 1
else
    echo "✓ conda is available: $(which conda)"
    echo "  Conda version: $(conda --version)"
fi
echo ""

# Initialize conda for this shell session if needed
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "Initializing conda for this shell session..."
    eval "$(conda shell.bash hook)"
fi

# Check if conda environment exists
echo "Checking if conda environment '$ENV_NAME' exists"
if ! conda env list | grep -q "^${ENV_NAME}\s"; then
    echo "Conda environment '$ENV_NAME' does not exist"
    echo "Creating environment '$ENV_NAME'"
    echo ""
    echo "Note: If you encounter errors related to 'rawpy' or 'large-image[common]' installation,"
    echo "this may be an M1-specific issue. See the troubleshooting section in build_readme/macosx/README.md"
    echo ""
    
    # Accept terms of service for conda channels
    conda config --set always_yes yes
    conda tos accept 2>/dev/null || true
    conda tos accept --override-channels --channel conda-forge 2>/dev/null || true
    
    # Create the environment using the project's environment.yml file
    conda env create -f environment.yml
    
    if ! conda env list | grep -q "^${ENV_NAME}\s"; then
        echo "ERROR: Conda environment '$ENV_NAME' was not created"
        echo "Please check the error messages above and reach out to the developer for help"
        exit 1
    fi
    echo "✓ Conda environment '$ENV_NAME' created successfully"
else
    echo "✓ Conda environment '$ENV_NAME' already exists"
fi
echo ""

# Activate conda environment
echo "Activating conda environment '$ENV_NAME'"
conda activate "$ENV_NAME"
echo "✓ Activated conda environment: $CONDA_DEFAULT_ENV"
echo ""

# Check if large-image is installed (to catch any rawpy issues early)
echo "Checking if large-image is installed..."
if python -c "import large_image" 2>/dev/null; then
    echo "✓ large-image is installed"
else
    echo "WARNING: large-image is not installed or not importable"
    echo "This may indicate an issue with the conda environment setup."
    echo "If you see errors related to 'rawpy', this may be an M1-specific issue."
    echo "See the troubleshooting section in build_readme/macosx/README.md for more information."
    echo ""
    echo "Attempting to continue with build..."
fi
echo ""

# Run npm install to install nodejs dependencies
echo "Running npm install to install nodejs dependencies"
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed"
    echo "Please check the error messages above and reach out to the developer for help"
    exit 1
fi
echo "✓ npm dependencies installed"
echo ""

# Run npm run make to build the project
echo "Running npm run make to build the project"
echo "This will run PyInstaller followed by Electron Forge to create the application."
echo "This may take several minutes..."
echo ""
npm run make
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    echo "Please check the error messages above and reach out to the developer for help"
    exit 1
fi
echo ""

# Check if the build was successful
BUILD_PATH="./out/make/zip/darwin/arm64"
if [ "$ARCH" = "x86_64" ]; then
    BUILD_PATH="./out/make/zip/darwin/x64"
fi

if [ -d "$BUILD_PATH" ] && [ -n "$(find "$BUILD_PATH" -name "*.zip" 2>/dev/null)" ]; then
    echo "=========================================="
    echo "✓ Build was successful!"
    echo "=========================================="
    echo ""
    ZIP_FILE=$(find "$BUILD_PATH" -name "*.zip" | head -1)
    if [ -n "$ZIP_FILE" ]; then
        FULL_PATH=$(cd "$(dirname "$ZIP_FILE")" && pwd)/$(basename "$ZIP_FILE")
        echo "The build is located at:"
        echo "  $FULL_PATH"
        echo ""
        echo "To use the application:"
        echo "  1. Extract the zip file"
        echo "  2. Open SlideRelabeler.app"
        echo ""
    fi
else
    echo "=========================================="
    echo "ERROR: Build was not successful"
    echo "=========================================="
    echo ""
    echo "Expected build output at: $BUILD_PATH"
    echo "Please check the error messages above and reach out to the developer for help"
    exit 1
fi
