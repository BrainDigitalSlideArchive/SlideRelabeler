import React from 'react';
import { formatWsiExtensionList } from '../../helpers/wsi_extensions.js';

export default function FilePickerInfoSection() {
  const extensions = formatWsiExtensionList();

  return (
    <div className="data-loading-section__subsection file-picker-section" id="config-file-picker">
      <h3 className="data-loading-section__subsection-title">File picker</h3>
      <div className="file-picker-section__body">
        <p className="file-picker-section__text">
          Use <strong>Add File/Files</strong> (multi-select) or <strong>Add Folder</strong> (includes
          subfolders) to load whole-slide images into the file table. Slide metadata is fetched
          automatically after rows are added.
        </p>
        <p className="file-picker-section__text">
          <strong>Supported formats:</strong> {extensions}
        </p>
        <p className="file-picker-section__text">
          Output name, label text, and QR content columns start blank for picker-loaded rows. The app
          applies values from <strong>Output name</strong> and <strong>Slide label</strong> in
          Configuration when defaults are needed.
        </p>
        <p className="file-picker-section__text">
          Loading the same file path twice is skipped with a warning.
        </p>
      </div>
    </div>
  );
}
