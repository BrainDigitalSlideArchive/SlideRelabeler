# SlideRelabeler
Remove and/or replace labels from whole slide images (WSIs)

## Design
The app has a browser-based (HTML/CSS/js) frontend, for a familiar and efficient graphical user interface. The back-end server invokes python code to interact with the WSI files. It is packaged into a stand-alone application for easy installation and use.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier. 

## Useful info:
Useful [stackoverflow](https://stackoverflow.com/questions/67146654/how-to-compile-python-electron-js-into-desktop-app-exe) question and answer.

Blog posts by Simon Willison [here](https://til.simonwillison.net/electron/python-inside-electron) and perhaps the linked one [here](https://til.simonwillison.net/electron/sign-notarize-electron-macos) if signing and notarizing is needed for the bundled Mac app.

Consider using `pyinstaller` though, and running the generated `.exe` instead of bundling python3 from scratch.