from enum import Enum

class ViewBlockHeaderType(str, Enum):
    HEADER = "header"

    def __str__(self) -> str:
        return str(self.value)
