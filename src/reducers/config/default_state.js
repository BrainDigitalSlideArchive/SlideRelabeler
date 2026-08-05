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
    preserve_source_extension: false,
  },
  csv: {
    save_csv: true,
    reservedColumns: {
      filePath: { aliases: [] },
      outputName: { aliases: [] },
      labelText: { aliases: [] },
      qrContent: { aliases: [] },
    },
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
    fontSizeMode: 'auto',
    fontSize: 0.15,
    customizeLabelWidth: false,
    labelWidth: 750,
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
    integrationEnabled: false,
    default_api_url: '',
    rename_item_after_upload: false,
    dsaAlias: { mode: 'label_text', pattern: '' },
    itemMetadata: { mode: 'none', column: '' },
    item_name_assembly: {
      mode: 'same_as_label',
      template: '',
      fieldsOrder: [],
      separator: '_',
    },
  },
  globus_upload: {
    integrationEnabled: false,
    default_target_endpoint_id: '',
    default_target_endpoint_label: '',
    source_endpoint: '',
    disable_ssl_verification: false,
    max_upload_batch_size: 1,
  },
  debug: {
    enable_debug: false
  },
  copy: {
    enable_copy_mode: false
  },
  disclaimer: {
    promptMode: 'everyLaunch',
    acceptedVersion: null,
  },
};

export default default_state;
