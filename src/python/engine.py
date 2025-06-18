# Divert the program flow in worker sub-process as soon as possible,
# before importing other modules that may spawn new processes.
import json
import os
import platform
import sys
from collections import deque

debug_msgs = deque()
error_msgs = deque()

max_debug_msgs = 100
max_error_msgs = 100

# Monkey patch libtiff to work on Apple Silicon (see https://github.com/pearu/pylibtiff/issues/178)
# import libtiff
# import ctypes

# libtiff.libtiff.TIFFGetField.argtypes = [libtiff.TIFF, ctypes.c_uint32]
# libtiff.libtiff.TIFFSetField.argtypes = [libtiff.TIFF, ctypes.c_uint32]

# Use stdout to pipe data back to the nodejs electron side
def sendToElectron(messageType, data, id=None):
    try:
        json_dump = json.dumps(dict(type=messageType, data=data, _id=id))
        print(json_dump)
        sys.stdout.flush()
    except Exception as e:
        data = {'type': messageType, 'data': data, 'error': repr(e)}
        error_msg = dict(type='error', data=data)
        print(json.dumps(error_msg))

# special wrapper for sending debug messages to the electron side
def debugMsg(msg):
    if 'data' in msg and 'function' in msg['data'] and not (msg['data']['function'] == 'get-progress' or msg['data']['function'] == 'get-errors' or msg['data']['function'] == 'get-debugs'):
        if len(debug_msgs) >= max_debug_msgs:
            debug_msgs.popleft()
        debug_msgs.append(json.dumps(msg, indent=4))
        sendToElectron('debug', json.dumps(msg, indent=4))

if __name__ == '__main__':
    import multiprocessing
    multiprocessing.freeze_support()

    json_setup = {}

    if 'NODE_ENV' in os.environ:
        json_setup['NODE_ENV'] = os.environ['NODE_ENV']
    
    if 'PATH' in os.environ:
        json_setup['PATH'] = os.environ['PATH']

    if os.name == 'nt':
        json_setup['PLATFORM'] = 'windows'
        if 'NODE_ENV' in os.environ and os.environ['NODE_ENV'] == 'development':
            large_image_tools_dir = os.path.abspath(os.path.join('.', 'src', 'python', 'DeidTools'))
            bin_dir = os.path.join(large_image_tools_dir, 'win-bin')
            os.environ['PATH'] = os.pathsep.join((bin_dir, os.environ['PATH']))
            os.add_dll_directory(bin_dir)
        elif 'NODE_ENV' in os.environ and os.environ['NODE_ENV'] == 'production':
            collected_internal_path = os.path.join('.', 'resources', 'engine', '_internal')
            collected_internal_path_2 = os.path.join('.', '_internal')
            abs_collected_internal_path = os.path.abspath(collected_internal_path)
            abs_collected_internal_path_2 = os.path.abspath(collected_internal_path_2)
            gdal_share_path = os.path.join(collected_internal_path, 'gdal')
            gdal_share_path_2 = os.path.join(collected_internal_path_2, 'gdal')
            if os.path.exists(gdal_share_path):
                json_setup['GDAL_DATA'] = gdal_share_path
                os.environ['GDAL_DATA'] = gdal_share_path
            elif os.path.exists(gdal_share_path_2):
                json_setup['GDAL_DATA'] = os.path.abspath(gdal_share_path_2)
                os.environ['GDAL_DATA'] = gdal_share_path
            else:
                json_setup['GDAL_DATA'] = None
                exit(99)
            # debugMsg(f'Adding {collected_bin_path} to PATH')
            # os.add_dll_directory(abs_collected_internal_path)
    elif platform.system() == 'Darwin':
        json_setup['PLATFORM'] = 'macos'
        if 'NODE_ENV' in os.environ and os.environ['NODE_ENV'] == 'production':
            print("The node environment is production")
            print("The platform is Darwin")
            print("The current working directory is {}".format(os.getcwd()))

    try:
        import large_image_source_openslide
    except Exception as e:
        json_setup['LARGE_IMAGE_SOURCE_OPENSLIDE_EXCEPTION'] = repr(e)

    import pyproj
    # the PROJ_DATA env var is necessary for the large_image.rasterio_file_tile_source to work correctly
    os.environ['PROJ_DATA'] = pyproj.datadir.get_data_dir()
    json_setup['PROJ_DATA'] = os.environ['PROJ_DATA']

    debugMsg(json_setup)

