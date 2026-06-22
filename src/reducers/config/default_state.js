import { DEFAULT_ASSEMBLY, DEFAULT_ROUTING } from '../../helpers/assembly_routing.js';

export const default_state = {
  configVersion: 2,
  assembly: { ...DEFAULT_ASSEMBLY },
  routing: { ...DEFAULT_ROUTING },
  filename: {
    source: 'uuid',
    pattern: '',
    column: '',
    use_uuid: true,
    style: 'uuid',
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
    textDefault: 'output_name',
    qrDefault: 'output_name',
    qrPattern: '',
    labelText: { mode: 'output_name', pattern: '' },
    qrContent: { mode: 'output_name', pattern: '' },
    qr_mode: {label: 'Encode Filename', value: 'user_defined', description: 'Use rename column featuring output filename'},
    text_column_field: {value: 'AssembledName', label: 'Assembled name'},
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
    dsaAlias: { mode: 'output_name', pattern: '' },
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
