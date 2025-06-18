export const default_state = {
  filename: {
    use_uuid: true,
    use_suffix: false,
    use_prefix: false,
    prefix: 'deid',
    suffix: 'deid',
  },
  csv: {
    save_csv: true,
    file_path_column: 'path',
    file_rename_column: '',
    file_destination_directory_column: ''
  },
  wsi: {
    save_macro_image: false
  },
  label: {
    add_qr: true,
    add_text: true,
    add_icon: false,
    icon_file: null,
    qr_mode: {label: 'Encode Filename', value: 'user_defined', description: 'Use rename column featuring output filename'},
    text_column_field: {value: 'rename', label: 'Renamed as'},
    qr_column_fields: [],
    qr_column_field: null
  },
  debug: {
    enable_debug: false
  }
};

export default default_state;