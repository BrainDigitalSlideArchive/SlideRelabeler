import os
import sys
import tempfile

# import large_image

print("In module products sys.path[0], __package__ ==", sys.path[0], __package__)

from LargeImageTools import LargeImageTools

output_dir = os.path.join('E:/', 'temp', 'deid')

test_file_path = os.path.join('C:/', 'Users', 'arosado', 'Downloads', 'CMU-2.tiff')
test_file = open(test_file_path, 'rb')

large_image_tools = LargeImageTools(output_dir)

temp_file = large_image_tools.create_temp_file_from_buffer(test_file, test_file_path)

output = large_image_tools.apply_workflow_temp_file(test_file_path, temp_file)

large_image_tools.close_temp_file(temp_file)

pass