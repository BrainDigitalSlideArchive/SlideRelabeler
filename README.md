# SlideRelabeler
Remove and/or replace labels from whole slide images (WSIs)

## Design
The app has a browser-based (HTML/CSS/js) frontend, for a familiar and efficient graphical user interface. The back-end server invokes python code to interact with the WSI files. It is packaged into a stand-alone application for easy installation and use.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier. 


## Getting started
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
