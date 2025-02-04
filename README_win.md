# SlideRelabeler
## Summary
SlideRelabeler is a tool to relabel whole slide images and deidentify those slides so they can be shared across 
institutions without comprising patient privacy.  The tool is designed to be used as a standalone application/executable
that runs on Windows, MacOSX, and Linux.

## Authors
- David Gutman, MD, PhD
- Aaron Rosado, MD, PhD
- Thomas Pearce, MD, PhD

## Dependencies
- Miniconda (https://docs.conda.io/en/latest/miniconda.html)
- NodeJs (https://nodejs.org/en/download/)

## Installation
### Summary
This application has been tested for building in Windows 10 and Windows 11.  The built application can run as an 
executable in both Windows 10 and Windows 11.

#### Step 1: Install Miniconda Using Powershell
```bash
curl https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe -o miniconda.exe
Start-Process -FilePath ".\miniconda.exe" -ArgumentList "/S" -Wait
del miniconda.exe
```
#### Step 2: Install NodeJs
1. Download the Windows installer from the NodeJs website (https://nodejs.org/en/download/prebuilt-installer)
2. Run the installer
3. Follow the installation instructions

#### Step 3: Install node js dependencies
```bash
npm install
```

#### Step 4: Install python dependencies with miniconda
```bash
conda env create -f environment.yml
```

#### Step 5: Install DeidTools python library
```bash
cd ./src/python
git clone git@github.com:Gutman-Lab/DeidTools.git
```

### Building the standalone application
```bash
npm run make
```

### Running the built application