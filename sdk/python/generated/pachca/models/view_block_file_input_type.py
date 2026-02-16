from enum import Enum

class ViewBlockFileInputType(str, Enum):
    FILE_INPUT = "file_input"

    def __str__(self) -> str:
        return str(self.value)
