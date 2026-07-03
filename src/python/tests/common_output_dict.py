import os
import uuid

# Adjust these paths to your local environment
# test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'CMU-1.ndpi')
test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', '2025-08-12 17.06.42.ndpi')
icon_file_path = os.path.join(".", "src", "assets", "BDSA_clear.png")
test_filename = 'E22-02_ABETA_2.svs'
test_ext = '.svs'

# an output dict in a similar form that would be used to call the DeidTools object
output_dict = {
    'config': {
        'filename': {'use_uuid': True, 'source': 'uuid'},
        'label': {
            'qr_mode': {'value': 'uuid'},
            'add_text': True,
            'add_icon': True,
            'add_qr': True,
            'icon_file': {'source': {'path': str(icon_file_path)}},
            'text_column_field': {'value': 'rename'},
            'qr_column_fields': [{'value': 'source.path'}],
            'qr_column_field': {'value': 'rename'}
        },
        'wsi': {
            'save_macro_image': False
        }
    },
    '__reserved': {
        'rename': "1234",
        'uuid': str(uuid.uuid1()),
        'source': {
            'path': str(test_file_path),
            'parsed': {
                'ext': test_ext
            }
        },
        'destinationDirectory': str(os.path.join('C:/', 'temp', 'deid', 'output'))
    }
}