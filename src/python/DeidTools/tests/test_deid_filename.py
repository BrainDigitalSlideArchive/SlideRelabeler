import os
import sys
# import large_image

print("In module products sys.path[0], __package__ ==", sys.path[0], __package__)

from .. import DeidTools

output_dir = os.path.join('E:/', 'temp', 'deid')

test_file_path = os.path.join('C:/', 'Users', 'arosado', 'Downloads', 'E22-02_ABETA_16.svs')

large_image_tools = DeidTools(output_dir)

output = large_image_tools.perform_deid(test_file_path)

pass