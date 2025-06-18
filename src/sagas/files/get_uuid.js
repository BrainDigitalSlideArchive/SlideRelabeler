import {select} from 'redux-saga/effects';

import {v1, v5} from 'uuid';

function* get_uuid(file_path) {
  const v1_uuid = v1();
  const v5_uuid = v5(file_path, v1_uuid);
  return v5_uuid;
}

export default get_uuid;