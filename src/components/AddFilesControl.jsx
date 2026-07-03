import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import * as file_actions from '../actions/files';
import ToolbarSelectAction from './ToolbarSelectAction';

const MODE_OPTIONS = [
  { value: 'files', label: 'Files' },
  { value: 'folder', label: 'Folder' },
];

export default function AddFilesControl({ disabled = false }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('files');

  function handleSelectChange(event) {
    setMode(event.target.value);
  }

  function handleAction() {
    if (mode === 'folder') {
      dispatch({ type: file_actions.ADD_FOLDERS });
      return;
    }
    dispatch({ type: file_actions.ADD_FILES });
  }

  const actionAriaLabel = mode === 'folder' ? 'Pick Folder' : 'Pick Files';

  return (
    <ToolbarSelectAction
      selectId="add-files-control-select"
      ariaLabel="Add files or folder"
      options={MODE_OPTIONS}
      value={mode}
      disabled={disabled}
      actionIcon="fi fi-rr-folder"
      actionAriaLabel={actionAriaLabel}
      selectTooltip="Choose Files or Folder mode"
      actionTooltip={actionAriaLabel}
      onChange={handleSelectChange}
      onAction={handleAction}
    />
  );
}
