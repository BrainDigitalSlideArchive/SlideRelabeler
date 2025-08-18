$envName = "sliderelabeler"

Write-Host "Checking if npm/node is installed and in path"
if ((Get-Command npm -ErrorAction SilentlyContinue) -eq $null) { # linter is wrong
    # Change the following block to add npm node to your path
    # provided you have installed npm/node as described in the readme
    Write-Host "Adding npm node to path"
    $NODE_INSTALL_DIR = "C:\Program Files\nodejs"
    $env:PATH += ";$NODE_INSTALL_DIR"
} else {
    Write-Host "Npm is already in the path"
    $npmPath = where.exe npm
    $npmPathArray = $npmPath.split("`r?`n")[0].split('\')
    $NODE_INSTALL_DIR = $npmPathArray[0..($npmPathArray.Length - 2)] -join '\'
}

Write-Host "Checking if conda is installed and in path"
if ((Get-Command conda -ErrorAction SilentlyContinue) -eq $null) { # linter is 
    # Change the following block to add the conda bin to your path
    # provided you have installed miniconda3 or anaconda
    # and changed it for the appropriate directory
    Write-Host "Adding conda bin to path"
    $CONDA_INSTALL_DIR = "C:\ProgramData\miniconda3"
    # $CONDA_INSTALL_DIR = "C:\Users\arosado\miniconda3"
    $env:PATH += ";$CONDA_INSTALL_DIR\condabin"
} else {
    Write-Host "Conda is already in the path"
    $condaPath = where.exe "conda.bat"
    $condaPathArray = $condaPath.split("`r?`n")[0].split('\')
    # $where_miniconda3 = $condaPathArray | Where-Object { $_ -eq "miniconda3" }
    $where_miniconda3_index = $condaPathArray.IndexOf("miniconda3")
    # $where_anaconda = $condaPathArray | Where-Object { $_ -eq "Anaconda3" }
    $where_anaconda_index = $condaPathArray.IndexOf("Anaconda3")
    exit
    if ($where_miniconda3_index -ne -1) {
        $CONDA_INSTALL_DIR = $condaPathArray[0..$where_miniconda3_index] -join '\'
    } elseif ($where_anaconda_index -ne -1) {
        $CONDA_INSTALL_DIR = $condaPathArray[0..$where_anaconda_index] -join '\'
    } else {
        Write-Host "Conda is not in the path"
        Write-Host "You should make sure anaconda or miniconda is installed"
        Write-Host "If installed, make sure the conda bin is in your path"
        exit
    }
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