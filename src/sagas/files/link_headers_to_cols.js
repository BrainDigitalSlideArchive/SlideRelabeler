import { put } from 'redux-saga/effects';

export default function* link_headers_to_cols(headers, cols, link_action) {
  for (const col_idx in cols) {
    let col = cols[col_idx];
    // If file column like the header is found, link the header to the file column
    if (col.field) {
      if (headers.includes(col.field)) {
        const header_idx = headers.indexOf(col.field);
        yield put({type: link_action, payload: {field: col.field, header_idx: header_idx, header: headers[header_idx]}});
      }
      else if (headers.includes(col.field.split('.').pop())) {
        const header_idx = headers.indexOf(col.field.split('.').pop());
        yield put({type: link_action, payload: {field: col.field, header_idx: header_idx, header: headers[header_idx]}});
      }
    }
  }
}