import traceback
import large_image
import base64

# path = os.path.join('C:\\', 'temp', 'deid', 'input', 'E22-02_ABETA_2.svs')
# source = large_image.open(path)
# print("Metadata: {}".format(source))

from DeidTools import DeidTools

deid_tools = DeidTools(supress_print=True)

openFiles = dict()
try:
    large_image.canRead()
except Exception as e:
    pass

# Response class: encapsulate sending structured responses to node/electron in response to inputs
class Response:
    def __init__(self, id, func=None, rejectMessage=None) -> None:

        self.response_json = {
            'id': id,
            'func': str(func),
            'rejectMessage': str(rejectMessage)
        }
        
        self.id = id
        if rejectMessage is not None:
            self.error(rejectMessage)
            
        else:
            try:
                self.success(func())
            except:
                exc_info = sys.exc_info()
                e = ''.join(traceback.format_exception(*exc_info))
                self.error(e)

    def success(self, s):
        self.response_json['success'] = True
        # self.response_json['data'] = s
        debugMsg(self.response_json)
        sendToElectron('success', s, self.id)

    def error(self, e):
        self.response_json['success'] = False
        self.response_json['error'] = e
        debugMsg(self.response_json)
        sendToElectron('error', e, self.id)

# listen to stdin and parse message to trigger python actions. This function blocks until the script is killed, closing stdin.
def listenToInput():
    counter = 0
    for line in sys.stdin:
        counter = counter+1

        listen_json = {
            'counter': counter,
            'line': line
        }

        input = dict()
        data = None
        id = None
        try:
            input = json.loads(line)
            id = input.get('_id')
            data = input.get('data')
            listen_json['parsed_input'] = input
            listen_json['id'] = id
            listen_json['data'] = data
            listen_json['bad_data'] = False
        except:
            listen_json['bad_data'] = True
            listen_json['error'] = f'Bad data: could not parse json for {line}'
            debugMsg(listen_json)
            Response(id, None, 'Bad data: not JSON')
            continue

        if id is None or data is None:
            listen_json['error'] = f'Bad data: input does not have fields "_id" and "data"'
            debugMsg(listen_json)
            Response(id, None, 'Bad formatting: _id and data must be present')
            continue

        requestedFunction = data.get('function')
        inputData = data.get('data')

        listen_json['requestedFunction'] = requestedFunction
        listen_json['inputData'] = inputData

        debugMsg(listen_json)
        
        try:
            if(requestedFunction == 'metadata'):
                Response(id, lambda: getMetadata(inputData))
            elif(requestedFunction == 'thumbnail'):
                Response(id, lambda: getThumbnail(inputData))
            elif(requestedFunction == 'macro'):
                Response(id, lambda: get_macro(inputData))
            elif(requestedFunction == 'label'):
                Response(id, lambda: getLabel(inputData))
            elif(requestedFunction == 'preview-label'):
                Response(id, lambda: preview_label(inputData))
            elif(requestedFunction == 'preview-macro'):
                Response(id, lambda: preview_macro(inputData))
            elif(requestedFunction == 'preview-metadata'):
                Response(id, lambda: preview_metadata(inputData))
            elif(requestedFunction == 'image'):
                Response(id, lambda: getImage(inputData))
            elif(requestedFunction == 'tile'):
                Response(id, lambda: getTile(inputData))
            elif(requestedFunction == 'deid-process'):
                Response(id, lambda: deid_process(inputData))
            elif(requestedFunction == 'get-progress'):
                Response(id, lambda: get_progress(inputData))
            elif(requestedFunction == 'get-errors'):
                Response(id, lambda: get_errors())
            elif(requestedFunction == 'clear-errors'):
                Response(id, lambda: clear_errors())
            elif(requestedFunction == 'get-debugs'):
                Response(id, lambda: get_debugs())
            elif(requestedFunction == 'clear-debugs'):
                Response(id, lambda: clear_debugs())
            elif(requestedFunction == 'get-output-path'):
                Response(id, lambda: get_output_path(inputData))
            else:
                listen_json['error'] = f'Unknown function: {requestedFunction}'
                debugMsg(listen_json)
                Response(id, lambda: listen_json['error'])
        
        # If exception is raised, add error message so frontend can display it
        except Exception as e:
            if len(error_msgs) >= max_error_msgs:
                error_msgs.popleft()
            error_msgs.append(repr(e))
            debugMsg({
                'python_exception': repr(e)
            })

