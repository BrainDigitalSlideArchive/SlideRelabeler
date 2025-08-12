# Uncomment the following block to add the conda bin to your path
# provided you have installed miniconda3 or anaconda
# and changed it for the appropriate directory

Write-Host "Adding conda bin to path"
$CONDA_INSTALL_DIR = "C:\ProgramData\miniconda3"
# $CONDA_INSTALL_DIR = "C:\Users\arosado\miniconda3"
$env:PATH += ";$CONDA_INSTALL_DIR\condabin"
$envName = "sliderelabeler"

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
if (conda env list | Select-String -Pattern $envName) {
    # Remove the conda environment
    conda env remove -n $envName --all --yes
} else {
    Write-Host "Conda environment $envName does not exist"
}

# Remove the build folder
Remove-Item -Recurse -Force .\out
# Remove the dist folder
Remove-Item -Recurse -Force .\dist
# Remove the node_modules folder
Remove-Item -Recurse -Force .\node_modules