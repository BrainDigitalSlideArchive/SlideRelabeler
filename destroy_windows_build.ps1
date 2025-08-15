# Uncomment the following block to add the conda bin to your path
# provided you have installed miniconda3 or anaconda
# and changed it for the appropriate directory

. .\setup_dependency_paths.ps1

# Create the environment if it doesn't exist
if (conda env list | Select-String -Pattern $envName) {
    # Remove the conda environment
    conda deactivate
    conda env remove -n $envName --yes
} else {
    Write-Host "Conda environment $envName does not exist"
}

Write-Host "Removing build files"

# Remove the out folder
if (Test-Path .\out) {
    Write-Host "Removing out folder"
    Remove-Item -Recurse -Force .\out
}
# Remove the dist folder
if (Test-Path .\dist) {
    Write-Host "Removing dist folder"
    Remove-Item -Recurse -Force .\dist
}
# Remove the node_modules folder
if (Test-Path .\node_modules) {
    Write-Host "Removing node_modules folder"
    Remove-Item -Recurse -Force .\node_modules
}

if (Test-Path .vite) {
    Write-Host "Removing .vite folder"
    Remove-Item -Recurse -Force .vite
}

if (Test-Path build) {
    Write-Host "Removing build folder"
    Remove-Item -Recurse -Force build
}