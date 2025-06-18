export function field_split_to_row_data(field_split, row, data) {
  let key = field_split.shift();
  if (field_split.length === 0) {
    return Object.assign(row, {[key]: data});
  } else {
    if (!Object.keys(row).includes(key)) {
      row[key] = {};
      field_split_to_row_data(field_split, row[key], data);
    }
    else {
      field_split_to_row_data(field_split, row[key], data);
    }
  }
}

export function setup_row_data(row, data_row, headers, header_links) {
  for (const header_idx in data_row) {
    let data = data_row[header_idx];
    let header = headers[header_idx];
    if (Object.keys(header_links).includes(header)) {
      let link = header_links[header];
      let field_split = link.field.split('.');
      field_split_to_row_data(field_split, row, data);
    } else {
      let header_split = header.split('.');
      field_split_to_row_data(header_split, row, data);
    }
  }
  console.log('setup row', row);
  return row
}