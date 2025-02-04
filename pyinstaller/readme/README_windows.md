# SlideRelabeler
## About
The SlideRelabeler program is a tool for de-identifying whole slide images with sensitive patient information and
storing de-identified slides in a local directory, and pushing those deidentifed slides to a remote digital slide
archive.  It is an electron application built to run on Windows, MacOS, and Linux.

## Running the program
1. Unzip the SlideRelabeler zip file into a directory of your choosing.
2. Run the SlideRelabeler.exe executable file on the folder you have unziped the files into.

## Typical workflow
1. Choose a directory containing whole slide images with sensitive patient information.
2. Open a CSV file containing important meta information associated with the whole slide images. This file
at a minimum should have a column featuring the filename of the whole slide image.
3. Choose a directory to output the de-identified whole slide images.
4. Press the process files to begin the de-identification process.
5. Press the output csv file to generate a CSV file containing information about the de-identified whole slide images.
This file should be stored in a sensitive HIPAA compliant location and serve ase a record of the de-identified files.
5. Press the push to archive button to push the de-identified whole slide images to a remote digital slide archive.

## Notes
* The program will overwrite files in the output directory. If a file with the same name already exists in the output.

## Feedback and Support
Please contact the developer at [email](mailto: arosad2@protonmail.ch) for any feedback or support.  Any feedback would
be greatly appreciated.