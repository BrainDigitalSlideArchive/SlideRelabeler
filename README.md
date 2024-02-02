# SlideRelabeler
Remove and/or replace labels from whole slide images (WSIs)

## Design
The app has a browser-based (HTML/CSS/js) frontend, for a familiar and efficient graphical user interface. The back-end server invokes python code to interact with the WSI files. It is packaged into a stand-alone application for easy installation and use.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier. 


## Getting started
1) Clone the repo: `git clone https://github.com/pitt-bdsa/SlideRelabeler`. 
2) Switch to the new directory: `cd SlideRelabeler`.
3) Create a virtual python environment: `python -m venv .pyenv`.
4) Activate the virtual environment: `source .pyenv/bin/activate`.
5) Install python dependencies: `pip install -r requirements.txt`.
6) Install npm dependencies: `npm install`;
7) Launch the dev app: `npm run start`;

## Building the distributable application
Running `npm run start` will open up the app, but won't create a bundle for distribution - no `SlideRelabeler.app` or `SlideRelabeler.exe` file will be generated.

To build those files, run `npm run make`. This will run `pyinstaller` followed by `electron-forge` to create the application.


Initial templating was done by:
```
npm init electron-app@latest . -- --template=vite
```
within the root directory, so `package.json` etc. were all installed in the root project directory (replace the `.` with `dir-name` would install in a new subdirectory).


## Useful info:
Useful [stackoverflow](https://stackoverflow.com/questions/67146654/how-to-compile-python-electron-js-into-desktop-app-exe) question and answer.

Blog posts by Simon Willison [here](https://til.simonwillison.net/electron/python-inside-electron) and perhaps the linked one [here](https://til.simonwillison.net/electron/sign-notarize-electron-macos) if signing and notarizing is needed for the bundled Mac app.

Consider using `pyinstaller` though, and running the generated `.exe` instead of bundling python3 from scratch.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier.

The architecture is based on [Electron](https://www.electronjs.org/docs/latest/) - see [electronforge.io](https://www.electronforge.io/) for details about how to quickly run the app during development, build into a distributable application, etc.
