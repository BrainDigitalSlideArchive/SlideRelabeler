# Building SlideRelabeler on Windows

This guide provides step-by-step instructions for building the SlideRelabeler application on Windows. The build process creates a standalone Windows installer that includes both the Electron frontend and the Python backend packaged as a single executable.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Automated Build Process](#automated-build-process)
4. [Manual Build Process](#manual-build-process)
5. [Troubleshooting](#troubleshooting)
6. [Verifying the Build](#verifying-the-build)

---

## Prerequisites

Before building the application, ensure you have the following installed and configured:

### 1. Miniconda3 (Recommended) or Anaconda

**Miniconda3 is recommended** for this project because:
- Smaller download size (~400MB vs ~600MB+ for Anaconda)
- Faster installation
- The project's `environment.yml` specifies all required dependencies, so you don't need Anaconda's pre-installed packages

**Installation Steps:**

1. **Download Miniconda3:**
   - Direct download: https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe
   - Or visit: https://docs.conda.io/en/latest/miniconda.html

2. **Run the installer:**
   - During installation, **check the box** "Add Miniconda3 to PATH environment variable"
   - If you skip this step, you'll need to manually add `C:\ProgramData\miniconda3\condabin` (or your installation directory) to your system PATH

3. **Verify installation:**
   - Open a new PowerShell window (important: must be new to pick up PATH changes)
   - Run: `conda --version`
   - You should see output like: `conda 24.x.x`
   - Run: `conda info`
   - This should display conda information without errors

**Alternative: Anaconda**
- If you prefer Anaconda, download from: https://www.anaconda.com/products/distribution
- Follow the same PATH configuration steps

### 2. Node.js and npm

**Installation Steps:**

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended: v18 or v20)
   - The installer includes npm automatically

2. **Run the installer:**
   - Use the default installation options
   - The installer should automatically add Node.js to your PATH

3. **Verify installation:**
   - Open PowerShell
   - Run: `node --version`
   - You should see output like: `v18.x.x` or `v20.x.x`
   - Run: `npm --version`
   - You should see output like: `9.x.x` or `10.x.x`

### 3. System Requirements

- **Operating System:** Windows 10 or Windows 11
- **PowerShell:** Version 5.1 or later (comes with Windows 10/11)
- **Disk Space:** ~5GB free space for:
  - Conda environment: ~2-3GB
  - Node.js dependencies: ~500MB
  - Build artifacts: ~1-2GB
- **RAM:** 8GB minimum, 16GB recommended (for building with PyInstaller)

### 4. Git (Optional but Recommended)

If you need to clone the repository:
- Download: https://git-scm.com/download/win
- Or use GitHub Desktop: https://desktop.github.com/

---

## Initial Setup

### 1. Clone or Navigate to the Repository

If you haven't already cloned the repository:

```powershell
git clone https://github.com/BrainDigitalSlideArchive/SlideRelabeler.git
cd SlideRelabeler
```

Or if you already have the repository, navigate to it:

```powershell
cd C:\path\to\SlideRelabeler
```

### 2. Verify Prerequisites

Before running the build, verify all prerequisites are accessible:

**Check Conda:**
```powershell
conda --version
conda info
```

**Check Node.js and npm:**
```powershell
node --version
npm --version
```

**Check PowerShell Execution Policy:**
```powershell
Get-ExecutionPolicy
```

If the policy is `Restricted`, you'll need to change it to allow script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

This allows you to run local scripts. You may be prompted to confirm.

### 3. Verify PATH Configuration

The build script (`build_windows.ps1`) will attempt to automatically detect and configure paths, but you can verify manually:

**Check if conda is in PATH:**
```powershell
where.exe conda
```

**Check if npm is in PATH:**
```powershell
where.exe npm
```

If either command returns "INFO: Could not find files", you'll need to add them to your PATH manually or ensure the build script can find them.

---

## Automated Build Process

The easiest way to build the application is using the provided PowerShell script. This script automates all build steps.

### Quick Start

1. **Open PowerShell** in the project root directory

2. **Run the build script:**
   ```powershell
   .\build_windows.ps1
   ```

3. **Wait for completion** (20-35 minutes for first build, 10-15 minutes for subsequent builds)

4. **Find your installer** at the path displayed at the end of the build

### What the Script Does

The `build_windows.ps1` script performs the following steps automatically:

#### Step 1: Setup Dependency Paths
- Sources `setup_dependency_paths.ps1` to configure PATH for conda and npm
- Automatically detects Miniconda3/Anaconda installation
- Adds conda and npm to PATH if not already present

**Expected Output:**
```
Checking if npm/node is installed and in path
Npm is already in the path
Checking if conda is installed and in path
Conda is already in the path
```

#### Step 2: Create Conda Environment
- Checks if the `sliderelabeler` conda environment exists
- If not, creates it from `environment.yml`
- Accepts conda terms of service for default and conda-forge channels
- Installs Python 3.12 and all required packages (large-image, openslide, pyinstaller, etc.)

**Expected Output:**
```
Checking if conda environment sliderelabeler exists
Conda environment sliderelabeler does not exist
Creating environment sliderelabeler
...
# This step takes 10-15 minutes on first run
```

**Key Packages Installed:**
- Python 3.12
- large-image and related tile sources (openslide, gdal, tiff, ometiff)
- openslide-python
- pyinstaller
- pyvips
- pyproj
- And many other dependencies (see `environment.yml`)

#### Step 3: Activate Environment and Fix OpenSlide Bug
- Activates the `sliderelabeler` conda environment
- Locates the large_image OpenSlide tile source file
- Comments out a problematic line that causes issues with large files

**Expected Output:**
```
Activating conda environment sliderelabeler
Checking if large image tile source is installed
Replacing a needed line in the OpenSlide tile source for a bug fix for large files
Found matching line for ... at line X
Replacing line ... at line X in ... with # ...
```

**Technical Details:**
- File modified: `{CONDA_PREFIX}/envs/sliderelabeler/Lib/site-packages/large_image_source_openslide/__init__.py`
- Line commented: `self._openslide.read_region((0, 0), svslevel, (1, 1))`
- This is a workaround for a bug that affects large whole-slide image files

#### Step 4: Install Node.js Dependencies
- Runs `npm install` to install all Electron and frontend dependencies
- Installs packages listed in `package.json`

**Expected Output:**
```
Running npm install to install nodejs dependencies
...
added XXX packages in XXs
```

**Key Dependencies:**
- Electron 32.3.3
- React 18.3.1
- Redux Toolkit and Redux Saga
- Electron Forge
- OpenSeaDragon
- AG Grid
- And many others (see `package.json`)

#### Step 5: Build Python Executable (PyInstaller)
- Runs `npm run make`, which triggers Electron Forge's prePackage hook
- Electron Forge runs PyInstaller to create `dist/engine/engine.exe`
- PyInstaller bundles Python, all dependencies, and required binaries into a standalone executable

**Expected Output:**
```
Running npm run make to build the project
** Cleaning out directory **
** Cleaning build directory **
** Cleaning output directory **
** Running pyinstaller on ./pyinstaller/engine.spec **
...
```

**What PyInstaller Does:**
- Packages `src/python/engine.py` as the entry point
- Bundles all Python dependencies from the conda environment
- Includes required DLLs (libopenslide-1.dll, libvips-42.dll, etc.)
- Includes GDAL data files
- Creates `dist/engine/engine.exe` (Windows) or `dist/engine.app` (macOS)

**Build Time:** ~5-10 minutes

#### Step 6: Package Electron Application
- Electron Forge packages the Electron app
- Bundles the Python executable as an extra resource
- Creates a Windows installer using Squirrel

**Expected Output:**
```
...
Packaging application
Making a squirrel distributable for win32/x64
...
```

**Output Location:**
- Installer: `out/make/squirrel.windows/x64/SlideRelabeler Setup X.X.X.exe`
- The full path will be displayed at the end

#### Step 7: Verify Build Success
- Script checks if the build output exists
- Displays the full path to the installer

**Expected Output:**
```
Build was successful
The build is @ C:\SoftwareDevelopment\SlideRelabeler\out\make\squirrel.windows\x64\SlideRelabeler Setup 0.1.8.exe
Please navigate to the containing folder and install the application
```

### Build Time Estimates

- **First Build (Full):** 20-35 minutes
  - Conda environment creation: 10-15 minutes
  - npm install: 2-5 minutes
  - PyInstaller: 5-10 minutes
  - Electron packaging: 2-5 minutes

- **Subsequent Builds:** 10-15 minutes
  - Conda environment already exists: 0 minutes
  - npm install (if dependencies changed): 2-5 minutes
  - PyInstaller: 5-10 minutes
  - Electron packaging: 2-5 minutes

---

## Manual Build Process

If you prefer to run the build steps manually, or if you encounter issues with the automated script, follow these steps:

### Step 1: Setup Dependency Paths

Source the setup script to configure paths:

```powershell
. .\setup_dependency_paths.ps1
```

This script:
- Detects conda and npm installations
- Adds them to PATH if needed
- Sets `$CONDA_INSTALL_DIR` and `$NODE_INSTALL_DIR` variables

### Step 2: Create Conda Environment

**Check if environment exists:**
```powershell
conda env list | Select-String -Pattern sliderelabeler
```

**If it doesn't exist, create it:**
```powershell
# Accept conda terms of service (required for first-time use)
conda tos accept
conda tos accept --override-channels --channel conda-forge

# Create environment from environment.yml
conda env create -f environment.yml
```

**Verify creation:**
```powershell
conda env list
```

You should see `sliderelabeler` in the list.

### Step 3: Activate Environment

```powershell
# Initialize conda for PowerShell
& "$CONDA_INSTALL_DIR\shell\condabin\conda-hook.ps1"

# Activate the environment
conda activate sliderelabeler
```

**Verify activation:**
```powershell
conda info
# Should show "active environment: sliderelabeler"
python --version
# Should show Python 3.12.x
```

### Step 4: Fix OpenSlide Bug

This step comments out a problematic line in the large_image OpenSlide tile source:

```powershell
# Get the environment path
$envPath = (conda info --json | ConvertFrom-Json).default_prefix
$largeImageOpenSlideTileSourcePath = "$envPath\Lib\site-packages\large_image_source_openslide\__init__.py"

# Verify file exists
Test-Path $largeImageOpenSlideTileSourcePath

# Find and comment the problematic line
$regex = "\s+self\._openslide\.read_region\(\(0, 0\), svslevel, \(1, 1\)\)"
$content = Get-Content $largeImageOpenSlideTileSourcePath
$newContent = $content | ForEach-Object {
    if ($_ -match $regex) {
        "# $_"  # Comment out the line
    } else {
        $_      # Keep other lines as-is
    }
}
$newContent | Set-Content -Path $largeImageOpenSlideTileSourcePath
```

**Verify the fix:**
```powershell
Select-String -Path $largeImageOpenSlideTileSourcePath -Pattern "read_region"
# Should show the line is now commented with #
```

### Step 5: Install Node.js Dependencies

```powershell
npm install
```

This installs all dependencies listed in `package.json`. Expected time: 2-5 minutes.

### Step 6: Build Python Executable with PyInstaller

**Option A: Let Electron Forge handle it (Recommended)**

When you run `npm run make`, Electron Forge's prePackage hook automatically runs PyInstaller. This is the recommended approach.

**Option B: Run PyInstaller manually**

If you want to test PyInstaller separately:

```powershell
# Ensure you're in the project root
cd C:\path\to\SlideRelabeler

# Run PyInstaller
pyinstaller -y --clean ./pyinstaller/engine.spec
```

This creates `dist/engine/engine.exe`.

**Verify the executable:**
```powershell
Test-Path .\dist\engine\engine.exe
```

### Step 7: Build Electron Application

```powershell
npm run make
```

This command:
1. Triggers the prePackage hook in `forge.config.js`
2. Cleans `out/`, `build/`, and `output/` directories
3. Runs PyInstaller (if not already done)
4. Packages the Electron app with Electron Forge
5. Creates the Windows installer

**Expected Output Location:**
```
.\out\make\squirrel.windows\x64\SlideRelabeler Setup X.X.X.exe
```

### Step 8: Verify Build

```powershell
$buildPath = ".\out\make\squirrel.windows\x64\"
if ((Test-Path $buildPath) -and (Test-Path "$buildPath\*.exe")) {
    $installer = (Get-ChildItem -Path $buildPath -Filter "*.exe").FullName
    Write-Host "Build successful! Installer: $installer"
} else {
    Write-Host "Build failed - installer not found"
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "conda: command not found"

**Symptoms:**
- PowerShell reports "conda: The term 'conda' is not recognized"
- Build script fails at conda detection

**Solutions:**

1. **Verify Miniconda3/Anaconda is installed:**
   ```powershell
   Test-Path "C:\ProgramData\miniconda3\condabin\conda.bat"
   # Or check your installation directory
   ```

2. **Add conda to PATH manually:**
   - Open System Properties → Environment Variables
   - Add to User PATH: `C:\ProgramData\miniconda3\condabin` (adjust path as needed)
   - Restart PowerShell

3. **Or reinstall Miniconda3 with PATH option:**
   - Run the installer again
   - Check "Add Miniconda3 to PATH environment variable"

#### Issue: "npm: command not found"

**Symptoms:**
- PowerShell reports "npm: The term 'npm' is not recognized"
- Build script fails at npm detection

**Solutions:**

1. **Verify Node.js is installed:**
   ```powershell
   Test-Path "C:\Program Files\nodejs\npm.cmd"
   ```

2. **Add Node.js to PATH:**
   - Open System Properties → Environment Variables
   - Add to User PATH: `C:\Program Files\nodejs`
   - Restart PowerShell

3. **Reinstall Node.js:**
   - Download from https://nodejs.org/
   - Use default installation options (includes PATH setup)

#### Issue: Conda Environment Creation Fails

**Symptoms:**
- `conda env create -f environment.yml` fails
- Error messages about packages not found
- Timeout errors

**Solutions:**

1. **Accept conda terms of service:**
   ```powershell
   conda tos accept
   conda tos accept --override-channels --channel conda-forge
   ```

2. **Update conda:**
   ```powershell
   conda update conda
   ```

3. **Try creating environment with verbose output:**
   ```powershell
   conda env create -f environment.yml -v
   ```

4. **Check internet connection** - conda needs to download packages

5. **Try with specific channel priority:**
   ```powershell
   conda env create -f environment.yml -c conda-forge -c defaults
   ```

#### Issue: OpenSlide Bug Fix Not Applied

**Symptoms:**
- Build succeeds but application fails when processing large files
- Errors related to OpenSlide tile source

**Solutions:**

1. **Verify the file exists:**
   ```powershell
   $envPath = (conda info --json | ConvertFrom-Json).default_prefix
   $file = "$envPath\Lib\site-packages\large_image_source_openslide\__init__.py"
   Test-Path $file
   ```

2. **Manually apply the fix** (see Manual Build Process, Step 4)

3. **Check if line is already commented:**
   ```powershell
   Select-String -Path $file -Pattern "#.*read_region.*\(0, 0\), svslevel"
   ```

#### Issue: PyInstaller Build Fails

**Symptoms:**
- PyInstaller reports missing modules
- DLL not found errors
- Import errors in the built executable

**Solutions:**

1. **Ensure conda environment is activated:**
   ```powershell
   conda activate sliderelabeler
   conda info  # Verify active environment
   ```

2. **Verify PyInstaller is installed:**
   ```powershell
   conda list pyinstaller
   ```

3. **Check PyInstaller spec file:**
   - Review `pyinstaller/engine.spec` for correct paths
   - Ensure all required binaries are in `src/python/DeidTools/win-bin/`

4. **Try rebuilding PyInstaller executable:**
   ```powershell
   pyinstaller -y --clean ./pyinstaller/engine.spec
   ```

5. **Check for missing DLLs:**
   - Verify `libopenslide-1.dll` exists in conda environment's `Library\bin\`
   - The spec file should copy required DLLs

#### Issue: Electron Build Fails

**Symptoms:**
- `npm run make` fails
- Errors about missing files or paths
- Electron Forge errors

**Solutions:**

1. **Clean build directories:**
   ```powershell
   Remove-Item -Recurse -Force .\out -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force .\build -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
   ```

2. **Verify PyInstaller output exists:**
   ```powershell
   Test-Path .\dist\engine\engine.exe
   ```

3. **Check Electron Forge configuration:**
   - Review `forge.config.js`
   - Verify `extraResource` path is correct for Windows

4. **Try building Electron app separately:**
   ```powershell
   npm run package
   ```

5. **Check Node.js version compatibility:**
   ```powershell
   node --version
   # Should be 18.x or 20.x (LTS)
   ```

#### Issue: PowerShell Execution Policy

**Symptoms:**
- "cannot be loaded because running scripts is disabled on this system"
- Script execution blocked

**Solutions:**

1. **Check current policy:**
   ```powershell
   Get-ExecutionPolicy
   ```

2. **Set policy for current user:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Verify change:**
   ```powershell
   Get-ExecutionPolicy
   # Should show RemoteSigned
   ```

#### Issue: Build Takes Too Long

**Symptoms:**
- Build process seems stuck
- No progress for extended periods

**Solutions:**

1. **This is normal for first build** - conda environment creation can take 10-15 minutes

2. **Check if process is actually running:**
   - Look for conda/npm processes in Task Manager
   - Check disk activity

3. **Monitor specific steps:**
   - Conda: Look for package download progress
   - npm: Look for package installation messages
   - PyInstaller: Look for "Analyzing..." and "Building..." messages

4. **If truly stuck, cancel and retry:**
   - Press `Ctrl+C` to cancel
   - Clean directories and retry

#### Issue: Out of Disk Space

**Symptoms:**
- Build fails with disk space errors
- Conda/npm report insufficient space

**Solutions:**

1. **Check available space:**
   ```powershell
   Get-PSDrive C | Select-Object Used,Free
   ```

2. **Free up space:**
   - Clean conda cache: `conda clean --all`
   - Remove old builds: Delete `out/`, `dist/`, `build/` directories
   - Remove node_modules: `Remove-Item -Recurse node_modules` (will be reinstalled)

3. **Minimum required:** ~5GB free space

### Getting Additional Help

If you encounter issues not covered here:

1. **Check the build script output** - it often provides helpful error messages
2. **Review log files** - check console output for specific error messages
3. **Verify all prerequisites** are correctly installed and in PATH
4. **Try the manual build process** to isolate which step is failing
5. **Contact the developers** - see contact information in the main README.md

---

## Verifying the Build

### 1. Check Build Output Location

After a successful build, verify the installer exists:

```powershell
$buildPath = ".\out\make\squirrel.windows\x64\"
$installer = Get-ChildItem -Path $buildPath -Filter "*.exe" | Select-Object -First 1

if ($installer) {
    Write-Host "✓ Installer found: $($installer.FullName)"
    Write-Host "  Size: $([math]::Round($installer.Length / 1MB, 2)) MB"
    Write-Host "  Created: $($installer.CreationTime)"
} else {
    Write-Host "✗ Installer not found"
}
```

**Expected Output:**
```
✓ Installer found: C:\SoftwareDevelopment\SlideRelabeler\out\make\squirrel.windows\x64\SlideRelabeler Setup 0.1.8.exe
  Size: 450.23 MB
  Created: 2024-01-15 10:30:00
```

### 2. Verify File Structure

Check that all expected files and directories were created:

```powershell
# Check Python executable
Test-Path .\dist\engine\engine.exe

# Check Electron build output
Test-Path .\out\make\squirrel.windows\x64\

# List installer files
Get-ChildItem .\out\make\squirrel.windows\x64\
```

**Expected Files in `out/make/squirrel.windows/x64/`:**
- `SlideRelabeler Setup X.X.X.exe` - Main installer
- `RELEASES` - Squirrel release metadata
- `SlideRelabeler-X.X.X-full.nupkg` - Application package

### 3. Test the Installer

**Install the application:**

1. Navigate to the build output directory:
   ```powershell
   cd .\out\make\squirrel.windows\x64\
   ```

2. Run the installer:
   ```powershell
   .\SlideRelabeler Setup X.X.X.exe
   ```

3. Follow the installation wizard

4. **Default installation location:** `C:\Users\{YourUsername}\AppData\Local\sliderelabeler\`

**Verify installation:**

1. Launch the application from Start Menu or:
   ```powershell
   & "$env:LOCALAPPDATA\sliderelabeler\SlideRelabeler.exe"
   ```

2. **Test basic functionality:**
   - Application should launch without errors
   - Main window should display
   - Try adding a test file (if you have a whole-slide image file)
   - Check that the Python backend is working (try viewing metadata)

### 4. Verify Python Backend

The Python executable should be bundled with the application. To verify:

1. **Check application resources:**
   - The Python `engine.exe` should be in: `{InstallDir}\resources\engine\engine.exe`

2. **Test Python functionality:**
   - In the application, try loading a whole-slide image file
   - Check that metadata can be retrieved
   - Verify image viewing works

### 5. Clean Up (Optional)

After verifying the build, you can clean up intermediate files to save disk space:

```powershell
# Remove build artifacts (keeps installer)
Remove-Item -Recurse -Force .\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue

# Remove node_modules (can be reinstalled with npm install)
# Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
```

**Note:** Keep the `out/` directory if you want to keep the installer. The installer is the final deliverable.

---

## Next Steps

After successfully building the application:

1. **Test the installer** on a clean Windows machine (if possible)
2. **Distribute the installer** (`SlideRelabeler Setup X.X.X.exe`) to end users
3. **Document any issues** you encountered for future reference
4. **Consider creating a release** on GitHub with the installer attached

For development workflows, see the main [README.md](README.md) for information about:
- Running the app in development mode (`npm start`)
- Testing with PyInstaller build (`npm run startpib`)
- Making code changes and rebuilding

---

## Additional Resources

- **Main README:** [README.md](README.md)
- **Application Structure:** [analysis/application-structure.md](analysis/application-structure.md)
- **Electron Forge Docs:** https://www.electronforge.io/
- **PyInstaller Docs:** https://pyinstaller.org/
- **Conda Docs:** https://docs.conda.io/

---

**Last Updated:** Based on SlideRelabeler version 0.1.8
