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
  naming: {
    accessionMode: 'original',
    accessionToken: '',
    tokenIdColumn: '',
    duplicateStrategy: 'suffix-index',
    fieldsOrder: ['Accession', 'BlockId', 'StainId', 'SlideNum'],
  },
  label: {
    add_qr: true,
    add_text: true,
    add_icon: false,
    icon_file: null,
    qr_mode: {label: 'Encode Filename', value: 'user_defined', description: 'Use rename column featuring output filename'},
    text_column_field: {value: 'rename', label: 'Renamed as'},
    qr_column_fields: [],
    qr_column_field: null,
    label_text_assembly: {
      mode: 'legacy',
      template: '',
      fieldsOrder: [],
      separator: '_',
    },
    qr_assembly: {
      mode: 'legacy',
      template: '',
      fieldsOrder: [],
      separator: '',
    },
  },
  dsa_upload: {
    rename_item_after_upload: false,
    set_item_metadata: false,
    item_name_assembly: {
      mode: 'same_as_label',
      template: '',
      fieldsOrder: [],
      separator: '_',
    },
  },
  debug: {
    enable_debug: false
  },
  copy: {
    enable_copy_mode: false
  }
};

export default default_state;
