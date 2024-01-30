# SlideRelabeler
Remove and/or replace labels from whole slide images (WSIs)

## Design
The app has a browser-based (HTML/CSS/js) frontend, for a familiar and efficient graphical user interface. The back-end server invokes python code to interact with the WSI files. It is packaged into a stand-alone application for easy installation and use.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier.

The architecture is based on [Electron](https://www.electronjs.org/docs/latest/) - see [electronforge.io](https://www.electronforge.io/) for details about how to quickly run the app during development, build into a distributable application, etc.

## Getting started
Initial templating was done by:
```
npm init electron-app@latest . -- --template=vite
```
within the root directory, so `package.json` etc. were all installed in the root project directory (replace the `.` with `dir-name` would install in a new subdirectory).
