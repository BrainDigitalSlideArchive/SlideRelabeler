import os
import sys
import copy
import uuid
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

from src.python.DeidTools import DeidTools

test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'E22-02_ABETA_2.svs')
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
    }
    },
    'source': {
        'path': str(test_file_path),
        'filename': test_filename,
        'parsed': {
            'ext': test_ext
        }
    },
    'rename': "1234",
    'uuid': str(uuid.uuid1())
}

if os.path.exists(test_file_path):
    deid_tools = DeidTools()

    # output should return information about the redacted file
    # print("Testing test case text, icon, and qr")
    # output = deid_tools.preview_label(output_dict)
    # base64_str = deid_tools.pil_to_base64(output)
    # output.save('test_all_output.png')
    #
    #
    # print("Testing only text")
    # output_dict_2 = copy.deepcopy(output_dict)
    # output_dict_2['config']['label']['add_text'] = True
    # output_dict_2['config']['label']['add_qr'] = False
    # output_dict_2['config']['label']['add_icon'] = False
    #
    # output = deid_tools.preview_label(output_dict_2)
    # output.save('test_text_only.png')
    #
    #
    # print("Testing only qr")
    # output_dict_3 = copy.deepcopy(output_dict)
    # output_dict_3['config']['label']['add_text'] = False
    # output_dict_3['config']['label']['add_qr'] = True
    # output_dict_3['config']['label']['add_icon'] = False
    #
    # output = deid_tools.preview_label(output_dict_3)
    # output.save('test_qr_only.png')
    #
    # print("Testing only icon only")
    # output_dict_4 = copy.deepcopy(output_dict)
    # output_dict_4['config']['label']['add_text'] = False
    # output_dict_4['config']['label']['add_qr'] = False
    # output_dict_4['config']['label']['add_icon'] = True
    #
    # output = deid_tools.preview_label(output_dict_4)
    # output.save('test_icon_only.png')
    #
    # output_dict_5 = copy.deepcopy(output_dict)
    # output_dict_5['config']['label']['add_text'] = True
    # output_dict_5['config']['label']['add_qr'] = True
    # output_dict_5['config']['label']['add_icon'] = False
    #
    # output = deid_tools.preview_label(output_dict_5)
    # output.save('test_text_qr.png')
    #
    # output_dict_6 = copy.deepcopy(output_dict)
    # output_dict_6['config']['label']['add_text'] = False
    # output_dict_6['config']['label']['add_qr'] = True
    # output_dict_6['config']['label']['add_icon'] = True
    #
    # output = deid_tools.preview_label(output_dict_6)
    # output.save('test_qr_icon.png')
    #
    # output_dict_7 = copy.deepcopy(output_dict)
    # output_dict_7['config']['label']['add_text'] = True
    # output_dict_7['config']['label']['add_qr'] = False
    # output_dict_7['config']['label']['add_icon'] = True
    #
    # output = deid_tools.preview_label(output_dict_7)
    # output.save('test_text_icon.png')
    #
    # output_dict_8 = copy.deepcopy(output_dict)
    # output_dict_8['config']['label']['add_text'] = False
    # output_dict_8['config']['label']['add_qr'] = False
    # output_dict_8['config']['label']['add_icon'] = False
    #
    # output = deid_tools.preview_label(output_dict_8)
    # output.save('test_nothing_label.png')

    # output_dict_9 = copy.deepcopy(output_dict)
    # output_dict_9['config']['label']['add_text'] = False
    # output_dict_9['config']['label']['add_qr'] = True
    # output_dict_9['config']['label']['add_icon'] = False
    # output_dict_9['config']['label']['qr_mode'] = {'value': 'column_field'}
    #
    # output = deid_tools.preview_label(output_dict_9)
    # output.save('test_qr_column_field.png')
    #
    # output_dict_10 = copy.deepcopy(output_dict)
    # output_dict_10['config']['label']['add_text'] = False
    # output_dict_10['config']['label']['add_qr'] = True
    # output_dict_10['config']['label']['add_icon'] = False
    # output_dict_10['config']['label']['qr_mode'] = {'value': 'column_fields'}
    #
    # output = deid_tools.preview_label(output_dict_10)
    # output.save('test_qr_column_field.png')

    output_dict_11 = copy.deepcopy(output_dict)
    output_dict_11['config']['label']['add_text'] = True
    output_dict_11['config']['label']['add_qr'] = True
    output_dict_11['config']['label']['add_icon'] = False
    output_dict_11['config']['label']['text_column_field'] = None
    output_dict_11['config']['label']['qr_column_field'] = None
    output_dict_11['config']['label']['qr_column_fields'] = []

    output = deid_tools.preview_label(output_dict_11)
    output.save('test_null_text_qr.png')
    pass