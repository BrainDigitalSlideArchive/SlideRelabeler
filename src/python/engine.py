import sys
import traceback
import json
import os
import large_image
import base64

openFiles = dict()

## For JSON encoded communication: new PythonShell('script.py', {mode: 'json'} ))


# Use stdout to pipe data back to the nodejs electron side
def sendToElectron(messageType, data, id=None):
    print(json.dumps(dict(type=messageType, data=data, _id=id)))
    sys.stdout.flush()

# special wrapper for sending debug messages to the electron side
def debugMsg(msg):
    sendToElectron('debug', msg)


# Response class: encapsulate sending structured responses to node/electron in response to inputs
class Response:
    def __init__(self, id, func=None, rejectMessage=None) -> None:
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
        # debugMsg(f'Call #{self.id} succeeded')
        sendToElectron('success', s, self.id)

    def error(self, e):
        debugMsg(f'Call #{self.id} failed')
        sendToElectron('error', e, self.id)



# listen to stdin and parse message to trigger python actions. This function blocks until the script is killed, closing stdin.
def listenToInput():
    counter = 0
    for line in sys.stdin:
        counter = counter+1
        # debugMsg(f'Input {counter}: Got raw line {line}')
        input = dict()
        data = None
        id = None
        try:
            input = json.loads(line)
            id = input.get('_id')
            data = input.get('data')
        except:
            debugMsg(f'Bad data: could not parse json for {line}')
            Response(id, None, 'Bad data: not JSON')
            continue

        if id is None or data is None:
            debugMsg(f'Bad data: input does not have fields "_id" and "data"')
            Response(id, None, 'Bad formatting: _id and data must be present')
            continue

        requestedFunction = data.get('function')
        inputData = data.get('data')

        if(requestedFunction == 'open-file'):
            Response(id, lambda: openFile(inputData) )
        elif(requestedFunction == 'thumbnail'):
            Response(id, lambda: getThumbnail(inputData))
        elif(requestedFunction == 'image'):
            Response(id, lambda: getImage(inputData))
        elif(requestedFunction == 'tile'):
            Response(id, lambda: getTile(inputData))





def openFile(file):
    source = openFiles.get(file)
    if not source:
        source = large_image.open(file)
        openFiles[file] = source

    output = {
        'metadata': source.getMetadata(),
        'associatedImages': source.getAssociatedImagesList()
    }
    return output

def getThumbnail(file):
    f = openFiles.get(file)
    if f:
        image, mime_type = f.getThumbnail()
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        raise(Exception(f'Error: {file} is not open'))
    
def getImage(d):
    filename = d.get('file')
    image = d.get('image')
    f = openFiles.get(filename)
    if f and image:
        image, mime_type = f.getAssociatedImage(image)
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        raise(Exception(f'Error: {file} is not open'))
    
def getTile(d):
    filename = d.get('file')
    file = openFiles.get(filename)
    if file:
        mime_type = file.getTileMimeType()
        image = file.getTile(int(d.get('x')), int(d.get('y')), int(d.get('level')))
        return f'data:{mime_type};base64,{base64.b64encode(image).decode("ascii")}'
    else:
        debugMsg(f'Error: {filename} is not open')
        debugMsg('Files that are open:')
        for key in openFiles.keys():
            debugMsg(key)

        raise(Exception(f'Error: {filename} is not open'))
    

    
debugMsg(f'Python code is running at {sys.argv[0]}')

listenToInput()

