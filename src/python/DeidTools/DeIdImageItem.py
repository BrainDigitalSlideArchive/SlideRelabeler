import os
import large_image
import large_image_source_ometiff


class DeIdImageItem:
    def __init__(self, filePath=None, metadata=None, skip_open=False):
        self.filePath = filePath
        self.filename = os.path.basename(filePath) if self.filePath else None
        self.meta = {"largeImage": {'fileId': None}}
        self._largeImagePath = self.filePath
        # Store on _tile_source only — never assign self.tileSource (shadows helpers).
        self._tile_source = None

        if metadata is not None:
            self.metadata = metadata
            if 'name' in self.metadata:
                self.name = self.metadata['name']
            else:
                self.name = os.path.basename(filePath) if self.filePath else None
        else:
            self.metadata = {}

        # skip_open: CZI Process/Compare uses path-only stub (no OpenSlide / large_image).
        if filePath is not None and not skip_open:
            self._tile_source = large_image.open(filePath)

    @property
    def tileSource(self):
        """Opened large_image tile source, or None if skip_open / not opened."""
        return self._tile_source

    @tileSource.setter
    def tileSource(self, value):
        self._tile_source = value

    @staticmethod
    def tile_source_from_item(item):
        """
        Open / resolve a tile source for ``item`` (DSA ``ImageItem().tileSource(item)``).

        Prefer this over assigning onto ``tileSource``, which must remain a property.
        """
        if isinstance(item, DeIdImageItem):
            if item._tile_source is not None:
                return item._tile_source
            if item.filePath:
                item._tile_source = large_image.open(item.filePath)
                return item._tile_source
            raise RuntimeError('DeIdImageItem has no filePath to open')
        if isinstance(item, str) or isinstance(item, os.PathLike):
            return large_image.open(item)
        # Girder-style item with file path attribute
        path = getattr(item, 'filePath', None) or getattr(item, '_largeImagePath', None)
        if path:
            return large_image.open(path)
        raise TypeError(f'Cannot resolve tile source for {type(item)!r}')

    def update_metadata(self, new_metadata):
        self.metadata.update(new_metadata)

    def get_metadata(self):
        return self.metadata

    def get_meta(self):
        return self.metadata

    def get_tile_source(self, *args, **kwargs):
        print("Crap nuggets")
        pass

    def __iter__(self):
        for key, value in self.meta.items():
            yield (key, value)

    def getMetadata(self, item, **kwargs):
        if self._tile_source is None:
            raise RuntimeError('tile source is not open')
        return self._tile_source.getMetadata()

    def get(self, key, default=None):
        return self.meta.get(key, default)

    def _getLargeImagePath(self, item=None, **kwargs):
        return self.filePath

    def __getitem__(self, key):
        if key == "name":
            return self.name
        else:
            return self.meta.get(key, None)
