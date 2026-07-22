import React from 'react';

import { formatWsiExtensionList } from '../../../../helpers/wsi_extensions.js';
import ConfigSubsection from '../../primitives/ConfigSubsection';
import ConfigHelperText from '../../primitives/ConfigHelperText';

/**
 * File picker info (read-only) — config-v2 kit.
 */
export default function FilePickerInfoSection() {
  const extensions = formatWsiExtensionList();

  return (
    <ConfigSubsection id="config-file-picker" title="File picker">
      <div className="cfg-file-picker-body">
        <ConfigHelperText>
          Use <strong>Add File/Files</strong> (multi-select) or <strong>Add Folder</strong> (includes
          subfolders) to load whole-slide images into the file table. Slide metadata is fetched
          automatically after rows are added.
        </ConfigHelperText>
        <ConfigHelperText>
          <strong>Supported formats:</strong> {extensions}
        </ConfigHelperText>
        <ConfigHelperText>
          Output name, label text, and QR content columns start blank for picker-loaded rows. The app
          applies values from <strong>Output name</strong> and <strong>Slide label</strong> in
          Configuration when defaults are needed.
        </ConfigHelperText>
        <ConfigHelperText>
          Loading the same file path twice is skipped with a warning.
        </ConfigHelperText>
      </div>
    </ConfigSubsection>
  );
}
