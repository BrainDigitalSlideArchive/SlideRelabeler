# To use this script you must install miniconda/anaconda and nodejs
# and add the condabin to your path

. .\setup_dependency_paths.ps1

Write-Host "Checking if conda environment $envName exists"
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

    if (!(conda env list | Select-String -Pattern $envName)) {
        Write-Host "Conda environment $envName was not created"
        Write-Host "Please reach out to the developer for help"
        exit
    }
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

$buildPath = ".\out\make\squirrel.windows\x64\"
# Check if the build was successful
if ((Test-Path $buildPath) -and (Test-Path $buildPath\*.exe)) {
    Write-Host "Build was successful"
    $fullPath = (Get-ChildItem -Path $buildPath -Filter "*.exe").FullName
    Write-Host "The build is @ $fullPath"
    Write-Host "Please navigate to the containing folder and install the application"
} else {
    Write-Host "Build was not successful"
    Write-Host "Please reach out to the developer for help"
    exit
}