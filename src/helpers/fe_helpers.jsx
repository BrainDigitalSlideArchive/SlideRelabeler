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
    console.log('Why is formatLeftEllipsis being called on an empty string?');
  }
  const m = text.match(/^([^a-z0-9\{\}\[\]\(\)]*)(.*?)([^a-z0-9\{\}\[\]\(\)]*)$/i);
  return m[3].split('').reverse() + m[2] + m[1].split('').reverse();
}

export function headerInfo(fileRows, count, totalBytes, remainingBytes){
  if(fileRows.length === 0){
    return <p>No Files Loaded</p>
  } else if(count < fileRows.length) {
    return <p>Found info for {count} of {fileRows.length} files; {fileRows.length - count} remaining.</p>
  } else {
    return <p>Total size: {displayBytes(totalBytes)} for {fileRows.length} files. {displayBytes(remainingBytes)} left to copy.</p>
  }
}