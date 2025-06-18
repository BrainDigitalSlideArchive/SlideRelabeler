// Inability to use path in render process creates the need for helper functions that replace commonly used path functions

export function return_separator() {
  if (window.navigator.platform.toLowerCase() === 'win32') {
    return "\\";
  }
  else {
    return "/";
  }
}

export function return_file_extension_from_path(file_path) {
  // input path describes the path to a file
  const path_sep = return_separator();
  if (file_path) {
    return file_path.split(path_sep).pop().split('.').pop();
  }
  else {
    return null;
  }
}

export function return_file_extension_from_source(file_source) {
  // input source describes information related to the file selected by a file selection dialog
  const path_sep = return_separator();
  if (file_source) {
    return file_source.source.path.split('.').pop();
  }
  else {
    return null;
  }
}

export function normalizePath(path){
  return path.replaceAll('\\', '/');
}

export function return_base_dir_from_source(file_source) {
  // input source describes information related to the file selected by a file selection dialog
  return file_source.source.directory;
}

export function join_paths(paths) {
  /*
  paths: array of path strings to be joined
  */
  const path_sep = return_separator();
  return paths.join(path_sep);
}

export function return_filename_dir_from_path(path) {
  const path_sep = return_separator();
  const path_split = path.split(path_sep);
  const filename = path_split.pop();
  const directory = join_paths(path_split);

  return {
    filename,
    directory
  }
}

export function return_filename_basename_from_filename(filename) {
  if (filename) {
    const split = filename.split('.')
    const split_subset = split.slice(0, -1)
    return split_subset.join('.')
  } else {
    return null;
  }

}

export function return_path_from_filename_dir(directory, filename) {
  const path_list = [directory, filename];
  const path = join_paths(path_list);
  return path;
}

export function return_if_path_relative(path) {
  const path_sep = return_separator();
  const path_split = split_path(path);

  if (path_split[0].includes('.') && path_split.length > 1) {
    return true;

  } else {
    return false;
  }
}

export function split_path(path) {
  const path_sep = return_separator();
  const is_windows = is_windows_path(path);
  let path_out = null;
  if (is_windows && path_sep === '\\') {
    path_out = path.replaceAll('/', path_sep);
  } else {
    path_out = path;
  }
  return path_out.split(path_sep);
}

export function is_windows_path(path) {
  if (path.includes('\\')) {
    return true;
  }
  else {
    return false;
  }
}

export function is_path_absolute(path) {
  const is_windows = is_windows_path(path);
  const path_sep = return_separator();
  const path_split = split_path(path);

  if (is_windows && path_sep === '\\') {
    if (path_split[0].includes(':')) {
      return true;
    }
    else if (path.startsWith('\\\\')) {
      return true;
    }
    else if (path_split[0].includes('')) {
      return true;
    }
    else {
      return false;
    }
  } else {
    if (path_split[0].startsWith('/')) {
      return true;
    }
    else {
      return false;
    }
  }
}