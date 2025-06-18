import os
import sys
import json
import uuid
import ctypes
# import large_image

print("In module products sys.path[0], __package__ ==", sys.path[0], __package__)

# if sys.platform == 'darwin':
#     try:
#         pass
#         ## This is needed for MACOS per Dr. Pearce, but seems to not work on linux
#         # libtiff.libtiff.TIFFGetField.argtypes = [ctypes.c_void_p, libtiff.libtiff_ctypes.c_ttag_t]
#         # libtiff.libtiff.TIFF.TIFFSetField.argtypes = [ctypes.c_void_p, libtiff.libtiff_ctypes.c_ttag_t, ctypes.c_void_p]
#         # libtiff.libtiff.TIFFSetField.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_void_p]
#         # libtiff.libtiff.TIFFGetField.argtypes = [ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p]
#         # libtiff.libtiff_ctypes.TIFF.TIFFGETFIELD.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_void_p]
#         # libtiff.libtiff_ctypes.TIFF.TIFFSETFIELD.argtypes = [ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p]
#     except Exception as exc:
#         print("Unable to set libtiff GET/SET field arguments %s", exc)

os.add_dll_directory(os.path.join(os.getcwd(), 'DeidTools', 'win-bin'))

from DeidTools import DeidTools

def test_deid_filename():
    test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'E22-02_ABETA_2.svs')
    # test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'E10-110_1B_aBeta.ndpi')
    # test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'E11-112_A2_a-syn_4B12.ndpi')
    # test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'multi-channel-z-series-time-series.ome.tiff')
    output_path = os.path.join('C:/', 'temp', 'deid', 'output')
    icon_file_path = os.path.join(".", "src", "assets", "BDSA_clear.png")
    test_filename = 'E22-02_ABETA_2.svs'
    test_ext = '.svs'

    # an output dict in a similar form that would be used to call the DeidTools object
    output_dict = {
        'config': {
            'filename': {'use_uuid': True, 'use_prefix': True, 'use_suffix': False, 'prefix': 'deid_', 'suffix': 'deid'},
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
            'source': {
                'path': str(test_file_path),
                'filename': test_filename,
                'parsed': {
                    'ext': test_ext
                }
            },
            'destinationDirectory': str(output_path),
            'rename': "1234",
            'uuid': str(uuid.uuid1())
        }
    }

    if os.path.exists(test_file_path):
        deid_tools = DeidTools()

        # output should return information about the redacted file

        # Application using apply_workflow_to_filename_with_output_dir for deid process
        output = deid_tools.apply_workflow_to_filename_with_output_dir(output_dict)
        # output = deid_tools.preview_metadata(output_dict)

        print("Output readcted file information: {}".format(json.dumps(output, indent=4)))

        pass
    else:
        raise FileNotFoundError(f"File not found: {test_file_path}")

if __name__ == "__main__":
    test_deid_filename()
    pass