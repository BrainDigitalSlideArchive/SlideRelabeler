# SlideRelabeler
Remove and/or replace labels from whole slide images (WSIs)

## Design
The app has a browser-based (HTML/CSS/js) frontend, for a familiar and efficient graphical user interface. The back-end server invokes python code to interact with the WSI files. It is packaged into a stand-alone application for easy installation and use.

The overall app design is conceptually similar to https://github.com/pearcetm/svs-deidentifier. 

## Getting started
Initial templating was done by:
```
npm init electron-app@latest slide-relabeler -- --template=vite
```
Which created a bunch of boilerplate inside a `slide-relabeler` directory; I moved this up the the project root directory.