def get_errors():
    return json.dumps(list(error_msgs))

def clear_errors():
    error_msgs.clear()

def get_debugs():   
    return json.dumps(list(debug_msgs))

def clear_debugs():
    debug_msgs.clear()

def get_output_path(output_dict):
    return deid_tools.get_output_path(output_dict)

def check_set_key_value(input, key, output, bool_value=False):
    if key in input:
        if bool_value:
            if input[key] == "false":
                output[key] = False
            elif input[key] == "true":
                output[key] = True
            else:
                output[key] = bool(input[key])
        else:
            output[key] = input[key]

def get_progress(output_dict):
    return deid_tools.get_progress(output_dict)

def deid_process(output_dict):
    # temp_file = large_image_tools.create_temp_file_from_buffer(source, filename)
    info = deid_tools.apply_workflow_to_filename_with_output_dir(output_dict)
    return info

def preview_metadata(output_dict):
    prior_ifds, new_ifds, redactList = deid_tools.preview_metadata(output_dict)
    return prior_ifds, new_ifds, redactList

def preview_label(output_dict):
    # temp_file = large_image_tools.create_temp_file_from_buffer(source, filename)
    label = deid_tools.preview_label(output_dict)
    mime_type, base64_str = deid_tools.pil_to_base64(label)
    return f'data:{mime_type};base64,{base64_str}'

def preview_macro(output_dict):
    macro = deid_tools.preview_macro(output_dict)
    mime_type, base64_str = deid_tools.pil_to_base64(macro)
    return f'data:{mime_type};base64,{base64_str}'

def openFile(file, second=False):
    source = openFiles.get(file)
    if not source:
        try:
            source = large_image.open(file)
            openFiles[file] = source
        except Exception as e:
            if not second:
                return openFile(file, True)
            else:
                raise Exception('Could not open tile source for ' + file)
            # try a second time
    # debugMsg("Return open file: {}".format(file))
    return source

def getMetadata(file):
    source = openFile(file)
    output = {
        'metadata': source.getMetadata(),
        'associatedImages': source.getAssociatedImagesList(),
        'bytes': os.path.getsize(file)
    }
    return output

def getLabel(file):
    f = openFile(file)
    if f:
        image, mime_type = f.getAssociatedImage('label')
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        raise(Exception(f'Error: {file} is not open'))

def getThumbnail(file):
    f = openFile(file)
    if f:
        image, mime_type = f.getThumbnail()
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        raise(Exception(f'Error: {file} is not open'))

def get_macro(file):
    f = openFile(file)
    if f:
        image, mime_type = f.getAssociatedImage('macro')
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        raise(Exception(f'Error: could not open macro image for {file}'))
    
def getImage(d):
    filename = d.get('file')
    image = d.get('image')
    f = openFile(filename)
    if f and image:
        image, mime_type = f.getAssociatedImage(image)
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        raise(Exception(f'Error: {filename} is not open'))
    
def getTile(d):
    filename = d.get('file')
    file = openFile(filename)
    if file:
        mime_type = file.getTileMimeType()
        image = file.getTile(int(d.get('x')), int(d.get('y')), int(d.get('level')))
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        tile_error = {
            'error': f'Error: {filename} is not open',
            'files_that_are_open': openFiles.keys()
        }
        debugMsg(tile_error)            
        raise(Exception(f'Error: {filename} is not open'))
    
debugMsg({
    'running_python_code': sys.argv[0]
})

listenToInput()