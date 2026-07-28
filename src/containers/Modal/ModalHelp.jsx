import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as modal_actions from '../../actions/modal';
import ModalHeader from './ModalHeader';

import './ModalHelp.scss';

function ModalHelp() {
  const dispatch = useDispatch();
  const helpFocusSection = useSelector((s) => s.modal.helpFocusSection);
  const applicationSectionRef = useRef(null);

  useEffect(() => {
    if (helpFocusSection !== 'application') return;
    const el = applicationSectionRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    dispatch({ type: modal_actions.CLEAR_HELP_FOCUS_SECTION });
  }, [helpFocusSection, dispatch]);

  return (
    <div className="__modal modal-help">
      <ModalHeader title={"Help"} type={"help"}/>
      <div className="__content __content--config">
        <div className="config-panel">
          <div className="config-panel__body modal-help__body">
        <div
          className={"__content-section"}
          id="help-section-application"
          ref={applicationSectionRef}
        >
          <h2>Application</h2>
          <p>
            SlideRelabeler is an open-source application intended to help remove identifying information from
            whole slide images so they can be shared appropriately. It provides no guarantee that all patient
            identifiers are automatically removed.{' '}
            <b>
              The developers accept no liability for a failure to fully de-identify any given whole slide image file.
            </b>{' '}
            You alone are responsible for ensuring adequate de-identification for your use case before sharing
            resulting files. Because imaging practices differ across institutions, verify that outputs meet your
            requirements. If something fails to de-identify as expected, please share reproducible details so the
            program can be improved.
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
            As the program processes files, a csv file is generated that tracks deidentified progress and can help refer back to 
            original file if needed. This information can allow linking back to the original information that
            could potentially be used to identify a patient so you should store it in an encrypted, secure, HIPPA compliant location.  
            If you share this csv file with an outside entity/institution you should make sure PHI is removed from that version of
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
            files you wish to process.  Adding folders will recursively add all files from selected folders and subfolders.
            You should see all your added files in the table within the main window.  Once you are finished
            adding files you can select an output folder with the "Choose output dir" button.  After having the appropriate setup for
            processing you should be able to use the "process files" button to begin the deidentification procedure.
          </p>
          <p>
            To use the application with a csv file you must make a CSV file with a data column labeled "path" that has a filename in the directory of the
            selected csv file or a relative/absolute path to the whole slide image file.  If you don't have a column labeled "path" you can 
            select a column from your csv file that contains the paths for your files.  Please read more below for additional information 
            about the csv feature to learn how to specify a rename and metadata column.  Additional metadata columns from this
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
            Filename configuration is by default a client-side generated UUID based on the input file&apos;s path.
            You can keep the original basename, use a UUID, or build a custom pattern from placeholders such as{' '}
            <code>{'{uuid}'}</code> or <code>{'{originalBasename}'}</code> (for example, <code>deid_{'{uuid}'}</code>).
            If you load files from a CSV with an output-name column, those values override the default per row.
            You can also edit the Output name column in the main table at any time.
          </p>
          <p>
            Whole slide image configuration by default removes this macro image as it may contain sensitive patient information.
            You can choose to include the macro image here if your files do not contain sensitive information in the macro image.
          </p>
          <p>
            Label configuration by default will add a top section of text corresponding to the renamed filename and a QR code with
            that same output filename.  You can add an icon here by selecting an image file on your computer that will be added
            to the label between any text or QR code that you've specified to be placed into your output label.  You can disable the
            label's text, icon, and QR code by toggling the appropriate checkboxes.  The text in the label can be changed to any of
            the table's current columns.  The QR mode can be changed to either contain just the file's uuid, json from selected
            table column data (base64 encoded utf-8 json), or text from a specific table column's data.
          </p>
          <p>
            CSV configuration allows you to control relevant settings for CSV input and output.  You can specify in the text 
            a column that contains the filename for your target files.  Using this field is required by the CSV import functionality
            if you do not put in the correct column name, you will be given an opportunity to select it before processing the files. 
            There are also optional columns you can specify that control the filename rename feature or where the file gets outputed.
            Processing events are recorded in an in-app audit history (see Audit logging in configuration).
            You can browse, filter, and export that history to CSV when you need an external record.
            Export chooses the file name and location; no CSV is written automatically to the output directory.
          </p>
        </div>
        <div className={"__content-section"}>
          <h2>Previewing De-identification Output</h2>
          <p>
            The applicaiton allows for previewing the de-identification output before processing the files.  
            This can be done by clicking the file's thumbnail and opening the viewer window. The viewer window
            will allow you to visualize the file and inspect the current associated images 
            (thumbnail, label, and macro image if available).  You can aslo see the preview of the replacement label 
            and macro image.
          </p>
        </div>
        <div className={"__content-section"}>
          <h2>Buttons</h2>
          <p>Click "Add File/Files" to add a file or multiple files to the files table.</p>
          <p>Click "Add Folder" to add a folder or multiple folder to the files table.</p>
          <p>Click "CSV Import" to add files from rows in a CSV file to the files table.</p>
          <p>Click "Choose Output Dir" to select a directory to copy the processed files into.</p>
          <p>Click "Choose CSV File" to select a CSV file to import files from.</p>
          <p>Click "Clear Files" to remove all files from the files table.</p>
          <p>Click on the question icon to open up the currently viewed help menu.</p>
          <p>Click on the cogwheel icon to open up configuration options for the output.</p>
          <p>Click "Process Files" to copy files from the input directory to the output directory</p>
          <p>Click the "Cancel" button to stop the de-identification process.  This can be resumed by clicking the "Process Files" button again.</p>
        </div>
        <div className={"__content-section"}>
          <h2>How to Contribute</h2>
          <p>
            This application is a work in progress and is dependent upon feedback you provide to improve the application
            and ensure it works as expected.  If you have any feedback please provide it to the developers of the application
            <a href={"mailto:arosad2@protonmail.ch"}>Aaron Rosado</a> and <a href={"mailto:tmpearce@gmail.com"}>Tom Pierce</a>
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalHelp;