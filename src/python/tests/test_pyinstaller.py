import os, sys, datetime, logging
import large_image
import tifftools
import large_image_source_openslide
import large_image_source_tiff

logger = logging.getLogger('tifftools')
logging.basicConfig(filename='tifftools.log', level=logging.DEBUG)

if __name__ == '__main__':
    import multiprocessing
    multiprocessing.freeze_support()

# logger
# logger = logging.getLogger('large_image')
# log_filename = os.path.join('.', 'large_image_{}.log'.format(datetime.datetime.now().timestamp()))
# logging.basicConfig(filename=log_filename, level=logging.DEBUG)
#
# collected_internal_path = os.path.join(os.path.dirname(__file__))
# gdal_share_path = os.path.join(collected_internal_path, 'gdal')
#
# if os.path.exists(gdal_share_path):
#     print('GDAL_DATA path {}'.format(os.path.abspath(gdal_share_path)))
#     os.environ['GDAL_DATA'] = gdal_share_path
# else:
#     print(f'GDAL share path {gdal_share_path} does not exist')
#     sys.exit(99)
#
# large_image.config.setConfig('cache_sources', False)

test_file_path = os.path.join('C:/', 'temp', 'deid', 'input', 'E22-02_ABETA_2.svs')
read_access = os.access(test_file_path, os.R_OK)
print("Test large image for read access {}".format(read_access))
source = large_image_source_openslide.open(test_file_path)
print("Large image result {}".format(source))