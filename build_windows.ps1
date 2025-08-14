# To use this script you must install miniconda3 or anaconda 
# and add the condabin to your path

# Uncomment the following block to add npm node to your path
# provided you have installed npm/node as described in the readme
Write-Host "Checking if npm/node is installed and in path"
$npmPath = where.exe npm
if ($npmPath -eq "") {
    Write-Host "Adding npm node to path"
    $NODE_INSTALL_DIR = "C:\Program Files\nodejs"
    $env:PATH += ";$NODE_INSTALL_DIR"
} else {
    Write-Host "Npm is already in the path"
    $npmPathArray = $npmPath.split("`r?`n")[0].split('\')
    $NODE_INSTALL_DIR = $npmPathArray[0..($npmPathArray.Length - 2)] -join '\'
}

# Uncomment the following block to add the conda bin to your path
# provided you have installed miniconda3 or anaconda
# and changed it for the appropriate directory

Write-Host "Checking if conda is installed and in path"
$envName = "sliderelabeler"
$condaPath = where.exe "conda.bat"
if ($condaPath -eq "") {
    Write-Host "Adding conda bin to path"
    $CONDA_INSTALL_DIR = "C:\ProgramData\miniconda3"
    # $CONDA_INSTALL_DIR = "C:\Users\arosado\miniconda3"
    $env:PATH += ";$CONDA_INSTALL_DIR\condabin"

} else {
    Write-Host "Conda is already in the path"
    $condaPathArray = $condaPath.split("`r?`n")[0].split('\')
    $CONDA_INSTALL_DIR = $condaPathArray[0..($condaPathArray.Length - 3)] -join '\'
    Write-Host "Conda install dir: $CONDA_INSTALL_DIR"
}

# Check if npm/node is installed and in path
Write-Host "Checking if npm/node is installed and in path"
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Npm/node must be installed to use this script"
    Write-Host "Install npm/node from https://nodejs.org/en/download/"
    Write-Host "Make sure that npm is in your path environment variable"
    exit
}

# Check if conda is in the path
Write-Host "Checking if conda is in the path"
if (!(Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Host "Conda must be installed and in the path to use this script"
    Write-Host "Install miniconda3 or anaconda and add the condabin to your path"
    Write-Host "Anaconda installation instructions:"
    Write-Host "https://www.anaconda.com/docs/getting-started/miniconda/install"
    Write-Host "Download latest miniconda3 installer:"
    Write-Host "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
    Write-Host "See readme for more details"
    exit
}

# Create the environment if it doesn't exist
if (!(conda env list | Select-String -Pattern $envName)) {
    Write-Host "Conda environment $envName does not exist"
    Write-Host "Creating environment $envName"
    # If you use this script, you must accept the terms of service for
    # default and conda-forge channels
    conda tos accept
    conda tos accept --override-channels --channel conda-forge
    # This will create the environment using the project's environment.yml file
    conda env create -f environment.yml
} else {
    Write-Host "Conda environment $envName already exists"
}

# Activate environment and store the location
Write-Host "Activating conda environment $envName"
& "$CONDA_INSTALL_DIR\shell\condabin\conda-hook.ps1"
conda activate $envName
$envPath = (conda info --json | ConvertFrom-Json).default_prefix
$largeImageOpenSlideTileSourcePath = "$envPath\Lib\site-packages\large_image_source_openslide\__init__.py"

# Check if large image tile source is installed
Write-Host "Checking if large image tile source is installed"
# Find the line needed to be commented out to function properly in the OpenSlide tile source
$regex = "\s+self\._openslide\.read_region\(\(0, 0\), svslevel, \(1, 1\)\)"
if (!(Test-Path $largeImageOpenSlideTileSourcePath)) {
    Write-Host "Large image OpenSlide tile source is not installed"
    Write-Host "There could be an error with setting up the Conda environment"
    Write-Host "Please reach out to the developer for help"
    exit
}

# Replace the needed line in the OpenSlide tile source for a bug fix for large files
Write-Host "Replacing a needed line in the OpenSlide tile source for a bug fix for large files"
$i = 0
foreach($line in Get-Content $largeImageOpenSlideTileSourcePath) {
    if ($line -match $regex) {
        Write-Host "Found matching line for $regex at line $i"
        $lineNumber = $i
        break
    }
    $i++
}

# Replace the needed openslide line with a comment
$replacementLine = "# $line"
if ($lineNumber -and $replacementLine) {
    Write-Host "Replacing line $line @ $lineNumber in $largeImageOpenSlideTileSourcePath with $replacementLine"
    (Get-Content $largeImageOpenSlideTileSourcePath).replace($line, $replacementLine) | Set-Content -Path $largeImageOpenSlideTileSourcePath
} else {
    Write-Host "No line found for $regex in $largeImageOpenSlideTileSourcePath"
    Write-Host "This line might already be commented out"
}

# Run npm install to install nodejs dependencies
Write-Host "Running npm install to install nodejs dependencies"
npm install

# Run npm run build to build the project
Write-Host "Running npm run make to build the project"
npm run make

$buildPath = ".\out\make\squirrel.windows\x64\SlideRelabeler-0.0.3 Setup.exe"
# Check if the build was successful
if (Test-Path $buildPath) {
    Write-Host "Build was successful"
    Write-Host "The build is @ $buildPath"
    Write-Host "Please navigate to the containing folder and install the application"
} else {
    Write-Host "Build was not successful"
    Write-Host "Please reach out to the developer for help"
    exit
}