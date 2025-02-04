import React from 'react';
import {useDispatch} from "react-redux";

import * as modal_actions from "../../actions/modal";
import ModalHeader from "./ModalHeader";

function ModalHelp(props) {
  const dispatch = useDispatch();
  return (
    <div className="__modal">
      <ModalHeader title={"Help"} type={"config"}/>
      <div className={"__content"}>
        <div className={"__content-section"}>
          <h2>Application</h2>
          <p>
            The SlideRelabeler application is designed to simplify the process of deidentifying whole slide images so
          that they can be shared for research purposes.  The purposes of deidentification is protect patients from the
            misuse of their personal information.  The SlideRelabeler application is designed to remove information from
            whole slide images that could be used to identify a patient.  Although the application is designed to do so
            you should make sure that the application is working as expected before sharing the images given differences
            can exist between how universities and hospitals conduct whole slide imaging and how this applications work
            with those whole slide images.  Given this application's <b>developers accept no liability in a failure of this application
            to remove sensitive patient information from whole slide images, the user of this application is liable for its'
            inappropriate use and the failure to check if an output file has been completely deidentified.</b>  We encourage users
            having issues with the deidentification of this program to share information that can be used to reproduce the
            isuee and improve the program.
          </p>
        </div>
        <div className={"__content-section"}>
          <h2>Workflows</h2>
          <p>
            There are three possible workflows for using the SlideRelabeler application.  The first workflow is to add files
            to the application and then to process them all at once.  The second workflow is the add folders containing supported
            files to the application. The third workflow is to use a csv file containing
            the information about where a file is stored on your computer/organization's network and then process those files.
            In all cases the application runs the same process to remove patient identifying information from the files.
            After processing the files your work will be exported to a csv file that you can use to track the files you deidentified
            if you need to refer back to them in the future. This information can allow linking back to the original information that
            could potentially be used to identify a patient so you should store it in a secure location.  If you share this csv file
            with an outside entity/institution you should make sure sensitive health information is removed from that version of
            the file.
          </p>
          <p>
            To use the application with a set of whole slide images without using a csv file first use the "Add file/files" button
            to add a single file or multiple files using your operating systems file selection dialog.  To select multiple files you
            can hold down the control button or use shift to select a starting and ending file within a sequence.  You can repeat the
            selection multiple times until you've selected all the files you wish to process. Once you select
            your files using the dialog they will be added sequentially to the main window's table.  Here you can use this table to
            inspect the files you've selected.  To process the files you must select an output directory using the "Choose output dir"
             button.  After having the appropriate setup for processing you should be able to use the "process files" button to begin
            the deidentification procedure.
          </p>
          <p>
            To use the application with a folder of whole slide images you can use the "Add folder" button to select
            a directory of input files. To select multiple files you can hold down the control button or use shift to select
            a starting and ending folder within a sequence. You can repeat this process as many time as needed to add all the
            files you wish to process.  You should see all your added files in the table within the main window.  Once you are finished
            adding files you can select an output folder with the "Choose output dir" button.  After having the appropriate setup for
            processing you should be able to use the "process files" button to begin the deidentification procedure.
          </p>
          <p>
            To use the application with a csv file you must make a CSV file with a data column labeled "filename" that has a filename in the directory of the
            selected csv file or a relative/absolute path to the whole slide image file.  Additional metadata columns from this
            file will be added to your table and you can use this table to inspect the files loaded using your csv. Once the files are
             loaded you must select an output directory using the "Choose output dir" button in the main window.  If your setup is
            ready for processing you will see the "process files" button become enabled which you can press to begin
            the deidentification procedure.
          </p>
        </div>
        <div className={"__content-section"}>
          <h2>Configuration Options</h2>
          <p>
            To configure the application click on the cogwheel button on the right side of the main window to open a
            configuration modal.  The configuration menu features different sections organized as to whether they impact
            the output filename, whole slide image, whole slide image's label, and csv file. We recommend using the default
            settings for your deidentification workflow, but you can alter this configuration if you wish to create
            deidentified files for your specific use case.
          </p>
          <p>
            Filename configuration is by default a client side generated uuid based on the input file's path.
            If you select the rename option the output filename will by default match the input filename unless you've
            loaded files using a csv file featuring a "rename" column.  If you use the rename feature you can change the
            rename value in the main window's table.  You are able to add text by default to all output filenames either
            at the beginning ("prefix") or ending ("suffix").  You can alter the possible fields here to see an example of
            what the output filename would look like.
          </p>
          <p>
            Whole slide image configuration by default removes this macro image as it may contain sensitive patient information.
            You can choose to include the macro image here if your files do not contain sensitive information in the macro image.
          </p>
          <p>
            Label configuration by default will add a top section of text corresponding to the renamed filename and a QR code with
            that same output filename.  You can add an icon here by selecting an image file on your computer that will be added
            to the label between any text or QR code that you've specified to be placed into your output label.  You can disable the
            label's text, icon, and QR code by toggling the appropriate checkboxes.  The text in the label can be changes to any of
            the table's current columns.  The QR mode can be changed to either contain just the file's uuid, json from selected
            table column data (base64 encoded utf-8 json), or text from a specific table column's data.
          </p>
          <p>
            CSV configuration by default creates an output CSV file in your output directory with a deid_output.csv filename.
            You can toggle whether to save the output csv file or not using the labeled checkbox in this section.
          </p>
        </div>
        <div className={"__content-section"}>
          <h2>Buttons</h2>
          <p>Click "Add File/Files" to add a file or multiple files to the files table.</p>
          <p>Click "Add Folder" to add a folder or multiple folder to the files table.</p>
          <p>Click "CSV Import" to add files from rows in a CSV file to the files table.</p>
          <p>Click "Choose Output Dir" to select a directory to copy the processed files into.</p>
          <p>Click "Clear Files" to remove all files from the files table.</p>
          <p>Click on the question icon to open up the currently viewed help menu.</p>
          <p>Click on the cogwheel icon to open up configuration options for the output.</p>
          <p>Click "Process Files" to copy files from the input directory to the output directory</p>
        </div>
        <div className={"__content-section"}>
          <h2>How to Contribute</h2>
          <p>
            This application is a work in progress and is dependent upon feedback you provide to improve the application
            and ensure it works as expected.  If you have any feedback please provide it to the developers of the application
            <a href={"mailto:arosad2@protonmail.ch"}>Aaron Rosado</a> and <a href={"mailto:"}>Tom Pierce</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModalHelp;