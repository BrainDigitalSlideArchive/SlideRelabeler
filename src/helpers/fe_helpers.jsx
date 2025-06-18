export function displayBytes(bytes = null, places=2){
  if(bytes === null) return '?';
  const units=['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let numDivisions = 0;
  let output = bytes;
  while(output > 1000 && numDivisions < units.length-1){
    output = output / 1024;
    numDivisions += 1;
  }
  return output.toFixed(places) + ' ' + units[numDivisions]
}

export function formatLeftEllipsis(text = ''){
  if(text == '') {
    return '';
  }
  const m = text.match(/^([^a-z0-9\{\}\[\]\(\)]*)(.*?)([^a-z0-9\{\}\[\]\(\)]*)$/i);
  return m[3].split('').reverse() + m[2] + m[1].split('').reverse();
}

export function headerInfo(file_rows, count, totalBytes, processing, metadata_updating, remainingBytes, transfer_rate){
  let bytes_being_copied = 0;

  for (let row_idx = 0; row_idx < file_rows.length; row_idx++) {
    let file_row = file_rows[row_idx];
    if (file_row.__reserved.progress > 0 && file_row.__reserved.processed === 0) {
      bytes_being_copied += file_row.__reserved.bytes * (file_row.__reserved.progress / 100);
    }
  }

  let timeDisplay = '';

  if (transfer_rate) {
    let estimated_remaining_bytes = remainingBytes - bytes_being_copied;
    let estimated_remaining_seconds = estimated_remaining_bytes / transfer_rate;

    let estimated_remaining_hours = Math.floor(estimated_remaining_seconds / 3600);
    let estimated_remaining_minutes = Math.floor((estimated_remaining_seconds % 3600) / 60);
    let estimated_remaining_seconds_remaining = Math.floor(estimated_remaining_seconds % 60);

    
    if (estimated_remaining_hours > 0) {
      timeDisplay += `${estimated_remaining_hours}h `;
    }
    if (estimated_remaining_minutes > 0 || estimated_remaining_hours > 0) {
      timeDisplay += `${estimated_remaining_minutes}m `;
    }
    timeDisplay += `${estimated_remaining_seconds_remaining}s`;
  }

  if(file_rows.length === 0){
    return <p>No Files Loaded</p>
  } else if(count < file_rows.length) {
    return <p>Found info for {count} of {file_rows.length} files; {file_rows.length - count} remaining.</p>
  } else {
    return <p>
      {metadata_updating && "Loading files..."} &nbsp;

      Total size: {displayBytes(totalBytes)} for {file_rows.length} files. &nbsp;
      
      {displayBytes(remainingBytes - bytes_being_copied)} left to copy. &nbsp;

      {timeDisplay.length > 0 && processing && `Estimated time remaining: ${timeDisplay}`}
      </p>
  }
}

export function generate_dropdown_for_table_columns(all_cols, blocked_fields) {
  let new_column_options = [];

    for (let i = 0; i < all_cols.length; i++) {
      let col = all_cols[i];
      if (col.field && !blocked_fields.includes(col.field)) {
        if (col.field === "__reserved.source.path") {
          new_column_options.push({label: "Path", value: "path"});
        } else if (col.field && !col.headerName) {        
          new_column_options.push({label: col.field, value: col.field});
        } else {
          new_column_options.push({label: col.headerName, value: col.field});
        }
      }
    }

    return new_column_options;
}