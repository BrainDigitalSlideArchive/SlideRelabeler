import {v1, v5} from 'uuid';

function* get_uuid(file) {
  const path = file.source.path;
  const v1_uuid = v1();
  const v5_uuid = v5(path, v1_uuid);
  return v5_uuid;
}

export default get_uuid;