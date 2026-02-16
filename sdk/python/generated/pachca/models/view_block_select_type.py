from enum import Enum

class ViewBlockSelectType(str, Enum):
    SELECT = "select"

    def __str__(self) -> str:
        return str(self.value)
