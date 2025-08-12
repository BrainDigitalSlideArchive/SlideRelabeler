import io
from typing import Union, Optional

class TrackingFileIO(io.FileIO):
    """
    A FileIO subclass that tracks the number of bytes written to disk.
    """
    def __init__(self, file: Union[str, int], mode: str = 'r', closefd: bool = True,
                 opener: Optional[callable] = None):
        super().__init__(file, mode, closefd, opener)
        self._filename: str = file
        self._bytes_written: int = 0

    def write(self, data: Union[bytes, bytearray]) -> int:
        """
        Write data to the file and track the number of bytes written.
        
        Args:
            data: The data to write to the file
            
        Returns:
            The number of bytes written
        """
        bytes_written = super().write(data)
        self._bytes_written += bytes_written
        return bytes_written

    def writelines(self, lines: list[Union[bytes, bytearray]]) -> None:
        """
        Write a list of lines to the file and track the number of bytes written.
        
        Args:
            lines: List of lines to write to the file
        """
        for line in lines:
            self.write(line)

    @property
    def bytes_written(self) -> int:
        """
        Get the total number of bytes written to the file.
        
        Returns:
            The total number of bytes written
        """
        return self._bytes_written

    @property
    def filename(self) -> str:
        """
        Get the filename of the file.
        """
        return self._filename