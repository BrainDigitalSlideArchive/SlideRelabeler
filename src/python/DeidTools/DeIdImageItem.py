import os
import large_image
import large_image_source_ometiff

class DeIdImageItem:
    def __init__(self, filePath=None, metadata=None):
        # print(filePath,"is the file path")

        self.filePath = filePath
        self.filename = os.path.basename(filePath) if self.filePath else None
        #  self.largeImage = self.tileSource.getMetadata() if self.tileSource else None
        self.meta = {"largeImage": {'fileId': None}}
        self._largeImagePath = self.filePath

        if metadata is not None:
            self.metadata = metadata
            if 'name' in self.metadata:
                self.name = self.metadata['name']
            else:
                self.name = os.path.basename(filePath) if self.filePath else None
        else:
            self.metadata = {}

        ## TO DO ADD AN ERROR IF TILESOURCE IS NOT ACCESSIBLE / CAN BE OPENED
        if filePath is not None:
            self.tileSource = large_image.open(filePath)

    def tileSource(self, tile_source):
        if isinstance(tile_source, str) or isinstance(tile_source, os.PathLike) and os.path.isfile(tile_source):
            self.tileSource = large_image.open(tile_source)
        elif isinstance(tile_source, DeIdImageItem):
            item_iterable = [a for a in dir(self) if not a.startswith('__')]
            for attr in item_iterable:
                setattr(self, attr, getattr(tile_source, attr))
            self.tileSource = large_image.open(self.filePath)
            return self.tileSource

    def update_metadata(self, new_metadata):
        self.metadata.update(new_metadata)

    def get_metadata(self):
        return self.metadata

    def get_meta(self):
        return self.metadata

    def get_tile_source(self, *args, **kwargs):
        # Your implementation here
        print("Crap nuggets")
        pass

    def __iter__(self):
        for key, value in self.meta.items():
            yield (key, value)

    def getMetadata(self, item, **kwargs):

        return self.tileSource().getMetadata()

    def get(self, key, default=None):
        return self.meta.get(key, default)

    def _getLargeImagePath(self, item, **kwargs):
        return self.filePath

    def __getitem__(self, key):
        if key == "name":
            return self.name
        else:
            return self.meta.get(key, None)