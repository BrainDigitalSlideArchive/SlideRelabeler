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