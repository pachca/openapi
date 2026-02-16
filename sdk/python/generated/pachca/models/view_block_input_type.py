from enum import Enum

class ViewBlockInputType(str, Enum):
    INPUT = "input"

    def __str__(self) -> str:
        return str(self.value)
